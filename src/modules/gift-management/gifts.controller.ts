import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGiftDto, ExportGiftsDto, ListGiftsDto, UpdateGiftDto, UpdateGiftStatusDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('Gift Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROVIDER)
@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Post()
  @Permissions('gifts.create')
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftDto) { return this.gifts.createGift(user, dto); }

  @Get()
  @Permissions('gifts.read')
  list(@Query() query: ListGiftsDto) { return this.gifts.listGifts(query); }

  @Get('stats')
  @Permissions('gifts.read')
  stats() { return this.gifts.giftStats(); }

  @Get('export')
  @Permissions('gifts.export')
  async export(@Query() query: ExportGiftsDto): Promise<StreamableFile> {
    const file = await this.gifts.exportGifts(query);
    return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType });
  }

  @Get(':id')
  @Permissions('gifts.read')
  details(@Param('id') id: string) { return this.gifts.giftDetails(id); }

  @Patch(':id')
  @Permissions('gifts.update')
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftDto) { return this.gifts.updateGift(user, id, dto); }

  @Patch(':id/status')
  @Permissions('gifts.status.update')
  updateStatus(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftStatusDto) { return this.gifts.updateGiftStatus(user, id, dto); }

  @Delete(':id')
  @Permissions('gifts.delete')
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteGift(user, id); }
}
