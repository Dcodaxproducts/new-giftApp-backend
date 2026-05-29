import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SUPER_ADMIN_PERMISSIONS } from './modules/admin-roles/constants/permission-catalog';

type Agent = ReturnType<typeof request>;
type ApiResponse<T> = { success: boolean; data: T };
type LoginData = { accessToken: string; user: { role: UserRole } };
type EntityData = { id: string };
type ProviderStatusData = { approvalStatus: string };
type InventoryData = { id: string; status: string };
type GuestSessionData = { guestSessionId?: string; id?: string; role?: string };
type GiftListItem = { id: string };
type RegisterData = { user: { id: string } };
type PaymentIntentData = { paymentId: string; status: string };
type PayoutData = { id: string; status: string };
type StatusData = { status: string };
type BlockedUserData = { id?: string; blockedUser?: { id?: string } };

function responseBody<T>(response: request.Response): ApiResponse<T> {
  const rawBody: unknown = response.body;
  return rawBody as ApiResponse<T>;
}

describe('Production critical flow E2E smoke', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: Agent;
  let jwt: JwtService;
  const stamp = Date.now().toString(36);
  const adminEmail = 'giftapp.superadmin@yopmail.com';
  const adminPassword = 'Admin@123456';

  const seed = {
    categoryId: `cat_${stamp}`,
    providerBusinessCategoryId: `provider_cat_${stamp}`,
    adminId: '',
    providerId: '',
    guestSessionId: '',
    providerEmail: `provider.${stamp}@example.com`,
    providerPassword: 'Provider@123456',
    customerId: '',
    customerEmail: `customer.${stamp}@example.com`,
    customerPassword: 'Customer@123456',
    otherCustomerId: '',
    otherCustomerEmail: `safety.${stamp}@example.com`,
    addressId: '',
    giftId: '',
    cartId: '',
    paymentId: '',
    orderId: '',
    providerOrderId: '',
    chatThreadId: '',
    chatMessageId: '',
    payoutMethodId: '',
    payoutId: '',
    moderationCaseId: '',
    userSafetyReportId: '',
  };

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/gift_app';
    }
    process.env.EMAIL_ENABLED = 'false';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? 'sk_test_smoke';
    process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? 'pk_test_smoke';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [
        { path: '/', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(app.get(ResponseInterceptor));
    app.useGlobalFilters(new HttpExceptionFilter());

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    http = request(app.getHttpServer() as Parameters<typeof request>[0]);
    await seedReferenceData();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('logs in as Super Admin', async () => {
    const response = await http.post('/api/v1/auth/login').send({ email: adminEmail, password: adminPassword }).expect(201);
    const login = responseBody<LoginData>(response);
    expect(login.success).toBe(true);
    expect(login.data.accessToken).toEqual(expect.any(String));
    expect(login.data.user.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('creates and approves provider through admin lifecycle endpoint', async () => {
    const created = await http.post('/api/v1/providers').set('Authorization', auth(admin())).send({
      email: seed.providerEmail,
      firstName: 'Smoke',
      lastName: 'Provider',
      phone: '+15550001001',
      businessName: `Smoke Provider ${stamp}`,
      businessCategoryId: seed.providerBusinessCategoryId,
      businessAddress: '123 Smoke Street',
      fulfillmentMethods: ['DELIVERY'],
      generateTemporaryPassword: false,
      temporaryPassword: seed.providerPassword,
      sendInviteEmail: false,
      approvalStatus: 'PENDING',
      isActive: true,
    }).expect(201);
    seed.providerId = responseBody<EntityData>(created).data.id;

    const approved = await http.patch(`/api/v1/providers/${seed.providerId}/status`).set('Authorization', auth(admin())).send({
      action: 'APPROVE',
      comment: 'Smoke approval',
      notifyProvider: false,
    }).expect(200);
    expect(responseBody<ProviderStatusData>(approved).data.approvalStatus).toBe('APPROVED');
    await prisma.user.update({ where: { id: seed.providerId }, data: { isVerified: true, isApproved: true } });
  });

  it('allows provider login and inventory creation', async () => {
    await http.post('/api/v1/auth/login').send({ email: seed.providerEmail, password: seed.providerPassword }).expect(201);
    const response = await http.post('/api/v1/provider/inventory').set('Authorization', auth(provider())).send({
      name: `Smoke Inventory ${stamp}`,
      description: 'Production smoke inventory item',
      shortDescription: 'Smoke inventory',
      price: 42,
      currency: 'USD',
      categoryId: seed.categoryId,
      imageUrls: ['https://cdn.example.com/smoke.png'],
      variants: [{ name: 'Default', price: 42, isDefault: true, isActive: true }],
    }).expect(201);
    const inventory = responseBody<InventoryData>(response);
    seed.giftId = inventory.data.id;
    expect(inventory.data.status).toBe('ACTIVE');
  });

  it('creates guest session and browses marketplace', async () => {
    const session = await http.post('/api/v1/auth/guest/session').send({ deviceId: `device-${stamp}`, platform: 'WEB', locale: 'en' }).expect(201);
    const guestSession = responseBody<GuestSessionData>(session).data;
    expect(guestSession.guestSessionId ?? guestSession.role).toBeTruthy();
    seed.guestSessionId = guestSession.guestSessionId ?? guestSession.id ?? '';
    const browsing = await http.get('/api/v1/customer/gifts').set('Authorization', auth(guest())).query({ limit: 10 }).expect(200);
    const gifts = responseBody<GiftListItem[]>(browsing).data;
    expect(Array.isArray(gifts)).toBe(true);
    expect(gifts.some((item) => item.id === seed.giftId)).toBe(true);
  });

  it('registers, verifies, and logs in customer', async () => {
    const registered = await http.post('/api/v1/auth/users/register').send({
      email: seed.customerEmail,
      password: seed.customerPassword,
      firstName: 'Smoke',
      lastName: 'Customer',
      phone: '+15550002001',
    }).expect(201);
    seed.customerId = responseBody<RegisterData>(registered).data.user.id;
    await prisma.user.update({ where: { id: seed.customerId }, data: { isVerified: true } });
    await http.post('/api/v1/auth/login').send({ email: seed.customerEmail, password: seed.customerPassword }).expect(201);
  });

  it('creates customer cart, payment intent, and order', async () => {
    const address = await http.post('/api/v1/customer/addresses').set('Authorization', auth(customer())).send({ label: 'Home', fullName: 'Smoke Customer', phone: '+15550002001', line1: '1 Smoke Road', city: 'Karachi', country: 'Pakistan', isDefault: true }).expect(201);
    seed.addressId = responseBody<EntityData>(address).data.id;

    await http.post('/api/v1/customer/cart/items').set('Authorization', auth(customer())).send({ giftId: seed.giftId, quantity: 1, deliveryOption: 'NEXT_DAY', recipientName: 'Smoke Customer', recipientPhone: '+15550002001', recipientAddressId: seed.addressId, giftMessage: 'Smoke gift' }).expect(201);
    const cart = await http.get('/api/v1/customer/cart').set('Authorization', auth(customer())).expect(200);
    seed.cartId = responseBody<EntityData>(cart).data.id;

    const payment = await http.post('/api/v1/customer/payments/create-intent').set('Authorization', auth(customer())).send({ cartId: seed.cartId, paymentMethod: 'COD', idempotencyKey: `cod-${stamp}` }).expect(201);
    const paymentIntent = responseBody<PaymentIntentData>(payment).data;
    seed.paymentId = paymentIntent.paymentId;
    expect(paymentIntent.status).toBe('PENDING');

    const order = await http.post('/api/v1/customer/orders').set('Authorization', auth(customer())).send({ cartId: seed.cartId, paymentId: seed.paymentId, deliveryAddressId: seed.addressId, paymentMethod: 'COD' }).expect(201);
    seed.orderId = responseBody<EntityData>(order).data.id;
    seed.providerOrderId = await findProviderOrderId();
    expect(seed.providerOrderId).toBeTruthy();
  });

  it('creates, sends, reads unified chat messages', async () => {
    const thread = await http.post('/api/v1/chats/threads').set('Authorization', auth(customer())).send({ threadType: 'ORDER_CHAT', sourceType: 'CUSTOMER_ORDER', sourceId: seed.orderId, createIfMissing: true }).expect(201);
    seed.chatThreadId = responseBody<EntityData>(thread).data.id;
    const message = await http.post(`/api/v1/chats/threads/${seed.chatThreadId}/messages`).set('Authorization', auth(customer())).send({ messageType: 'TEXT', body: 'Smoke chat message', clientMessageId: `msg-${stamp}` }).expect(201);
    seed.chatMessageId = responseBody<EntityData>(message).data.id;
    await http.get(`/api/v1/chats/threads/${seed.chatThreadId}/messages`).set('Authorization', auth(customer())).expect(200);
    await http.patch(`/api/v1/chats/threads/${seed.chatThreadId}/read`).set('Authorization', auth(customer())).expect(200);
  });

  it('creates notification delivery log through dispatcher-backed order notification', async () => {
    const count = await prisma.notificationDeliveryLog.count({ where: { recipientId: seed.customerId, notificationType: 'ORDER' } });
    expect(count).toBeGreaterThan(0);
  });

  it('creates provider payout method and payout request', async () => {
    const method = await http.post('/api/v1/provider/payout-methods/bank-accounts').set('Authorization', auth(provider())).send({ accountHolderName: 'Smoke Provider', bankName: 'Smoke Bank', accountType: 'CHECKING', country: 'US', currency: 'USD', routingNumber: '110000000', accountNumber: `000${stamp.replace(/[^0-9]/g, '').padEnd(9, '1')}`, isDefault: true }).expect(201);
    seed.payoutMethodId = responseBody<EntityData>(method).data.id;
    await prisma.providerPayoutMethod.update({ where: { id: seed.payoutMethodId }, data: { verificationStatus: 'VERIFIED' } });
    await prisma.providerEarningsLedger.create({ data: { providerId: seed.providerId, type: 'ADJUSTMENT', direction: 'CREDIT', amount: new Prisma.Decimal(150), currency: 'USD', status: 'AVAILABLE', description: 'Smoke available balance' } });
    const payout = await http.post('/api/v1/provider/payouts/request').set('Authorization', auth(provider())).send({ payoutMethodId: seed.payoutMethodId, amount: 100, idempotencyKey: `payout-${stamp}` }).expect(201);
    const payoutRequest = responseBody<PayoutData>(payout).data;
    seed.payoutId = payoutRequest.id;
    expect(payoutRequest.status).toBe('PENDING');
  });

  it('runs admin provider payout action', async () => {
    const response = await http.post(`/api/v1/admin/provider-payouts/${seed.payoutId}/action`).set('Authorization', auth(admin())).send({ action: 'APPROVE', comment: 'Smoke payout approval', notifyProvider: false }).expect(201);
    expect(responseBody<StatusData>(response).data.status).toBe('PROCESSING');
  });

  it('runs message moderation action', async () => {
    seed.moderationCaseId = await createModerationCase();
    const response = await http.post(`/api/v1/admin/message-moderation/messages/${seed.chatMessageId}/action`).set('Authorization', auth(admin())).send({ action: 'DISMISS_FLAG', reason: 'Smoke dismissal', comment: 'Smoke moderation action' }).expect(201);
    expect(responseBody<StatusData>(response).data.status).toBe('DISMISSED');
  });

  it('reports and blocks a user via user safety flow', async () => {
    seed.otherCustomerId = await createVerifiedCustomer(seed.otherCustomerEmail);
    const report = await http.post(`/api/v1/customer/users/${seed.otherCustomerId}/reports`).set('Authorization', auth(customer())).send({ reason: 'HARASSMENT', details: 'Smoke safety report details', sourceType: 'CHAT', sourceId: seed.chatThreadId, blockUser: true }).expect(201);
    const safetyReport = responseBody<StatusData & EntityData>(report).data;
    seed.userSafetyReportId = safetyReport.id;
    expect(safetyReport.status).toBe('SUBMITTED');
    const blocks = await http.get('/api/v1/customer/blocked-users').set('Authorization', auth(customer())).expect(200);
    expect(responseBody<BlockedUserData[]>(blocks).data.some((item) => item.id === seed.otherCustomerId || item.blockedUser?.id === seed.otherCustomerId)).toBe(true);
  });

  function auth(user: { uid: string; role: UserRole; permissions?: Record<string, string[]> }): string {
    return `Bearer ${jwt.sign(user, { secret: process.env.JWT_ACCESS_SECRET ?? 'test-access-secret' })}`;
  }

  function admin() { return { uid: seed.adminId, role: UserRole.SUPER_ADMIN, permissions: SUPER_ADMIN_PERMISSIONS }; }
  function provider() { return { uid: seed.providerId, role: UserRole.PROVIDER }; }
  function customer() { return { uid: seed.customerId, role: UserRole.REGISTERED_USER }; }
  function guest() { return { uid: seed.guestSessionId, role: UserRole.GUEST_USER, guestSessionId: seed.guestSessionId }; }

  async function seedReferenceData(): Promise<void> {
    await prisma.adminRole.upsert({ where: { slug: 'SUPER_ADMIN' }, update: { permissions: SUPER_ADMIN_PERMISSIONS, isActive: true, deletedAt: null }, create: { name: 'Super Admin', slug: 'SUPER_ADMIN', description: 'Smoke super admin role', permissions: SUPER_ADMIN_PERMISSIONS, isSystem: true, isActive: true } });
    const adminUser = await prisma.user.upsert({ where: { email: adminEmail }, update: { role: UserRole.SUPER_ADMIN, firstName: 'Gift App', lastName: 'Super Admin', isVerified: true, isActive: true, isApproved: true, adminPermissions: SUPER_ADMIN_PERMISSIONS, adminRole: { connect: { slug: 'SUPER_ADMIN' } }, deletedAt: null }, create: { email: adminEmail, password: await bcryptHash(adminPassword), role: UserRole.SUPER_ADMIN, firstName: 'Gift App', lastName: 'Super Admin', isVerified: true, isActive: true, isApproved: true, adminRole: { connect: { slug: 'SUPER_ADMIN' } }, adminPermissions: SUPER_ADMIN_PERMISSIONS } });
    seed.adminId = adminUser.id;
    await prisma.providerBusinessCategory.upsert({ where: { slug: `smoke-provider-${stamp}` }, update: { isActive: true, deletedAt: null }, create: { id: seed.providerBusinessCategoryId, name: `Smoke Provider Category ${stamp}`, slug: `smoke-provider-${stamp}`, isActive: true } });
    await prisma.giftCategory.upsert({ where: { slug: `smoke-${stamp}` }, update: { isActive: true, deletedAt: null }, create: { id: seed.categoryId, name: `Smoke Category ${stamp}`, slug: `smoke-${stamp}`, isActive: true } });
  }

  async function bcryptHash(value: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(value, 10);
  }

  async function findProviderOrderId(): Promise<string> {
    const providerOrder = await prisma.providerOrder.findFirstOrThrow({ where: { orderId: seed.orderId, providerId: seed.providerId } });
    return providerOrder.id;
  }

  async function createVerifiedCustomer(email: string): Promise<string> {
    const user = await prisma.user.create({ data: { email, password: await bcryptHash('Customer@123456'), role: UserRole.REGISTERED_USER, firstName: 'Safety', lastName: 'Target', isVerified: true, isActive: true, isApproved: true } });
    return user.id;
  }

  async function createModerationCase(): Promise<string> {
    await prisma.messageModerationCase.deleteMany({ where: { messageId: seed.chatMessageId } });
    const item = await prisma.messageModerationCase.create({ data: { conversationId: seed.chatThreadId, messageId: seed.chatMessageId, source: 'IN_APP_CHAT', participantId: seed.customerId, participantRole: UserRole.REGISTERED_USER, participantName: 'Smoke Customer', senderId: seed.customerId, senderRole: UserRole.REGISTERED_USER, rawBody: 'Smoke chat message', redactedBody: 'Smoke chat message', flagTypesJson: ['SPAM'], keywordsJson: ['smoke'], severity: 'LOW', confidence: new Prisma.Decimal(0.9), status: 'FLAGGED', lastMessageAt: new Date() } });
    return item.id;
  }
});
