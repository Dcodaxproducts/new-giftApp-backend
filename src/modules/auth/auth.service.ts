import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  LoginAttemptStatus,
  AdminRole,
  CustomerSubscriptionStatus,
  Prisma,
  ProviderApprovalStatus,
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AuthPasswordRepository } from './auth-password.repository';
import { AuthRepository } from './auth.repository';
import { AuthSessionsRepository } from './auth-sessions.repository';
import { LoginAttemptsService } from '../login-attempts/login-attempts.service';
import { MailerService } from '../mailer/mailer.service';
import { CustomerReferralsService } from '../customer-referrals/customer-referrals.service';
import {
  GuestSessionDto,
  RejectProviderDto,
  UpdateUserActiveStatusDto,
} from './dto/admin-auth.dto';
import {
  AdminStatusFilter,
  CreateAdminDto,
  CreateAdminRoleDto,
  ListAdminRolesDto,
  ListAdminsDto,
  PermanentlyDeleteAdminDto,
  ResetAdminPasswordDto,
  SortOrderDto,
  UpdateAdminActiveStatusDto,
  UpdateAdminDto,
  UpdateAdminRoleDto,
  UpdateRolePermissionsDto,
} from './dto/admin-management.dto';
import { ListAuditLogsDto } from './dto/audit-logs.dto';
import { PERMISSION_CATALOG, SUPER_ADMIN_PERMISSIONS } from './permission-catalog';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterProviderDto,
  RegisterUserDto,
  ResetPasswordDto,
  UpdateOwnProfileDto,
  VerifyEmailDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';

