import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MEDIA_KEY_PATTERN = /(image|images|avatar|logo|photo|photos|media|file|files|evidence|document|documents|thumbnail|icon).*urls?$/i;
const SIGNABLE_FOLDER_PREFIXES = [
  'admin-avatars/',
  'user-avatars/',
  'provider-logos/',
  'provider-documents/',
  'provider-item-images/',
  'gift-images/',
  'gift-category-images/',
  'customer-contact-avatars/',
  'broadcast-images/',
  'gift-message-media/',
];

type JsonObject = Record<string, unknown>;

@Injectable()
export class MediaUrlSignerService {
  private client?: S3Client;

  constructor(private readonly configService: ConfigService) {}

  async signResponseImages<T>(value: T): Promise<T> {
    return this.signValue(value) as Promise<T>;
  }

  private async signValue(value: unknown, key?: string, parentKey?: string): Promise<unknown> {
    if (typeof value === 'string') {
      return this.isMediaField(key, parentKey) ? this.signIfOwnedMediaUrl(value) : value;
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => this.signValue(item, key, parentKey)));
    }

    if (!this.isPlainObject(value)) {
      return value;
    }

    const entries = await Promise.all(
      Object.entries(value).map(async ([childKey, childValue]) => [childKey, await this.signValue(childValue, childKey, key)] as const),
    );
    return Object.fromEntries(entries);
  }

  private isMediaField(key?: string, parentKey?: string): boolean {
    if (!key) return false;
    if (MEDIA_KEY_PATTERN.test(key)) return true;
    return key === 'url' && !!parentKey && /(media|evidence|image|photo|file|document)s?$/i.test(parentKey);
  }

  private async signIfOwnedMediaUrl(value: string): Promise<string> {
    if (!value || value.includes('X-Amz-Signature=')) return value;

    const bucket = this.configService.get<string>('AWS_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    if (!bucket || !region || !accessKeyId || !secretAccessKey) return value;

    const key = this.extractStorageKey(value, bucket, region);
    if (!key) return value;

    const expiresIn = Number(this.configService.get<string>('AWS_PRESIGNED_READ_EXPIRY_SECONDS', '3600'));
    return getSignedUrl(this.getClient(region, accessKeyId, secretAccessKey), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  }

  private extractStorageKey(value: string, bucket: string, region: string): string | null {
    if (SIGNABLE_FOLDER_PREFIXES.some((prefix) => value.startsWith(prefix))) return value;

    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return null;
    }

    const pathKey = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    const publicBaseUrl = this.configService.get<string>('AWS_PUBLIC_BASE_URL')?.replace(/\/$/, '');
    if (publicBaseUrl && value.startsWith(`${publicBaseUrl}/`) && SIGNABLE_FOLDER_PREFIXES.some((prefix) => pathKey.startsWith(prefix))) return pathKey;

    const s3Hosts = new Set([`${bucket}.s3.${region}.amazonaws.com`, `${bucket}.s3.amazonaws.com`]);
    if (s3Hosts.has(parsed.hostname) && SIGNABLE_FOLDER_PREFIXES.some((prefix) => pathKey.startsWith(prefix))) return pathKey;

    return null;
  }

  private getClient(region: string, accessKeyId: string, secretAccessKey: string): S3Client {
    if (this.client) return this.client;
    this.client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    return this.client;
  }

  private isPlainObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
  }
}
