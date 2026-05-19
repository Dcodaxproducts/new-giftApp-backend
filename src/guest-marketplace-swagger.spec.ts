import { readFileSync } from 'fs';
import { join } from 'path';

type Operation = { tags?: string[]; 'x-allowed-roles'?: string; description?: string };
type OpenApi = { paths: Record<string, Record<string, Operation>>; tags?: { name?: string }[] };

const marketplacePaths = [
  '/api/v1/customer/home',
  '/api/v1/customer/categories',
  '/api/v1/customer/gifts',
  '/api/v1/customer/gifts/discounted',
  '/api/v1/customer/gifts/filter-options',
  '/api/v1/customer/gifts/{id}',
];

const privateCustomerPrefixes = [
  '/api/v1/customer/cart',
  '/api/v1/customer/wishlist',
  '/api/v1/customer/orders',
  '/api/v1/customer/addresses',
  '/api/v1/customer/contacts',
  '/api/v1/customer/events',
  '/api/v1/customer/wallet',
  '/api/v1/customer/payment-methods',
  '/api/v1/customer/transactions',
  '/api/v1/customer/recurring-payments',
  '/api/v1/customer/referrals',
  '/api/v1/customer/reviews',
  '/api/v1/chats',
];

describe('Guest marketplace Swagger docs', () => {
  const spec = JSON.parse(readFileSync(join(__dirname, '../docs/generated/openapi.json'), 'utf8')) as OpenApi;

  it('groups marketplace read APIs under Customer / Guest Marketplace with registered or guest access', () => {
    expect(spec.tags?.some((tag) => tag.name === '05 Customer / Guest - Marketplace')).toBe(true);
    for (const path of marketplacePaths) {
      const operation = spec.paths[path]?.get;
      expect(operation).toBeDefined();
      expect(operation?.tags).toEqual(['05 Customer / Guest - Marketplace']);
      expect(operation?.['x-allowed-roles']).toBe('REGISTERED_USER or GUEST_USER');
      expect(operation?.description).toContain('Registered users receive personalized marketplace fields such as wishlist state, default address, and upcoming reminders where applicable');
      expect(operation?.description).toContain('Guest users receive guest-safe marketplace data only');
      expect(operation?.description).toContain('Guest users cannot access wishlist, cart, checkout, addresses, contacts, events, orders, payments, wallet, recurring payments, chats, reviews, or referrals');
    }
  });

  it('does not expose GUEST_USER on private customer APIs', () => {
    const badRoutes: string[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      if (!privateCustomerPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) continue;
      for (const [method, operation] of Object.entries(item)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
        if (operation['x-allowed-roles']?.includes('GUEST_USER')) badRoutes.push(`${method.toUpperCase()} ${path}`);
      }
    }
    expect(badRoutes).toEqual([]);
  });
});