interface TokenPayload {
  uid: string;
  role: UserRole;
  permissions?: Prisma.JsonValue;
  type?: 'refresh';
  sessionId?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginAttemptsService: LoginAttemptsService,
    private readonly mailerService: MailerService,
    private readonly authRepository: AuthRepository,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly authPasswordRepository: AuthPasswordRepository,
    @Optional() private readonly customerReferralsService?: CustomerReferralsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSingleSuperAdmin();
  }

  async registerUser(dto: RegisterUserDto) {
    await this.customerReferralsService?.assertValidReferralCode(dto.referralCode);
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.REGISTERED_USER,
      isApproved: true,
      providerApprovalStatus: null,
    });
    await this.customerReferralsService?.captureSignupReferral(user.id, dto.referralCode);
    await this.mailerService.sendVerificationEmail(
      user.email,
      this.requiredOtp(user.verificationOtp),
    );
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: await this.toAuthUser(user),
        ...tokens,
      },
      message: 'Registered user account created. Verify email with OTP.',
    };
  }

  async registerProvider(dto: RegisterProviderDto) {
    await this.getProviderBusinessCategory(dto.businessCategoryId);
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.PROVIDER,
      isApproved: false,
      providerApprovalStatus: ProviderApprovalStatus.PENDING,
      providerBusinessName: dto.businessName.trim(),
      providerBusinessCategoryId: dto.businessCategoryId,
      providerTaxId: dto.taxId?.trim(),
      providerBusinessAddress: dto.businessAddress.trim(),
      providerFulfillmentMethods: dto.fulfillmentMethods,
      providerAutoAcceptOrders: dto.autoAcceptOrders ?? false,
    });
    await this.mailerService.sendVerificationEmail(
      user.email,
      this.requiredOtp(user.verificationOtp),
    );
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: await this.toAuthUser(user),
        ...tokens,
      },
      message: 'Provider application submitted for Super Admin approval.',
    };
  }

  createGuestSession(dto: GuestSessionDto) {
    return {
      data: {
        role: 'GUEST_USER',
        capabilities: dto.capabilities ?? [
          'VIEW_ONBOARDING',
          'EXPLORE_FEATURES',
        ],
      },
      message: 'Guest session initialized',
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string | string[]) {
    await this.loginAttemptsService.assertLoginAllowed(dto.email).catch(async (error) => {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.BLOCKED,
        reason: 'RATE_LIMITED',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
      });
      throw error;
    });

    const user = await this.authRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'INVALID_CREDENTIALS',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user?.id,
        role: user?.role,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt && user.deleteAfter && user.deleteAfter > new Date()) {
      return {
        data: {
          user: await this.toAuthUser(user),
          deletionState: this.toDeletionState(user),
        },
        message: 'Account is scheduled for deletion. Cancel deletion to login.',
      };
    }

    if (!user.isActive || user.deletedAt) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'INACTIVE_ACCOUNT',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.isVerified) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'EMAIL_NOT_VERIFIED',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Please verify your email before login');
    }

    if (user.role === UserRole.PROVIDER && !user.isApproved) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'PROVIDER_PENDING_APPROVAL',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Provider account is pending Super Admin approval');
    }

    if (user.role === UserRole.ADMIN && !user.isApproved) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'ADMIN_NOT_APPROVED',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Admin account is not approved');
    }

    if (
      user.role === UserRole.ADMIN &&
      (!user.adminRoleId || !user.adminRole || user.adminRole.deletedAt || !user.adminRole.isActive)
    ) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'ADMIN_ROLE_INACTIVE',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Admin role is inactive or missing');
    }

    const tokens = await this.issueTokens(user, undefined, ipAddress, this.normalizeUserAgent(userAgent));
    await this.authRepository.updateLastLoginAt(user.id);
    await this.loginAttemptsService.record({
      email: dto.email,
      status: LoginAttemptStatus.SUCCESS,
      ipAddress,
      userAgent: this.normalizeUserAgent(userAgent),
      userId: user.id,
      role: user.role,
    });

    return {
      data: {
        user: await this.toAuthUser(user),
        ...tokens,
      },
      message: 'Login successful',
    };
  }

  async createAdmin(_user: AuthUserContext, dto: CreateAdminDto) {
    const adminRole = await this.getAdminRole(dto.roleId);
    const temporaryPassword = dto.generateTemporaryPassword === false
      ? dto.temporaryPassword
      : (dto.temporaryPassword ?? this.generateTemporaryPassword());

    if (!temporaryPassword) {
      throw new BadRequestException('Temporary password is required when generateTemporaryPassword is false');
    }

    const admin = await this.createUser({
      email: dto.email,
      password: temporaryPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.ADMIN,
      isApproved: true,
      isVerified: true,
      isActive: dto.isActive ?? true,
      mustChangePassword: dto.mustChangePassword ?? true,
      providerApprovalStatus: null,
      adminTitle: dto.title?.trim(),
      adminRoleId: adminRole?.id,
      avatarUrl: dto.avatarUrl,
      adminPermissions: adminRole?.permissions ?? {},
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

    await this.recordAudit(_user.uid, admin.id, 'ADMIN_CREATED', null, this.toAdminListItem(admin, adminRole));

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

  async listAdmins(_user: AuthUserContext, query: ListAdminsDto) {
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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { adminRole: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items.map((admin) => this.toAdminListItem(admin, admin.adminRole)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Admins fetched successfully',
    };
  }

  async adminDetails(_user: AuthUserContext, adminId: string) {
    const admin = await this.getAdmin(adminId);
    return {
      data: this.toAdminDetail(admin, admin.adminRole),
      message: 'Admin details fetched successfully',
    };
  }

  async updateAdmin(user: AuthUserContext, adminId: string, dto: UpdateAdminDto) {
    const admin = await this.getAdmin(adminId);
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
    const updated = await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        phone: dto.phone?.trim(),
        avatarUrl: dto.avatarUrl,
        adminTitle: dto.title?.trim(),
        adminRoleId: dto.roleId,
        adminPermissions: adminRole?.permissions ?? undefined,
        isActive: dto.isActive,
        refreshTokenHash: dto.isActive === false ? null : admin.refreshTokenHash,
      },
      include: { adminRole: true },
    });
    await this.recordAudit(user.uid, admin.id, 'ADMIN_UPDATED', before, this.toAdminDetail(updated, updated.adminRole));

    return {
      data: this.toAdminDetail(updated, updated.adminRole),
      message: 'Admin updated successfully',
    };
  }

  async updateAdminActiveStatus(user: AuthUserContext, adminId: string, dto: UpdateAdminActiveStatusDto) {
    await this.updateAdmin(user, adminId, { isActive: dto.isActive });
    return {
      data: { id: adminId, isActive: dto.isActive },
      message: dto.isActive ? 'Admin enabled successfully' : 'Admin disabled successfully',
    };
  }

  async resetAdminPassword(user: AuthUserContext, adminId: string, dto: ResetAdminPasswordDto) {
    const admin = await this.getAdmin(adminId);
    const temporaryPassword = dto.temporaryPassword ?? this.generateTemporaryPassword();
    await this.prisma.user.update({
      where: { id: admin.id },
      data: {
        password: await bcrypt.hash(temporaryPassword, 10),
        mustChangePassword: dto.mustChangePassword ?? true,
        refreshTokenHash: null,
      },
    });
    await this.recordAudit(user.uid, admin.id, 'ADMIN_PASSWORD_RESET', null, { mustChangePassword: dto.mustChangePassword ?? true });

    return { data: null, message: 'Temporary password generated successfully' };
  }


  async permanentlyDeleteAdmin(user: AuthUserContext, adminId: string, dto: PermanentlyDeleteAdminDto) {
    if (dto.confirmation !== 'PERMANENTLY_DELETE_ADMIN') {
      throw new BadRequestException('Invalid permanent delete confirmation text');
    }

    if (user.uid === adminId) {
      throw new ForbiddenException('Super Admin cannot permanently delete self');
    }

    const admin = await this.getAdmin(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN staff users can be permanently deleted');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.adminAuditLog.create({
        data: {
          actorId: user.uid,
          targetId: admin.id,
          targetType: 'ADMIN',
          action: 'ADMIN_STAFF_PERMANENTLY_DELETED',
          beforeJson: { id: admin.id, email: admin.email, role: admin.role },
          afterJson: { reason: dto.reason },
        },
      });
      await tx.authSession.deleteMany({ where: { userId: admin.id } });
      await tx.loginAttempt.updateMany({ where: { userId: admin.id }, data: { userId: null } });
      await tx.adminAuditLog.updateMany({ where: { actorId: admin.id }, data: { actorId: null } });
      await tx.accountSuspension.deleteMany({ where: { accountId: admin.id } });
      await tx.notification.deleteMany({ where: { recipientId: admin.id } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: admin.id } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: admin.id } });
      await tx.user.delete({ where: { id: admin.id } });
    });

    return { data: { deletedAdminId: admin.id }, message: 'Admin staff user permanently deleted successfully.' };
  }

  async listAdminRoles(_user: AuthUserContext, query: ListAdminRolesDto) {
    const where: Prisma.AdminRoleWhereInput = {
      deletedAt: null,
      isSystem: query.isSystem,
      isActive: query.isActive,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const roles = await this.prisma.adminRole.findMany({
      where,
      include: { _count: { select: { admins: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: role.isSystem,
        isActive: role.isActive,
        adminCount: role._count.admins,
        createdAt: role.createdAt,
      })),
      message: 'Admin roles fetched successfully',
    };
  }

  async adminRoleDetails(_user: AuthUserContext, roleId: string) {
    const role = await this.getAdminRole(roleId);
    return { data: this.toAdminRole(role), message: 'Admin role fetched successfully' };
  }

  async createAdminRole(user: AuthUserContext, dto: CreateAdminRoleDto) {
    const slug = this.slugify(dto.name);
    const existing = await this.prisma.adminRole.findUnique({ where: { slug } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Admin role already exists');
    }
    const role = await this.prisma.adminRole.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
        permissions: dto.permissions,
        isSystem: false,
      },
    });
    await this.recordAudit(user.uid, null, 'ADMIN_ROLE_CREATED', null, this.toAdminRole(role));
    return { data: this.toAdminRole(role), message: 'Admin role created successfully' };
  }

  async updateAdminRole(user: AuthUserContext, roleId: string, dto: UpdateAdminRoleDto) {
    const role = await this.getAdminRole(roleId);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const before = this.toAdminRole(role);
    const updated = await this.prisma.adminRole.update({
      where: { id: role.id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        isActive: dto.isActive,
      },
    });
    await this.recordAudit(user.uid, null, 'ADMIN_ROLE_UPDATED', before, this.toAdminRole(updated));
    return { data: this.toAdminRole(updated), message: 'Admin role updated successfully' };
  }

  async updateRolePermissions(user: AuthUserContext, roleId: string, dto: UpdateRolePermissionsDto) {
    const role = await this.getAdminRole(roleId);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const before = this.toAdminRole(role);
    const updated = await this.prisma.adminRole.update({
      where: { id: role.id },
      data: { permissions: dto.permissions },
    });
    await this.prisma.user.updateMany({
      where: { adminRoleId: role.id },
      data: { adminPermissions: dto.permissions },
    });
    await this.recordAudit(user.uid, null, 'ADMIN_ROLE_PERMISSIONS_UPDATED', before, this.toAdminRole(updated));

    return {
      data: { id: updated.id, permissions: updated.permissions },
      message: 'Role permissions updated successfully',
    };
  }

  async deleteAdminRole(user: AuthUserContext, roleId: string) {
    const role = await this.getAdminRole(roleId);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    const adminCount = await this.prisma.user.count({ where: { adminRoleId: role.id, deletedAt: null } });
    if (adminCount > 0) {
      throw new BadRequestException('Role cannot be deleted while admins are assigned to it');
    }
    await this.prisma.adminRole.delete({ where: { id: role.id } });
    await this.recordAudit(user.uid, null, 'ADMIN_ROLE_DELETED', this.toAdminRole(role), null);
    return { data: null, message: 'Admin role deleted successfully' };
  }

  permissionCatalog() {
    return { data: PERMISSION_CATALOG, message: 'Permission catalog fetched successfully' };
  }

  async listAuditLogs(_user: AuthUserContext, query: ListAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AdminAuditLogWhereInput = {
      actorId: query.actorId,
      targetId: query.targetId,
      action: query.action,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);
    const targetIds = [...new Set(items.map((item) => item.targetId).filter((id): id is string => id !== null))];
    const targets = targetIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: targetIds } },
          select: { id: true, email: true, firstName: true, lastName: true },
        })
      : [];
    const targetById = new Map(targets.map((target) => [target.id, target]));

    return {
      data: items.map((item) => ({ ...item, target: item.targetId ? (targetById.get(item.targetId) ?? null) : null })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Audit logs fetched successfully',
    };
  }

  async approveProvider(_user: AuthUserContext, providerId: string) {
    const provider = await this.getProvider(providerId);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isApproved: true,
        isActive: true,
        providerApprovalStatus: ProviderApprovalStatus.APPROVED,
      },
    });

    return {
      data: await this.toAuthUser(updated),
      message: 'Provider approved successfully',
    };
  }

  async rejectProvider(
    _user: AuthUserContext,
    providerId: string,
    dto: RejectProviderDto,
  ) {
    const provider = await this.getProvider(providerId);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isApproved: false,
        providerApprovalStatus: ProviderApprovalStatus.REJECTED,
      },
    });

    return {
      data: await this.toAuthUser(updated),
      message: dto.reason
        ? `Provider rejected successfully: ${dto.reason}`
        : 'Provider rejected successfully',
    };
  }

  async updateUserActiveStatus(
    user: AuthUserContext,
    targetUserId: string,
    dto: UpdateUserActiveStatusDto,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found');
    }

    this.assertCanToggleActiveStatus(user, target);

    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: {
        isActive: dto.isActive,
        refreshTokenHash: dto.isActive ? target.refreshTokenHash : null,
      },
    });

    return {
      data: await this.toAuthUser(updated),
      message: dto.isActive
        ? 'User account activated successfully'
        : 'User account deactivated successfully',
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(
        dto.refreshToken,
        {
          secret: this.configService.get<string>(
            'JWT_REFRESH_SECRET',
            'change-me-refresh',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(payload.uid);
    if (!user?.refreshTokenHash || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.sessionId) {
      const session = await this.authSessionsRepository.findRefreshSession(payload.sessionId, user.id);
      if (!session || !(await bcrypt.compare(dto.refreshToken, session.refreshTokenHash))) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    return {
      data: await this.issueTokens(user, payload.sessionId),
      message: 'Token refreshed',
    };
  }

  async logout(user: AuthUserContext) {
    await this.authRepository.clearRefreshTokenHash(user.uid);
    if (user.sessionId) {
      await this.authSessionsRepository.revokeCurrentSession(user.sessionId, user.uid);
    }
    return { data: null, message: 'Logout successful' };
  }

  async verifyEmail(user: AuthUserContext, dto: VerifyEmailDto) {
    const dbUser = await this.getActiveUser(user.uid);

    if (dbUser.isVerified) {
      return { data: null, message: 'Email already verified' };
    }

    if (dbUser.verificationOtpAttempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
    }

    const isValid =
      dbUser.verificationOtp === dto.otp &&
      !!dbUser.verificationOtpExpiresAt &&
      dbUser.verificationOtpExpiresAt.getTime() >= Date.now();

    if (!isValid) {
      await this.authPasswordRepository.incrementVerificationOtpAttempts(dbUser.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    const updated = await this.authPasswordRepository.markEmailVerified(dbUser.id);

    return { data: await this.toAuthUser(updated), message: 'Email verified successfully' };
  }

  async resendVerification(user: AuthUserContext) {
    const dbUser = await this.getActiveUser(user.uid);

    if (dbUser.isVerified) {
      return { data: null, message: 'Email already verified' };
    }

    const otp = this.generateOtp();
    await this.authPasswordRepository.storeVerificationOtp(dbUser.id, otp, this.generateOtpExpiry());
    await this.mailerService.sendVerificationEmail(dbUser.email, otp);

    return {
      data: null,
      message: 'Verification OTP sent',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || user.deletedAt) {
      throw new BadRequestException('No account found with this email address.');
    }

    const otp = this.generateOtp();
    await this.authPasswordRepository.storeResetPasswordOtp(user.id, otp, this.generateOtpExpiry());

    try {
      await this.mailerService.sendPasswordResetEmail(user.email, otp);
    } catch {
      await this.authPasswordRepository.clearResetPasswordOtp(user.id);
      throw new ServiceUnavailableException('Unable to send password reset email. Please try again later.');
    }

    return {
      message: 'Password reset OTP has been sent to your email.',
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || user.deletedAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
    }

    const isValid =
      user.resetPasswordOtp === dto.otp &&
      !!user.resetPasswordOtpExpiresAt &&
      user.resetPasswordOtpExpiresAt.getTime() >= Date.now();

    if (!isValid) {
      await this.authPasswordRepository.incrementResetPasswordOtpAttempts(user.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    return {
      message: 'OTP verified successfully',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.assertPasswordMeetsSecurity(dto.newPassword);
    const user = await this.userFromResetOtp(dto);

    await this.authPasswordRepository.resetPassword(user.id, await bcrypt.hash(dto.newPassword, 10));

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(user: AuthUserContext, dto: ChangePasswordDto) {
    const dbUser = await this.getActiveUser(user.uid);

    if (!(await bcrypt.compare(dto.currentPassword, dbUser.password))) {
      throw new UnauthorizedException('Current password is invalid');
    }

    await this.authPasswordRepository.changePassword(dbUser.id, await bcrypt.hash(dto.newPassword, 10));

    return { data: null, message: 'Password changed successfully' };
  }

  async me(user: AuthUserContext) {
    const dbUser = await this.getActiveUser(user.uid);
    return { data: await this.toAuthUser(dbUser), message: 'Profile fetched successfully.' };
  }

  async updateMe(user: AuthUserContext, dto: UpdateOwnProfileDto) {
    const updated = await this.authRepository.updateOwnProfile(user.uid, { firstName: dto.firstName?.trim(), lastName: dto.lastName?.trim(), phone: dto.phone?.trim(), avatarUrl: dto.avatarUrl?.trim() });
    return { data: await this.toAuthUser(updated), message: 'Profile updated successfully.' };
  }

  async sessions(user: AuthUserContext) {
    const sessions = await this.authSessionsRepository.findActiveSessionsByUserId(user.uid);
    return { data: sessions.map((session) => ({ id: session.id, deviceName: session.deviceName ?? 'Unknown device', location: session.location, ipAddress: session.ipAddress, isCurrent: session.id === user.sessionId, lastActiveAt: session.lastActiveAt })), message: 'Active sessions fetched successfully.' };
  }

  async logoutAllSessions(user: AuthUserContext) {
    await this.authSessionsRepository.revokeOtherSessions(user.uid, user.sessionId);
    return { success: true, message: 'Other sessions logged out successfully.' };
  }

  async revokeSession(user: AuthUserContext, id: string) {
    const session = await this.authSessionsRepository.findActiveSessionForUser(user.uid, id);
    if (!session) throw new NotFoundException('Session not found');
    await this.authSessionsRepository.deleteSession(id);
    return { success: true, message: 'Session revoked successfully.' };
  }

  async deleteAccount(user: AuthUserContext) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrative accounts must be managed by Super Admin');
    }

    await this.authRepository.deleteAccountCascade(user.uid);

    return { data: null, message: 'Account deleted successfully' };
  }

  async cancelDeletion(user: AuthUserContext) {
    const dbUser = await this.authRepository.findUserForDeletionCancel(user.uid);

    if (!dbUser?.deletedAt || !dbUser.deleteAfter || dbUser.deleteAfter <= new Date()) {
      throw new BadRequestException('Account is not scheduled for deletion');
    }

    await this.authRepository.cancelDeletion(dbUser.id);

    return { data: null, message: 'Account deletion cancelled' };
  }

  private async createUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    isApproved: boolean;
    isVerified?: boolean;
    isActive?: boolean;
    mustChangePassword?: boolean;
    adminRoleId?: string;
    providerApprovalStatus: ProviderApprovalStatus | null;
    providerBusinessName?: string;
    providerBusinessCategoryId?: string;
    providerTaxId?: string;
    providerBusinessAddress?: string;
    providerServiceArea?: string;
    providerFulfillmentMethods?: string[];
    providerAutoAcceptOrders?: boolean;
    providerDocuments?: string[];
    adminTitle?: string;
    avatarUrl?: string;
    adminPermissions?: Prisma.InputJsonValue;
  }): Promise<User> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.authRepository.findExistingUserByEmail(email);

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const otp = this.generateOtp();
    return this.authRepository.createAuthUser({
        email,
        password: await bcrypt.hash(input.password, 10),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        avatarUrl: input.avatarUrl,
        role: input.role,
        adminRoleId: input.adminRoleId,
        isVerified: input.isVerified ?? false,
        isActive: input.isActive ?? true,
        isApproved: input.isApproved,
        mustChangePassword: input.mustChangePassword ?? false,
        providerApprovalStatus: input.providerApprovalStatus,
        providerBusinessName: input.providerBusinessName,
        providerBusinessCategoryId: input.providerBusinessCategoryId,
        providerTaxId: input.providerTaxId,
        providerBusinessAddress: input.providerBusinessAddress,
        providerServiceArea: input.providerServiceArea,
        providerFulfillmentMethods: input.providerFulfillmentMethods ?? undefined,
        providerAutoAcceptOrders: input.providerAutoAcceptOrders ?? false,
        providerDocuments: input.providerDocuments ?? undefined,
        adminTitle: input.adminTitle,
        adminPermissions: input.adminPermissions ?? undefined,
        verificationOtp: otp,
        verificationOtpExpiresAt: this.generateOtpExpiry(),
      });
  }

  private async getProvider(providerId: string): Promise<User> {
    const provider = await this.prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!provider || provider.deletedAt || provider.role !== UserRole.PROVIDER) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }


  private async assertAnotherActiveSuperAdminExists(currentSuperAdminId: string): Promise<void> {
    const activeSuperAdmins = await this.prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        deletedAt: null,
        id: { not: currentSuperAdminId },
      },
    });

    if (activeSuperAdmins === 0) {
      throw new ForbiddenException('Last active Super Admin cannot be disabled');
    }
  }

  private async getAdmin(adminId: string): Promise<User & { adminRole: AdminRole | null }> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { adminRole: true },
    });

    if (
      !admin ||
      admin.deletedAt ||
      (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  private async getAdminRole(roleId: string): Promise<AdminRole> {
    const role = await this.prisma.adminRole.findUnique({ where: { id: roleId } });
    if (!role || role.deletedAt || !role.isActive) {
      throw new NotFoundException('Admin role not found');
    }

    return role;
  }

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.authRepository.findActiveUserById(userId);

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private assertCanToggleActiveStatus(user: AuthUserContext, target: User): void {
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin active status cannot be changed');
    }

    if (user.uid === target.id) {
      throw new ForbiddenException('You cannot change your own active status');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (
      user.role === UserRole.ADMIN &&
      (target.role === UserRole.REGISTERED_USER || target.role === UserRole.PROVIDER)
    ) {
      return;
    }

    throw new ForbiddenException('Your role cannot change this account status');
  }

  private async issueTokens(user: User, existingSessionId?: string, ipAddress?: string, userAgent?: string) {
    const session = existingSessionId
      ? await this.authSessionsRepository.touchSession(existingSessionId)
      : await this.authSessionsRepository.createRefreshSession({
          userId: user.id,
          deviceName: userAgent ? this.deviceName(userAgent) : 'Current device',
          ipAddress,
          userAgent,
        });
    const payload: TokenPayload = {
      uid: user.id,
      role: user.role,
      permissions: user.adminPermissions ?? undefined,
      sessionId: session.id,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
        '15m',
      ) as never,
    });
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ) as never,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.authSessionsRepository.storeRefreshTokenHash(user.id, session.id, refreshTokenHash);

    return { accessToken, refreshToken };
  }

  private async toAuthUser(user: User) {
    const baseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      isVerified: user.isVerified,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      deletionState: this.toDeletionState(user),
    };

    if (user.role === UserRole.SUPER_ADMIN) {
      return baseUser;
    }

    if (user.role === UserRole.ADMIN) {
      return {
        ...baseUser,
        admin: {
          title: user.adminTitle,
          roleId: user.adminRoleId,
          permissions: user.adminPermissions,
          isApproved: user.isApproved,
        },
      };
    }

    if (user.role === UserRole.PROVIDER) {
      const businessCategory = user.providerBusinessCategoryId
        ? await this.prisma.providerBusinessCategory.findUnique({
            where: { id: user.providerBusinessCategoryId },
          })
        : null;
      return {
        ...baseUser,
        provider: {
          id: user.id,
          businessName: user.providerBusinessName,
          businessCategory: businessCategory
            ? { id: businessCategory.id, name: businessCategory.name }
            : null,
          taxId: user.providerTaxId,
          businessAddress: user.providerBusinessAddress,
          fulfillmentMethods: this.stringArray(user.providerFulfillmentMethods),
          autoAcceptOrders: user.providerAutoAcceptOrders,
          serviceArea: user.providerServiceArea,
          approvalStatus: user.providerApprovalStatus,
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          isActive: user.isActive,
          memberSince: user.createdAt,
        },
      };
    }

    return { ...baseUser, subscription: await this.customerSubscriptionSummary(user.id) };
  }

  private async customerSubscriptionSummary(userId: string) {
    const subscription = await this.prisma.customerSubscription.findFirst({
      where: { userId, status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING, CustomerSubscriptionStatus.PAST_DUE, CustomerSubscriptionStatus.INCOMPLETE] } },
      include: { plan: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) return { isPremium: false, status: 'FREE', planId: null, planName: null, billingCycle: null };
    return { isPremium: subscription.isPremium, status: subscription.status, planId: subscription.planId, planName: subscription.plan.name, billingCycle: subscription.billingCycle };
  }

  private toDeletionState(user: User) {
    return {
      isDeleted: !!user.deletedAt,
      deletionScheduled: !!user.deleteAfter && user.deleteAfter > new Date(),
      deletedAt: user.deletedAt,
      deleteAfter: user.deleteAfter,
    };
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

  private toAdminRole(role: AdminRole) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions: role.permissions,
      createdAt: role.createdAt,
    };
  }

  private async recordAudit(
    actorId: string | null,
    targetId: string | null,
    action: string,
    beforeJson: unknown,
    afterJson: unknown,
  ): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorId,
        targetId,
        targetType: this.inferTargetType(action),
        action,
        beforeJson: beforeJson === null ? undefined : (beforeJson),
        afterJson: afterJson === null ? undefined : (afterJson),
      },
    });
  }

  private stringArray(value: Prisma.JsonValue | null | undefined): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private async userFromResetOtp(dto: ResetPasswordDto): Promise<User> {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || user.deletedAt) {
      throw new BadRequestException('No account found with this email address.');
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
    }

    const isValid =
      user.resetPasswordOtp === dto.otp &&
      !!user.resetPasswordOtpExpiresAt &&
      user.resetPasswordOtpExpiresAt.getTime() >= Date.now();

    if (!isValid) {
      await this.authPasswordRepository.incrementResetPasswordOtpAttempts(user.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    return user;
  }

  private assertPasswordMeetsSecurity(password: string): void {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      throw new BadRequestException('New password does not meet security requirements.');
    }
  }

  private async getProviderBusinessCategory(categoryId: string) {
    const category = await this.authRepository.findProviderBusinessCategory(categoryId);
    if (!category || !category.isActive) {
      throw new NotFoundException('Provider business category not found');
    }
    return category;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeUserAgent(userAgent?: string | string[]): string | undefined {
    return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent;
  }

  private requiredOtp(otp: string | null): string {
    if (!otp) {
      throw new ServiceUnavailableException('Verification OTP was not generated');
    }

    return otp;
  }

  private deviceName(userAgent: string) {
    if (/iphone|ipad/i.test(userAgent)) return 'iOS device';
    if (/android/i.test(userAgent)) return 'Android device';
    if (/windows/i.test(userAgent)) return 'Windows device';
    if (/macintosh|mac os/i.test(userAgent)) return 'Mac device';
    return 'Current device';
  }

  private async ensureSingleSuperAdmin(): Promise<void> {
    const superAdminRole = await this.ensureSystemRole(
      'Super Admin',
      UserRole.SUPER_ADMIN,
      'Full platform access.',
      SUPER_ADMIN_PERMISSIONS,
    );
    await this.ensureSystemRole(
      'Manager',
      'MANAGER',
      'Can oversee daily operations.',
      {
        users: ['read', 'updateStatus'],
        admins: ['read'],
        providers: ['read', 'approve', 'reject', 'updateStatus'],
        reports: ['read'],
        auditLogs: ['read'],
      },
    );
    const email = this.normalizeEmail('giftapp.superadmin@yopmail.com');
    const password = 'Admin@123456';
    const emailOwner = await this.prisma.user.findUnique({ where: { email } });

    const canonicalSuperAdmin = emailOwner
      ? await this.prisma.user.update({
          where: { id: emailOwner.id },
          data: {
            role: UserRole.SUPER_ADMIN,
            firstName: 'Gift App',
            lastName: 'Super Admin',
            isVerified: true,
            isActive: true,
            isApproved: true,
            adminRoleId: superAdminRole.id,
            adminPermissions: SUPER_ADMIN_PERMISSIONS,
            deletedAt: null,
            deleteAfter: null,
          },
        })
      : await this.prisma.user.create({
          data: {
            email,
            password: await bcrypt.hash(password, 10),
            role: UserRole.SUPER_ADMIN,
            firstName: 'Gift App',
            lastName: 'Super Admin',
            isVerified: true,
            isActive: true,
            isApproved: true,
            adminRoleId: superAdminRole.id,
            adminPermissions: SUPER_ADMIN_PERMISSIONS,
          },
        });

    await this.prisma.user.updateMany({
      where: { role: UserRole.SUPER_ADMIN, id: { not: canonicalSuperAdmin.id } },
      data: {
        role: UserRole.ADMIN,
        isApproved: false,
        isActive: false,
        adminPermissions: Prisma.JsonNull,
        refreshTokenHash: null,
      },
    });
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private generateOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private async ensureSystemRole(
    name: string,
    slug: string,
    description: string,
    permissions: Record<string, string[]>,
  ): Promise<AdminRole> {
    const existing = await this.prisma.adminRole.findUnique({ where: { slug } });
    if (existing) {
      return this.prisma.adminRole.update({
        where: { id: existing.id },
        data: {
          name,
          description,
          permissions,
          isSystem: true,
          isActive: true,
          deletedAt: null,
        },
      });
    }

    return this.prisma.adminRole.create({
      data: {
        name,
        slug,
        description,
        permissions,
        isSystem: true,
        isActive: true,
      },
    });
  }

  private generateTemporaryPassword(): string {
    return `Gift@${randomInt(100000, 1000000)}`;
  }

  private slugify(value: string): string {
    return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private inferTargetType(action: string): string | null {
    if (action.startsWith('ADMIN_ROLE')) {
      return 'ADMIN_ROLE';
    }

    if (action.startsWith('ADMIN')) {
      return 'ADMIN';
    }

    if (action.startsWith('REGISTERED_USER')) {
      return 'REGISTERED_USER';
    }

    if (action.startsWith('PROVIDER')) {
      return 'PROVIDER';
    }

    return null;
  }


  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

}
