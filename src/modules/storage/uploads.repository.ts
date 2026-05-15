import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUpload(data: Prisma.UploadedFileUncheckedCreateInput) {
    return this.prisma.uploadedFile.create({ data });
  }

  findUploadsAndCount(params: Prisma.UploadedFileFindManyArgs & { where: Prisma.UploadedFileWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.uploadedFile.findMany(params),
      this.prisma.uploadedFile.count({ where: params.where }),
    ]);
  }

  findAccessibleUpload(where: Prisma.UploadedFileWhereInput) {
    return this.prisma.uploadedFile.findFirst({ where });
  }

  completeUpload(id: string, data: Prisma.UploadedFileUncheckedUpdateInput) {
    return this.prisma.uploadedFile.update({ where: { id }, data });
  }

  deleteUpload(id: string) {
    return this.prisma.uploadedFile.delete({ where: { id } });
  }
}
