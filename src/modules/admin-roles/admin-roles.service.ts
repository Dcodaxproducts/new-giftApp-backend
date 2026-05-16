import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import {
  CreateAdminRoleDto,
  ListAdminRolesDto,
  UpdateAdminRoleDto,
  UpdateRolePermissionsDto,
} from './dto/admin-roles.dto';
import { AdminRolesRepository } from './admin-roles.repository';
import { PermissionsCatalogRepository } from './permissions-catalog.repository';

@Injectable()
export class AdminRolesService {
  constructor(
    private readonly auditLog: AuditLogWriterService,
    private readonly repository: AdminRolesRepository,
    private readonly permissionsCatalogRepository: PermissionsCatalogRepository,
  ) {}

  async list(_user: AuthUserContext, query: ListAdminRolesDto) {
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
    const roles = await this.repository.findManyAdminRoles({
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

  async details(_user: AuthUserContext, id: string) {
    const role = await this.getAdminRole(id);
    return { data: this.toAdminRole(role), message: 'Admin role fetched successfully' };
  }

  async create(user: AuthUserContext, dto: CreateAdminRoleDto) {
    const slug = this.slugify(dto.name);
    const existing = await this.repository.findAdminRoleBySlug(slug);
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Admin role already exists');
    }
    const role = await this.repository.createAdminRole({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim(),
      permissions: dto.permissions,
      isSystem: false,
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'ADMIN_ROLE',
      action: 'ADMIN_ROLE_CREATED',
      afterJson: this.toAdminRole(role),
    });
    return { data: this.toAdminRole(role), message: 'Admin role created successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateAdminRoleDto) {
    const role = await this.getAdminRole(id);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const before = this.toAdminRole(role);
    const updated = await this.repository.updateAdminRole(role.id, {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      isActive: dto.isActive,
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'ADMIN_ROLE',
      action: 'ADMIN_ROLE_UPDATED',
      beforeJson: before,
      afterJson: this.toAdminRole(updated),
    });
    return { data: this.toAdminRole(updated), message: 'Admin role updated successfully' };
  }

  async updatePermissions(user: AuthUserContext, id: string, dto: UpdateRolePermissionsDto) {
    const role = await this.getAdminRole(id);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const before = this.toAdminRole(role);
    const updated = await this.repository.updateAdminRolePermissions(role.id, dto.permissions);
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'ADMIN_ROLE',
      action: 'ADMIN_ROLE_PERMISSIONS_UPDATED',
      beforeJson: before,
      afterJson: this.toAdminRole(updated),
    });

    return {
      data: { id: updated.id, permissions: updated.permissions },
      message: 'Role permissions updated successfully',
    };
  }

  async delete(user: AuthUserContext, id: string) {
    const role = await this.getAdminRole(id);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    const adminCount = await this.repository.countAdminsUsingRole(role.id);
    if (adminCount > 0) {
      throw new BadRequestException('Role cannot be deleted while admins are assigned to it');
    }
    await this.repository.deleteAdminRole(role.id);
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'ADMIN_ROLE',
      action: 'ADMIN_ROLE_DELETED',
      beforeJson: this.toAdminRole(role),
    });
    return { data: null, message: 'Admin role deleted successfully' };
  }

  catalog() {
    return { data: this.permissionsCatalogRepository.getPermissionCatalog(), message: 'Permission catalog fetched successfully' };
  }

  private async getAdminRole(roleId: string): Promise<AdminRole> {
    const role = await this.repository.findAdminRoleById(roleId);
    if (!role || role.deletedAt || !role.isActive) {
      throw new NotFoundException('Admin role not found');
    }
    return role;
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

  private slugify(value: string): string {
    return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
}
