import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ReportEvidencePolicyService {
  async assertCompletedUploads(input: { urls: string[]; folder: string; findCompleted: (urls: string[]) => Promise<Array<{ fileUrl: string }>> }): Promise<void> {
    if (!input.urls.length) return;
    const rows = await input.findCompleted(input.urls);
    const found = new Set(rows.map((row) => row.fileUrl));
    if (input.urls.some((url) => !found.has(url))) {
      throw new BadRequestException(`Evidence URLs must use completed ${input.folder} uploads.`);
    }
  }
}
