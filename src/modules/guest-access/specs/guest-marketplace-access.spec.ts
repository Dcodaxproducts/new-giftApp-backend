import { readFileSync } from 'fs';
import { join } from 'path';

describe('Guest-aware marketplace access wiring', () => {
  const controller = readFileSync(join(__dirname, '../../customer-marketplace/controllers/customer-marketplace.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../../customer-marketplace/services/customer-marketplace.service.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const swagger = readFileSync(join(__dirname, '../../../swagger-access.ts'), 'utf8');

  it('allows guest role only on marketplace read APIs and not private customer APIs', () => {
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER, UserRole.GUEST_USER)');
    for (const route of ["@Get('home')", "@Get('categories')", "@Get('gifts/discounted')", "@Get('gifts/filter-options')", "@Get('gifts')", "@Get('gifts/:id')"]) expect(controller).toContain(route);
    for (const route of ["@Get('cart')", "@Get('wishlist')", "@Get('orders')", "@Get('addresses')", "@Get('reminders')"]) {
      const index = controller.indexOf(route);
      expect(controller.slice(Math.max(0, index - 90), index)).toContain('@Roles(UserRole.REGISTERED_USER)');
    }
    for (const privatePath of ['/customer/cart', '/customer/wishlist', '/customer/orders', '/customer/addresses', '/customer/contacts', '/customer/events', '/customer/wallet', '/customer/payment-methods', '/customer/transactions', '/customer/recurring-payments', '/customer/referrals', '/customer/reviews', '/customer/chats']) {
      expect(swagger).not.toContain(`${privatePath}': { allowedRoles: 'REGISTERED_USER or GUEST_USER`);
    }
  });

  it('uses guest capabilities and guest-safe response behavior', () => {
    expect(controller).toContain("@GuestCapabilities('BROWSE_MARKETPLACE')");
    expect(controller).toContain("@GuestCapabilities('VIEW_GIFT_DETAILS')");
    expect(controller).toContain("@GuestCapabilities('VIEW_MARKETPLACE_FILTERS')");
    expect(service).toContain('this.isGuest(user) ? new Set<string>()');
    expect(service).toContain('requiresAuthForWishlist');
    expect(service).toContain('requiresAuthForCart');
    expect(service).toContain('requiresAuthForCheckout');
    expect(service).toContain("mode: 'GUEST'");
    expect(service).toContain('defaultAddress: null');
    expect(service).toContain('upcomingReminder: null');
    expect(service).toContain('this.isGuest(user) ? new Set<string>()');
  });

  it('adds persistence for guest sessions and settings without a public marketplace controller', () => {
    expect(schema).toContain('model GuestSession');
    expect(schema).toContain('model GuestAccessSettings');
    expect(schema).toContain('GUEST_USER');
    expect(controller).not.toContain("@Controller('public/marketplace')");
  });

  it('Swagger docs show registered or guest marketplace access', () => {
    for (const route of ['home', 'categories', 'gifts', 'gifts/discounted', 'gifts/filter-options', 'gifts/{id}']) {
      expect(swagger).toContain(`GET /api/v1/customer/${route}`);
    }
    expect(swagger).toContain("'GET /api/v1/customer/gifts': { allowedRoles: 'REGISTERED_USER or GUEST_USER'");
    expect(swagger).toContain('Registered users receive personalized marketplace fields such as wishlist state, default address, and upcoming reminders where applicable');
    expect(swagger).toContain('Guest users receive guest-safe marketplace data only');
    expect(swagger).toContain('Guest users cannot access wishlist, cart, checkout, addresses, contacts, events, orders, payments, wallet, recurring payments, chats, reviews, or referrals');
    expect(swagger).toContain('requiresAuthForWishlist=true');
  });
});
