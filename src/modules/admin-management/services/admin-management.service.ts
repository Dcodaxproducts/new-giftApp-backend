import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminRole, Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { MailerService } from '../../mailer/mailer.service';
import {
  AdminStatusFilter,
  CreateAdminDto,
  ListAdminsDto,
  PermanentlyDeleteAdminDto,
  ResetAdminPasswordDto,
  SortOrderDto,
  UpdateAdminActiveStatusDto,
  UpdateAdminDto,
} from '../dto/admin-management.dto';
import { AdminManagementRepository } from '../repositories/admin-management.repository';

@Injectable()
export class AdminManagementService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly auditLog: AuditLogWriterService,
    private readonly repository: AdminManagementRepository,
  ) {}

  async create(user: AuthUserContext, dto: CreateAdminDto) {
    const adminRole = await this.getAdminRole(dto.roleId);
    const temporaryPassword = dto.generateTemporaryPassword === false
      ? dto.temporaryPassword
      : (dto.temporaryPassword ?? this.generateTemporaryPassword());

    if (!temporaryPassword) {
      throw new BadRequestException('Temporary password is required when generateTemporaryPassword is false');
    }

    const admin = await this.createAdminUser({
      email: dto.email,
      password: temporaryPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      isActive: dto.isActive ?? true,
      mustChangePassword: dto.mustChangePassword ?? true,
      adminTitle: dto.title?.trim(),
      adminRoleId: adminRole.id,
      avatarUrl: dto.avatarUrl,
      adminPermissions: adminRole.permissions ?? {},
    });

    let inviteEmailSent = false;
    if (dto.sendInviteEmail) {
      try {
        await this.mailerService.sendAdminInviteEmail({
          email: admin.email,
          userName: `${admin.firstName} ${admin.lastName}`.trim(),
          temporaryPassword,
          mustChangePassword: admin.mustChangePassword,
          ctaUrl: `${this.configService.get<string>('APP_FRONTEND_URL', 'https://app.giftapp.com').replace(/\/$/, '')}/admin`,
        });
        inviteEmailSent = true;
      } catch {
        inviteEmailSent = false;
      }
    }

    await this.auditLog.write({
      actorId: user.uid,
      targetId: admin.id,
      targetType: 'ADMIN',
      action: 'ADMIN_CREATED',
      afterJson: this.toAdminListItem(admin, adminRole),
    });

    return {
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        roleId: adminRole.id,
        inviteEmailSent,
      },
      message: dto.sendInviteEmail
        ? inviteEmailSent
          ? 'Admin staff user created successfully and invite email sent.'
          : 'Admin staff user created successfully, but invite email could not be sent.'
        : 'Admin staff user created successfully.',
    };
  }

  async list(_user: AuthUserContext, query: ListAdminsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.UserWhereInput = {
      role: UserRole.ADMIN,
      deletedAt: null,
      ...(query.roleId ? { adminRoleId: query.roleId } : {}),
      ...(query.role ? { adminRole: { slug: query.role } } : {}),
      ...(query.status === AdminStatusFilter.ACTIVE ? { isActive: true } : {}),
      ...(query.status === AdminStatusFilter.DISABLED ? { isActive: false } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === SortOrderDto.ASC ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.repository.findManyAdmins({
        where,
        include: { adminRole: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.repository.countAdmins(where),
    ]);

    return {
      data: items.map((admin) => this.toAdminListItem(admin, admin.adminRole)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Admins fetched successfully',
    };
  }

  async details(_user: AuthUserContext, id: string) {
    const admin = await this.getAdmin(id);
    return {
      data: this.toAdminDetail(admin, admin.adminRole),
      message: 'Admin details fetched successfully',
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateAdminDto) {
    const admin = await this.getAdmin(id);
    if (user.uid === admin.id && dto.isActive === false) {
      throw new ForbiddenException('Super Admin cannot deactivate self');
    }
    if (admin.role === UserRole.SUPER_ADMIN && dto.roleId) {
      throw new ForbiddenException('Super Admin cannot be downgraded');
    }
    if (admin.role === UserRole.SUPER_ADMIN && dto.isActive === false) {
      await this.assertAnotherActiveSuperAdminExists(admin.id);
    }
    const adminRole = dto.roleId ? await this.getAdminRole(dto.roleId) : admin.adminRole;
    const before = this.toAdminDetail(admin, admin.adminRole);
    const updated = await this.repository.updateAdminUser(admin.id, {
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      phone: dto.phone?.trim(),
      avatarUrl: dto.avatarUrl,
      adminTitle: dto.title?.trim(),
      adminRoleId: dto.roleId,
      adminPermissions: adminRole?.permissions ?? undefined,
      isActive: dto.isActive,
      refreshTokenHash: dto.isActive === false ? null : admin.refreshTokenHash,
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: admin.id,
      targetType: 'ADMIN',
      action: 'ADMIN_UPDATED',
      beforeJson: before,
      afterJson: this.toAdminDetail(updated, updated.adminRole),
    });

    return {
      data: this.toAdminDetail(updated, updated.adminRole),
      message: 'Admin updated successfully',
    };
  }

  async updateActiveStatus(user: AuthUserContext, id: string, dto: UpdateAdminActiveStatusDto) {
    await this.update(user, id, { isActive: dto.isActive });
    return {
      data: { id, isActive: dto.isActive },
      message: dto.isActive ? 'Admin enabled successfully' : 'Admin disabled successfully',
    };
  }

  async resetPassword(user: AuthUserContext, id: string, dto: ResetAdminPasswordDto) {
    const admin = await this.getAdmin(id);
    const temporaryPassword = dto.temporaryPassword ?? this.generateTemporaryPassword();
    await this.repository.updateAdminPasswordHash(admin.id, await bcrypt.hash(temporaryPassword, 10), dto.mustChangePassword ?? true);
    await this.auditLog.write({
      actorId: user.uid,
      targetId: admin.id,
      targetType: 'ADMIN',
      action: 'ADMIN_PASSWORD_RESET',
      afterJson: { mustChangePassword: dto.mustChangePassword ?? true },
    });

    return { data: null, message: 'Temporary password generated successfully' };
  }

  async permanentlyDelete(user: AuthUserContext, id: string, dto: PermanentlyDeleteAdminDto) {
    if (dto.confirmation !== 'PERMANENTLY_DELETE_ADMIN') {
      throw new BadRequestException('Invalid permanent delete confirmation text');
    }

    if (user.uid === id) {
      throw new ForbiddenException('Super Admin cannot permanently delete self');
    }

    const admin = await this.getAdmin(id);
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN staff users can be permanently deleted');
    }

    await this.auditLog.write({
      actorId: user.uid,
      targetId: admin.id,
      targetType: 'ADMIN',
      action: 'ADMIN_STAFF_PERMANENTLY_DELETED',
      beforeJson: { id: admin.id, email: admin.email, role: admin.role },
      afterJson: { reason: dto.reason },
    });
    await this.repository.deleteAdminPermanently(admin.id);

    return { data: { deletedAdminId: admin.id }, message: 'Admin staff user permanently deleted successfully.' };
  }

  private async createAdminUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    mustChangePassword: boolean;
    adminRoleId?: string;
    adminTitle?: string;
    avatarUrl?: string;
    adminPermissions?: Prisma.InputJsonValue;
  }): Promise<User> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.repository.findAdminByEmail(email);

    if (existing) {
      throw new ConflictException('User already exists');
    }

    return this.repository.createAdminUser({
      email,
      password: await bcrypt.hash(input.password, 10),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim(),
      avatarUrl: input.avatarUrl,
      role: UserRole.ADMIN,
      adminRoleId: input.adminRoleId,
      isVerified: true,
      isActive: input.isActive,
      isApproved: true,
      mustChangePassword: input.mustChangePassword,
      providerApprovalStatus: null,
      adminTitle: input.adminTitle,
      adminPermissions: input.adminPermissions ?? undefined,
      verificationOtp: this.generateOtp(),
      verificationOtpExpiresAt: this.generateOtpExpiry(),
    });
  }

  private async assertAnotherActiveSuperAdminExists(currentSuperAdminId: string): Promise<void> {
    const activeSuperAdmins = await this.repository.countOtherActiveSuperAdmins(currentSuperAdminId);
    if (activeSuperAdmins === 0) {
      throw new ForbiddenException('Last active Super Admin cannot be disabled');
    }
  }

  private async getAdmin(id: string): Promise<User & { adminRole: AdminRole | null }> {
    const admin = await this.repository.findAdminById(id);
    if (!admin || admin.deletedAt || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN)) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  private async getAdminRole(roleId: string): Promise<AdminRole> {
    const role = await this.repository.findAdminRoleById(roleId);
    if (!role || role.deletedAt || !role.isActive) {
      throw new NotFoundException('Admin role not found');
    }
    return role;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private generateOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private generateTemporaryPassword(): string {
    return `Gift@${randomInt(100000, 1000000)}`;
  }

  private toAdminListItem(admin: User, adminRole: AdminRole | null) {
    return {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      fullName: `${admin.firstName} ${admin.lastName}`.trim(),
      email: admin.email,
      phone: admin.phone,
      avatarUrl: admin.avatarUrl,
      role: adminRole
        ? { id: adminRole.id, name: adminRole.name, slug: adminRole.slug }
        : { id: admin.role, name: this.titleCase(admin.role), slug: admin.role },
      isActive: admin.isActive,
      isVerified: admin.isVerified,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }

  private toAdminDetail(admin: User, adminRole: AdminRole | null) {
    return {
      ...this.toAdminListItem(admin, adminRole),
      title: admin.adminTitle,
      mustChangePassword: admin.mustChangePassword,
      role: adminRole
        ? {
            id: adminRole.id,
            name: adminRole.name,
            slug: adminRole.slug,
            description: adminRole.description,
          }
        : {
            id: admin.role,
            name: this.titleCase(admin.role),
            slug: admin.role,
            description: null,
          },
      permissions: adminRole?.permissions ?? admin.adminPermissions ?? {},
    };
  }

  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
