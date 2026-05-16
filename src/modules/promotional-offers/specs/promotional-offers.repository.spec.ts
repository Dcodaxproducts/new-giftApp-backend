import { readFileSync } from 'fs';
import { join } from 'path';

describe('Promotional offers repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/promotional-offers.service.ts'), 'utf8');
  const adminRepository = readFileSync(join(__dirname, '../repositories/promotional-offers.repository.ts'), 'utf8');
  const providerRepository = readFileSync(join(__dirname, '../repositories/provider-offers.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../promotional-offers.module.ts'), 'utf8');
  const adminController = readFileSync(join(__dirname, '../controllers/promotional-offers-management.controller.ts'), 'utf8');
  const providerController = readFileSync(join(__dirname, '../controllers/provider-promotional-offers.controller.ts'), 'utf8');

  it('keeps promotional offers service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('PromotionalOffersRepository');
    expect(service).toContain('ProviderOffersRepository');
  });

  it('moves provider and admin persistence into repositories', () => {
    ['findManyOffers', 'countOffers', 'findOffersAndCount', 'findOfferById', 'createOffer', 'updateOffer', 'approveOffer', 'rejectOffer', 'updateOfferStatus', 'deleteOffer', 'countOfferStats'].forEach((method) => expect(adminRepository).toContain(method));
    ['findProviderItem', 'findProviderOfferById', 'findProviderOffersAndCount', 'createProviderOffer', 'updateProviderOffer', 'updateProviderOfferStatus', 'deleteProviderOffer'].forEach((method) => expect(providerRepository).toContain(method));
  });

  it('preserves route grouping, RBAC permissions, and module wiring', () => {
    expect(moduleFile).toContain('PromotionalOffersRepository');
    expect(moduleFile).toContain('ProviderOffersRepository');
    expect(adminController).toContain("@Controller('promotional-offers')");
    expect(providerController).toContain("@Controller('provider/offers')");
    expect(adminController).toContain("@ApiTags('02 Admin - Promotional Offers Management')");
    expect(providerController).toContain("@ApiTags('03 Provider - Promotional Offers')");
    expect(adminController).toContain("@Permissions('promotionalOffers.read')");
    expect(providerController).toContain('@Roles(UserRole.PROVIDER)');
  });
});
