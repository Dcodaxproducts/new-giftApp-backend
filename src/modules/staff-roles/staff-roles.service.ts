import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StaffRole, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import {
  CreateStaffRoleDto,
  ListStaffRolesDto,
  UpdateStaffRoleDto,
  UpdateRolePermissionsDto,
} from './dto/staff-roles.dto';
import { StaffRolesRepository } from './staff-roles.repository';

@Injectable()
export class StaffRolesService {
  constructor(
    private readonly auditLog: AuditLogWriterService,
    private readonly repository: StaffRolesRepository,
  ) {}

  async list(_user: AuthUserContext, query: ListStaffRolesDto) {
    const where: Prisma.StaffRoleWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const roles = await this.repository.findManyStaffRoles({
      where,
      include: { _count: { select: { staffProfiles: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        adminCount: role._count.staffProfiles,
        createdAt: role.createdAt,
      })),
      message: 'Staff roles fetched successfully',
    };
  }

  async details(_user: AuthUserContext, id: string) {
    const role = await this.getStaffRole(id);
    return { data: this.toStaffRole(role), message: 'Staff role fetched successfully' };
  }

  async create(user: AuthUserContext, dto: CreateStaffRoleDto) {
    const slug = this.slugify(dto.name);
    const existing = await this.repository.findStaffRoleBySlug(slug);
    if (existing) {
      throw new ConflictException('Staff role already exists');
    }
    const role = await this.repository.createStaffRole({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim(),
      permissions: dto.permissions,
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'STAFF_ROLE',
      action: 'STAFF_ROLE_CREATED',
      afterJson: this.toStaffRole(role),
    });
    return { data: this.toStaffRole(role), message: 'Staff role created successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateStaffRoleDto) {
    const role = await this.getStaffRole(id);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const before = this.toStaffRole(role);
    const updated = await this.repository.updateStaffRole(role.id, {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'STAFF_ROLE',
      action: 'STAFF_ROLE_UPDATED',
      beforeJson: before,
      afterJson: this.toStaffRole(updated),
    });
    return { data: this.toStaffRole(updated), message: 'Staff role updated successfully' };
  }

  async updatePermissions(user: AuthUserContext, id: string, dto: UpdateRolePermissionsDto) {
    const role = await this.getStaffRole(id);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const before = this.toStaffRole(role);
    const updated = await this.repository.updateStaffRolePermissions(role.id, dto.permissions);
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'STAFF_ROLE',
      action: 'STAFF_ROLE_PERMISSIONS_UPDATED',
      beforeJson: before,
      afterJson: this.toStaffRole(updated),
    });

    return {
      data: { id: updated.id, permissions: updated.permissions },
      message: 'Role permissions updated successfully',
    };
  }

  async delete(user: AuthUserContext, id: string) {
    const role = await this.getStaffRole(id);
    if (role.slug === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin role cannot be modified.');
    }
    const adminCount = await this.repository.countAdminsUsingRole(role.id);
    if (adminCount > 0) {
      throw new BadRequestException('Role cannot be deleted while staff are assigned to it');
    }
    await this.repository.deleteStaffRole(role.id);
    await this.auditLog.write({
      actorId: user.uid,
      targetId: role.id,
      targetType: 'STAFF_ROLE',
      action: 'STAFF_ROLE_DELETED',
      beforeJson: this.toStaffRole(role),
    });
    return { data: null, message: 'Staff role deleted successfully' };
  }

  private async getStaffRole(roleId: string): Promise<StaffRole> {
    const role = await this.repository.findStaffRoleById(roleId);
    if (!role) {
      throw new NotFoundException('Staff role not found');
    }
    return role;
  }

  private toStaffRole(role: StaffRole) {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      permissions: role.permissions,
      createdAt: role.createdAt,
    };
  }

  private slugify(value: string): string {
    return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
}
