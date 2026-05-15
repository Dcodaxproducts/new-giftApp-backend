import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyCoupons(params: Prisma.CouponFindManyArgs) {
    return this.prisma.coupon.findMany(params);
  }

  countCoupons(where: Prisma.CouponWhereInput) {
    return this.prisma.coupon.count({ where });
  }

  findCouponsAndCount(params: Prisma.CouponFindManyArgs & { where: Prisma.CouponWhereInput }) {
    return this.prisma.$transaction([
      this.findManyCoupons(params),
      this.countCoupons(params.where),
    ]);
  }

  findCouponById(id: string) {
    return this.prisma.coupon.findFirst({ where: { id, deletedAt: null } });
  }

  findCouponByCode(code: string, exceptId?: string) {
    return this.prisma.coupon.findFirst({ where: { code: code.trim().toUpperCase(), id: exceptId ? { not: exceptId } : undefined, deletedAt: null } });
  }

  createCoupon(data: Prisma.CouponUncheckedCreateInput) {
    return this.prisma.coupon.create({ data });
  }

  updateCoupon(id: string, data: Prisma.CouponUncheckedUpdateInput) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  updateCouponStatus(id: string, data: Prisma.CouponUncheckedUpdateInput) {
    return this.updateCoupon(id, data);
  }

  deleteCoupon(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
