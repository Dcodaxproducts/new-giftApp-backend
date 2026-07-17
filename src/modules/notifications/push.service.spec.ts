import { DevicePlatform } from '@prisma/client';
import { cert, deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PushService } from './push.service';

jest.mock('firebase-admin/app', () => ({ initializeApp: jest.fn(), cert: jest.fn(), deleteApp: jest.fn(), getApps: jest.fn() }));
jest.mock('firebase-admin/messaging', () => ({ getMessaging: jest.fn() }));

const serviceAccount = { type: 'service_account', project_id: 'gift-platform', client_email: 'sa@gift-platform.iam.gserviceaccount.com', private_key: '-----BEGIN KEY-----\\nline-two\\n-----END KEY-----' };
const message = { title: 'Order confirmed', body: 'Your order has been confirmed.' };
const ok = { success: true, messageId: 'message_1' };
const failed = (code: string) => ({ success: false, error: Object.assign(new Error(code), { code }) });
type MulticastMessage = { tokens: string[]; notification: { title: string; body: string } };
const sendEachForMulticast = jest.fn<Promise<unknown>, [MulticastMessage]>();

const createService = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
  const repository = {
    findFirebaseServiceAccount: jest.fn().mockResolvedValue(serviceAccount),
    findDeviceTokensByUserIds: jest.fn().mockResolvedValue([{ token: 'token_phone', platform: DevicePlatform.ANDROID }]),
    deleteDeviceTokensByValues: jest.fn().mockResolvedValue({ count: 1 }),
    deleteDeviceToken: jest.fn().mockResolvedValue({ count: 1 }),
    upsertDeviceToken: jest.fn().mockResolvedValue({ id: 'device_1', platform: DevicePlatform.ANDROID }),
    ...overrides,
  };
  return { service: new PushService(repository as never), repository };
};

beforeEach(() => {
  jest.clearAllMocks();
  (getApps as jest.Mock).mockReturnValue([]);
  (cert as jest.Mock).mockImplementation((credential: unknown) => credential);
  (initializeApp as jest.Mock).mockReturnValue({ name: 'gift-app-push' });
  (deleteApp as jest.Mock).mockResolvedValue(undefined);
  (getMessaging as jest.Mock).mockReturnValue({ sendEachForMulticast });
  sendEachForMulticast.mockResolvedValue({ responses: [ok], successCount: 1, failureCount: 0 });
});

describe('PushService', () => {
  it('skips delivery when no firebase service account is configured', async () => {
    const { service, repository } = createService({ findFirebaseServiceAccount: jest.fn().mockResolvedValue(null) });
    await expect(service.sendToUser('umer', message)).resolves.toBeUndefined();
    expect(sendEachForMulticast).not.toHaveBeenCalled();
    expect(repository.findDeviceTokensByUserIds).not.toHaveBeenCalled();
  });

  it('sends a single multicast to every device registered to the user', async () => {
    const { service, repository } = createService({ findDeviceTokensByUserIds: jest.fn().mockResolvedValue([{ token: 'token_phone' }, { token: 'token_tablet' }]) });
    sendEachForMulticast.mockResolvedValue({ responses: [ok, ok], successCount: 2, failureCount: 0 });
    await service.sendToUser('umer', message);
    expect(repository.findDeviceTokensByUserIds).toHaveBeenCalledWith(['umer']);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(sendEachForMulticast).toHaveBeenCalledWith(expect.objectContaining({ tokens: ['token_phone', 'token_tablet'], notification: { title: message.title, body: message.body } }));
  });

  it('unescapes newlines in a service account private key pasted as JSON text', async () => {
    const { service } = createService({ findFirebaseServiceAccount: jest.fn().mockResolvedValue(JSON.stringify(serviceAccount)) });
    await service.sendToUser('umer', message);
    expect(cert).toHaveBeenCalledWith({ projectId: 'gift-platform', clientEmail: serviceAccount.client_email, privateKey: '-----BEGIN KEY-----\nline-two\n-----END KEY-----' });
  });

  it('removes only the tokens firebase reports as unregistered', async () => {
    const { service, repository } = createService({ findDeviceTokensByUserIds: jest.fn().mockResolvedValue([{ token: 'token_live' }, { token: 'token_dead' }]) });
    sendEachForMulticast.mockResolvedValue({ responses: [ok, failed('messaging/registration-token-not-registered')], successCount: 1, failureCount: 1 });
    await service.sendToUser('umer', message);
    expect(repository.deleteDeviceTokensByValues).toHaveBeenCalledWith(['token_dead']);
  });

  it('keeps every token when the whole batch fails on a payload error', async () => {
    const { service, repository } = createService({ findDeviceTokensByUserIds: jest.fn().mockResolvedValue([{ token: 'token_phone' }, { token: 'token_tablet' }]) });
    sendEachForMulticast.mockResolvedValue({ responses: [failed('messaging/invalid-argument'), failed('messaging/invalid-argument')], successCount: 0, failureCount: 2 });
    await service.sendToUser('umer', message);
    expect(repository.deleteDeviceTokensByValues).not.toHaveBeenCalled();
  });

  it('splits delivery into batches of 500 tokens', async () => {
    const devices = Array.from({ length: 600 }, (_, index) => ({ token: `token_${index}` }));
    const { service } = createService({ findDeviceTokensByUserIds: jest.fn().mockResolvedValue(devices) });
    sendEachForMulticast.mockResolvedValue({ responses: [], successCount: 0, failureCount: 0 });
    await service.sendToUser('umer', message);
    expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
    expect(sendEachForMulticast.mock.calls[0][0].tokens).toHaveLength(500);
    expect(sendEachForMulticast.mock.calls[1][0].tokens).toHaveLength(100);
  });

  it('never throws when firebase delivery fails', async () => {
    const { service } = createService();
    sendEachForMulticast.mockRejectedValue(new Error('firebase unreachable'));
    await expect(service.sendToUser('umer', message)).resolves.toBeUndefined();
  });

  it('rebuilds the firebase app when the service account is rotated', async () => {
    const rotated = { ...serviceAccount, private_key: '-----BEGIN ROTATED-----' };
    const findFirebaseServiceAccount = jest.fn().mockResolvedValueOnce(serviceAccount).mockResolvedValueOnce(rotated);
    const { service } = createService({ findFirebaseServiceAccount });
    await service.sendToUser('umer', message);
    (service as unknown as { credentialCache: { expiresAt: number } }).credentialCache.expiresAt = 0;
    await service.sendToUser('umer', message);
    expect(deleteApp).toHaveBeenCalledTimes(1);
    expect(initializeApp).toHaveBeenCalledTimes(2);
  });

  it('reuses the cached credential instead of reading settings on every send', async () => {
    const { service, repository } = createService();
    await service.sendToUser('umer', message);
    await service.sendToUser('umer', message);
    expect(repository.findFirebaseServiceAccount).toHaveBeenCalledTimes(1);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it('binds a registered device to the authenticated user', async () => {
    const { service, repository } = createService();
    await service.registerDevice('umer', { token: 'token_phone', platform: DevicePlatform.ANDROID, deviceId: 'pixel-8' });
    expect(repository.upsertDeviceToken).toHaveBeenCalledWith({ userId: 'umer', token: 'token_phone', platform: DevicePlatform.ANDROID, deviceId: 'pixel-8' });
  });
});
