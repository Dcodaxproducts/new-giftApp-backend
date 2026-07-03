import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaffRole, Prisma, StaffProfile, User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerService } from '../mailer/mailer.service';
import {
  AdminStatusFilter,
  CreateAdminDto,
  ListAdminsDto,
  ResetAdminPasswordDto,
  SortOrderDto,
  UpdateAdminDto,
} from './dto/staff-management.dto';
import { StaffManagementRepository } from './staff-management.repository';
import { getPagination } from '../../common/pagination/pagination.util';
import { isUserActiveStatus, isUserVerifiedStatus } from '../../common/utils/user-status.util';

type StaffUser = User & { staffProfile: (StaffProfile & { staffRole: StaffRole | null }) | null };

@Injectable()
export class StaffManagementService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly auditLog: AuditLogWriterService,
    private readonly repository: StaffManagementRepository,
  ) {}

  async create(user: AuthUserContext, dto: CreateAdminDto) {
    const staffRole = await this.getStaffRole(dto.roleId);
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
      staffRoleId: staffRole.id,
      avatarUrl: dto.avatarUrl,
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
      afterJson: this.toAdminListItem(admin, staffRole),
    });

    return {
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        roleId: staffRole.id,
        inviteEmailSent,
      },
      message: dto.sendInviteEmail
        ? inviteEmailSent
          ? 'Staff user created successfully and invite email sent.'
          : 'Staff user created successfully, but invite email could not be sent.'
        : 'Staff user created successfully.',
    };
  }

  async list(_user: AuthUserContext, query: ListAdminsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.UserWhereInput = {
      role: UserRole.STAFF,
      ...(query.roleId ? { staffProfile: { staffRoleId: query.roleId } } : {}),
      ...(query.role ? { staffProfile: { staffRole: { slug: query.role } } } : {}),
      ...(query.status === AdminStatusFilter.ACTIVE ? { status: UserStatus.APPROVED } : {}),
      ...(query.status === AdminStatusFilter.DISABLED ? { status: UserStatus.BLOCKED } : {}),
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
        include: { staffProfile: { include: { staffRole: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip, take,
      }),
      this.repository.countAdmins(where),
    ]);

    return {
      data: items.map((admin) => this.toAdminListItem(admin, this.staffRoleFor(admin))),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Staff fetched successfully',
    };
  }

  async details(_user: AuthUserContext, id: string) {
    const admin = await this.getAdmin(id);
    return {
      data: this.toAdminDetail(admin, this.staffRoleFor(admin)),
      message: 'Staff details fetched successfully',
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
    const currentStaffRole = this.staffRoleFor(admin);
    const targetStaffRole = dto.roleId ? await this.getStaffRole(dto.roleId) : currentStaffRole;
    const email = dto.email ? await this.assertEmailAvailable(dto.email, admin.id) : undefined;
    const before = this.toAdminDetail(admin, currentStaffRole);
    const updated = await this.repository.updateAdminUser(admin.id, {
      userData: {
        email,
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        phone: dto.phone?.trim(),
        avatarUrl: dto.avatarUrl,
        status: dto.isActive === undefined ? undefined : dto.isActive ? UserStatus.APPROVED : UserStatus.BLOCKED,
        refreshTokenHash: dto.isActive === false ? null : admin.refreshTokenHash,
      },
      staffProfileData: admin.role === UserRole.STAFF
        ? {
            staffRoleId: dto.roleId,
          }
        : undefined,
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: admin.id,
      targetType: 'ADMIN',
      action: 'ADMIN_UPDATED',
      beforeJson: { ...before, reason: dto.reason },
      afterJson: { ...this.toAdminDetail(updated, targetStaffRole), reason: dto.reason },
    });

    return {
      data: this.toAdminDetail(updated, targetStaffRole),
      message: 'Staff updated successfully',
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

  async permanentlyDelete(user: AuthUserContext, id: string) {
    if (user.uid === id) {
      throw new ForbiddenException('Super Admin cannot permanently delete self');
    }

    const admin = await this.getAdmin(id);
    if (admin.role !== UserRole.STAFF) {
      throw new ForbiddenException('Only STAFF users can be permanently deleted');
    }

    await this.auditLog.write({
      actorId: user.uid,
      targetId: admin.id,
      targetType: 'ADMIN',
      action: 'ADMIN_STAFF_PERMANENTLY_DELETED',
      beforeJson: { id: admin.id, email: admin.email, role: admin.role },
      afterJson: null,
    });
    await this.repository.deleteAdminPermanently(admin.id);

    return { data: { deletedStaffId: admin.id }, message: 'Staff user permanently deleted successfully.' };
  }

  private async assertEmailAvailable(email: string, currentAdminId: string): Promise<string> {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.repository.findAdminByEmail(normalizedEmail);
    if (existing && existing.id !== currentAdminId) {
      throw new ConflictException('User already exists');
    }
    return normalizedEmail;
  }

  private async createAdminUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    mustChangePassword: boolean;
    staffRoleId?: string;
    avatarUrl?: string;
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
      role: UserRole.STAFF,
      status: input.isActive ? UserStatus.APPROVED : UserStatus.BLOCKED,
      mustChangePassword: input.mustChangePassword,
      staffProfile: {
        create: {
          ...(input.staffRoleId ? { staffRole: { connect: { id: input.staffRoleId } } } : {}),
        },
      },
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

  private async getAdmin(id: string): Promise<StaffUser> {
    const admin = await this.repository.findAdminById(id);
    if (!admin || (admin.role !== UserRole.STAFF && admin.role !== UserRole.SUPER_ADMIN)) {
      throw new NotFoundException('Staff user not found');
    }
    return admin;
  }

  private async getStaffRole(roleId: string): Promise<StaffRole> {
    const role = await this.repository.findStaffRoleById(roleId);
    if (!role) {
      throw new NotFoundException('Staff role not found');
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

  private toAdminListItem(admin: User, staffRole: StaffRole | null) {
    return {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      fullName: `${admin.firstName} ${admin.lastName}`.trim(),
      email: admin.email,
      phone: admin.phone,
      avatarUrl: admin.avatarUrl,
      role: staffRole
        ? { id: staffRole.id, name: staffRole.name, slug: staffRole.slug }
        : { id: admin.role, name: this.titleCase(admin.role), slug: admin.role },
      isActive: isUserActiveStatus(admin.status),
      isVerified: isUserVerifiedStatus(admin.status),
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }

  private toAdminDetail(admin: User, staffRole: StaffRole | null) {
    return {
      ...this.toAdminListItem(admin, staffRole),
      mustChangePassword: admin.mustChangePassword,
      role: staffRole
        ? {
            id: staffRole.id,
            name: staffRole.name,
            slug: staffRole.slug,
            description: staffRole.description,
          }
        : {
            id: admin.role,
            name: this.titleCase(admin.role),
            slug: admin.role,
            description: null,
          },
      permissions: staffRole?.permissions ?? {},
    };
  }

  private staffProfileFor(admin: User): (StaffProfile & { staffRole?: StaffRole | null }) | null {
    return 'staffProfile' in admin ? ((admin as StaffUser).staffProfile ?? null) : null;
  }

  private staffRoleFor(admin: User): StaffRole | null {
    return this.staffProfileFor(admin)?.staffRole ?? null;
  }

  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
