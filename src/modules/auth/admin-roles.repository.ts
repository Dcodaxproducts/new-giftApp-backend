import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyAdminRoles<T extends Prisma.AdminRoleFindManyArgs>(args: T): Promise<Prisma.AdminRoleGetPayload<T>[]> {
    return this.prisma.adminRole.findMany(args) as Promise<Prisma.AdminRoleGetPayload<T>[]>;
  }

  countAdminRoles(where: Prisma.AdminRoleWhereInput) {
    return this.prisma.adminRole.count({ where });
  }

  findAdminRoleById(id: string) {
    return this.prisma.adminRole.findUnique({ where: { id } });
  }

  findAdminRoleBySlug(slug: string) {
    return this.prisma.adminRole.findUnique({ where: { slug } });
  }

  createAdminRole(data: Prisma.AdminRoleCreateInput) {
    return this.prisma.adminRole.create({ data });
  }

  updateAdminRole(id: string, data: Prisma.AdminRoleUpdateInput) {
    return this.prisma.adminRole.update({ where: { id }, data });
  }

  upsertSystemRole(params: { name: string; slug: string; description: string; permissions: Prisma.InputJsonValue }) {
    return this.prisma.adminRole.upsert({
      where: { slug: params.slug },
      create: { name: params.name, slug: params.slug, description: params.description, permissions: params.permissions, isSystem: true, isActive: true },
      update: { name: params.name, description: params.description, permissions: params.permissions, isSystem: true, isActive: true, deletedAt: null },
    });
  }

  updateAdminRolePermissions(id: string, permissions: Prisma.InputJsonValue) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.adminRole.update({ where: { id }, data: { permissions } });
      await tx.user.updateMany({ where: { adminRoleId: id }, data: { adminPermissions: permissions } });
      return updated;
    });
  }

  deleteAdminRole(id: string) {
    return this.prisma.adminRole.delete({ where: { id } });
  }

  countAdminsUsingRole(roleId: string) {
    return this.prisma.user.count({ where: { adminRoleId: roleId, deletedAt: null } });
  }
}
