import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StaffRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyStaffRoles<T extends Prisma.StaffRoleFindManyArgs>(args: T): Promise<Prisma.StaffRoleGetPayload<T>[]> {
    return this.prisma.staffRole.findMany(args) as Promise<Prisma.StaffRoleGetPayload<T>[]>;
  }

  countStaffRoles(where: Prisma.StaffRoleWhereInput) {
    return this.prisma.staffRole.count({ where });
  }

  findStaffRoleById(id: string) {
    return this.prisma.staffRole.findUnique({ where: { id } });
  }

  findStaffRoleBySlug(slug: string) {
    return this.prisma.staffRole.findUnique({ where: { slug } });
  }

  createStaffRole(data: Prisma.StaffRoleCreateInput) {
    return this.prisma.staffRole.create({ data });
  }

  updateStaffRole(id: string, data: Prisma.StaffRoleUpdateInput) {
    return this.prisma.staffRole.update({ where: { id }, data });
  }

  updateStaffRolePermissions(id: string, permissions: Prisma.InputJsonValue) {
    return this.prisma.staffRole.update({ where: { id }, data: { permissions } });
  }

  deleteStaffRole(id: string) {
    return this.prisma.staffRole.delete({ where: { id } });
  }

  countAdminsUsingRole(roleId: string) {
    return this.prisma.staffProfile.count({ where: { staffRoleId: roleId } });
  }
}
