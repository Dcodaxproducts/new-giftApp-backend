import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerContact, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerContactDto, CustomerContactSortBy, ListCustomerContactsDto, SortOrder, UpdateCustomerContactDto } from './dto/customer-contacts.dto';

@Injectable()
export class CustomerContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUserContext, query: ListCustomerContactsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CustomerContactWhereInput = {
      userId: user.uid,
      deletedAt: null,
      relationship: query.relationship ? { equals: query.relationship, mode: 'insensitive' } : undefined,
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { relationship: { contains: query.search, mode: 'insensitive' } },
      ] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerContact.findMany({ where, orderBy: this.orderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit }),
      this.prisma.customerContact.count({ where }),
    ]);
    return { data: items.map((contact) => this.toListItem(contact)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Contacts fetched successfully' };
  }

  async create(user: AuthUserContext, dto: CreateCustomerContactDto) {
    this.assertHasContactMethod(dto);
    const contact = await this.prisma.customerContact.create({ data: { ...this.createData(dto), userId: user.uid } });
    return { data: this.toDetail(contact), message: 'Contact created successfully' };
  }

  async details(user: AuthUserContext, id: string) {
    return { data: this.toDetail(await this.getOwnedContact(user.uid, id)), message: 'Contact fetched successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateCustomerContactDto) {
    const existing = await this.getOwnedContact(user.uid, id);
    const merged = {
      phone: dto.phone ?? existing.phone ?? undefined,
      email: dto.email ?? existing.email ?? undefined,
      address: dto.address ?? existing.address ?? undefined,
    };
    this.assertHasContactMethod(merged);
    const contact = await this.prisma.customerContact.update({ where: { id: existing.id }, data: { ...this.data(dto), name: dto.name?.trim() } });
    return { data: this.toDetail(contact), message: 'Contact updated successfully' };
  }

  async delete(user: AuthUserContext, id: string) {
    const existing = await this.getOwnedContact(user.uid, id);
    await this.prisma.customerContact.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    return { message: 'Contact deleted successfully.' };
  }

  private async getOwnedContact(userId: string, id: string): Promise<CustomerContact> {
    const contact = await this.prisma.customerContact.findFirst({ where: { id, userId, deletedAt: null } });
    if (!contact) throw new NotFoundException('Contact not found.');
    return contact;
  }

  private assertHasContactMethod(dto: { phone?: string | null; email?: string | null; address?: string | null }): void {
    if (!dto.phone?.trim() && !dto.email?.trim() && !dto.address?.trim()) throw new BadRequestException('At least one contact method is required.');
  }

  private createData(dto: CreateCustomerContactDto): Omit<Prisma.CustomerContactUncheckedCreateInput, 'userId'> {
    return {
      name: dto.name.trim(),
      relationship: dto.relationship?.trim(),
      phone: dto.phone ? this.normalizePhone(dto.phone) : dto.phone,
      email: dto.email?.trim().toLowerCase(),
      address: dto.address?.trim(),
      likes: dto.likes?.trim(),
      avatarUrl: dto.avatarUrl?.trim(),
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      notes: dto.notes?.trim(),
    };
  }

  private data(dto: CreateCustomerContactDto | UpdateCustomerContactDto): Prisma.CustomerContactUncheckedUpdateInput {
    return {
      relationship: dto.relationship?.trim(),
      phone: dto.phone ? this.normalizePhone(dto.phone) : dto.phone,
      email: dto.email?.trim().toLowerCase(),
      address: dto.address?.trim(),
      likes: dto.likes?.trim(),
      avatarUrl: dto.avatarUrl?.trim(),
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      notes: dto.notes?.trim(),
    };
  }

  private normalizePhone(phone: string): string { return phone.trim().replace(/[\s()-]/g, ''); }
  private orderBy(sortBy?: CustomerContactSortBy, sortOrder?: SortOrder): Prisma.CustomerContactOrderByWithRelationInput { return { [sortBy ?? CustomerContactSortBy.CREATED_AT]: sortOrder === SortOrder.ASC ? 'asc' : 'desc' }; }
  private initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join(''); }
  private birthdayString(value: Date | null): string | null { return value ? value.toISOString().slice(0, 10) : null; }
  private toListItem(contact: CustomerContact) { return { id: contact.id, name: contact.name, relationship: contact.relationship, phone: contact.phone, email: contact.email, address: contact.address, likes: contact.likes, avatarUrl: contact.avatarUrl, initials: this.initials(contact.name), groupKey: contact.name.trim()[0]?.toUpperCase() ?? '#', createdAt: contact.createdAt, updatedAt: contact.updatedAt }; }
  private toDetail(contact: CustomerContact) { return { ...this.toListItem(contact), birthday: this.birthdayString(contact.birthday), notes: contact.notes }; }
}
