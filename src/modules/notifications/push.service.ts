import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { App, cert, deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { createHash } from 'node:crypto';
import { PushRepository } from './repositories/push.repository';

const FIREBASE_APP_NAME = 'gift-app-push';
const MULTICAST_BATCH_SIZE = 500;
const CREDENTIAL_CACHE_MS = 60_000;
// Only codes that prove the token itself is dead. `messaging/invalid-argument` is excluded on
// purpose: it usually means a malformed payload, which fails for every token in the batch and
// would wipe the whole table.
const UNREGISTERED_TOKEN_CODES = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

export type PushMessage = { title: string; body: string; data?: Record<string, unknown> };
export type RegisterDeviceInput = { token: string; platform: DevicePlatform; deviceId?: string | null };
type FirebaseCredential = { projectId: string; clientEmail: string; privateKey: string };

@Injectable()
export class PushService implements OnModuleDestroy {
  private readonly logger = new Logger(PushService.name);
  private app?: App;
  private messaging?: Messaging;
  private fingerprint?: string;
  private credentialCache: { value: FirebaseCredential | null; expiresAt: number } = { value: null, expiresAt: 0 };

  constructor(private readonly pushRepository: PushRepository) {}

  async onModuleDestroy(): Promise<void> {
    await this.disposeApp();
  }

  registerDevice(userId: string, input: RegisterDeviceInput) {
    return this.pushRepository.upsertDeviceToken({ userId, token: input.token, platform: input.platform, deviceId: input.deviceId });
  }

  unregisterDevice(userId: string, token: string) {
    return this.pushRepository.deleteDeviceToken(userId, token);
  }

  async isConfigured(): Promise<boolean> {
    return (await this.loadCredential()) !== null;
  }

  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    await this.sendToUsers([userId], message);
  }

  /** Never throws: push is a side channel and must not fail the request that triggered it. */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<void> {
    if (!userIds.length) return;
    try {
      const messaging = await this.resolveMessaging();
      if (!messaging) return;
      const devices = await this.pushRepository.findDeviceTokensByUserIds(userIds);
      if (!devices.length) return;
      const stale = await this.deliver(messaging, devices.map((device) => device.token), message);
      if (stale.length) {
        await this.pushRepository.deleteDeviceTokensByValues(stale);
        this.logger.log(`Removed ${stale.length} unregistered device token(s)`);
      }
    } catch (error) {
      this.logger.warn(`Push notification failed: ${this.errorMessage(error)}`);
    }
  }

  private async deliver(messaging: Messaging, tokens: string[], message: PushMessage): Promise<string[]> {
    const data = this.toDataPayload(message.data);
    const stale: string[] = [];
    for (const batch of this.chunk(tokens, MULTICAST_BATCH_SIZE)) {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title: message.title, body: message.body },
        data,
        android: { priority: 'high', notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      response.responses.forEach((result, index) => {
        if (result.success) return;
        const code = this.errorCode(result.error);
        if (UNREGISTERED_TOKEN_CODES.has(code)) stale.push(batch[index]);
        else this.logger.warn(`Push delivery failed for one device: ${code || this.errorMessage(result.error)}`);
      });
    }
    return stale;
  }

  /** Rebuilds the Firebase app when an admin rotates the service account in system settings. */
  private async resolveMessaging(): Promise<Messaging | null> {
    const credential = await this.loadCredential();
    if (!credential) return null;
    const fingerprint = createHash('sha256').update(`${credential.projectId}:${credential.clientEmail}:${credential.privateKey}`).digest('hex');
    if (this.messaging && this.fingerprint === fingerprint) return this.messaging;
    await this.disposeApp();
    this.app = initializeApp({ credential: cert(credential) }, FIREBASE_APP_NAME);
    this.messaging = getMessaging(this.app);
    this.fingerprint = fingerprint;
    this.logger.log(`Firebase messaging initialized for project ${credential.projectId}`);
    return this.messaging;
  }

  private async loadCredential(): Promise<FirebaseCredential | null> {
    const now = Date.now();
    if (now < this.credentialCache.expiresAt) return this.credentialCache.value;
    const credential = this.parseCredential(await this.pushRepository.findFirebaseServiceAccount());
    this.credentialCache = { value: credential, expiresAt: now + CREDENTIAL_CACHE_MS };
    if (!credential) this.logger.warn('Firebase service account is not configured in system settings; push delivery is skipped');
    return credential;
  }

  private parseCredential(raw: unknown): FirebaseCredential | null {
    const account = typeof raw === 'string' ? this.parseJson(raw) : raw;
    if (!account || typeof account !== 'object' || Array.isArray(account)) return null;
    const { project_id: projectId, client_email: clientEmail, private_key: privateKey } = account as Record<string, unknown>;
    if (typeof projectId !== 'string' || typeof clientEmail !== 'string' || typeof privateKey !== 'string') return null;
    if (!projectId || !clientEmail || !privateKey) return null;
    // Service accounts pasted through a form arrive with escaped newlines; real JSON is unaffected.
    return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') };
  }

  private async disposeApp(): Promise<void> {
    const existing = this.app ?? getApps().find((app) => app.name === FIREBASE_APP_NAME);
    this.app = undefined;
    this.messaging = undefined;
    this.fingerprint = undefined;
    if (!existing) return;
    try {
      await deleteApp(existing);
    } catch (error) {
      this.logger.warn(`Failed to dispose Firebase app: ${this.errorMessage(error)}`);
    }
  }

  private toDataPayload(data?: Record<string, unknown>): Record<string, string> | undefined {
    if (!data) return undefined;
    const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)] as const);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  private parseJson(value: string): unknown { try { return JSON.parse(value); } catch { return null; } }
  private chunk<T>(items: T[], size: number): T[][] { const chunks: T[][] = []; for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size)); return chunks; }
  private errorCode(error: unknown): string { if (typeof error !== 'object' || error === null || !('code' in error)) return ''; return typeof error.code === 'string' ? error.code : ''; }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Push delivery failed'; }
}
