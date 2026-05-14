import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressInfo } from 'net';
import { PublicController } from './public.controller';

describe('PublicController', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [PublicController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    const server = app.getHttpServer() as { address: () => AddressInfo | string | null };
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => { await app.close(); });

  it('GET / returns 200 without authentication', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
  });

  it('GET / includes Gift App Backend', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(await response.text()).toContain('Gift App Backend');
  });

  it('GET / includes Dcodax Technologies', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(await response.text()).toContain('Dcodax Technologies');
  });

  it('GET / includes /docs link/reference', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(await response.text()).toContain('/docs');
  });

  it('GET / returns JSON fallback when JSON is requested', async () => {
    const response = await fetch(`${baseUrl}/`, { headers: { Accept: 'application/json' } });
    const body = await response.json() as { data: { name: string; apiBasePath: string; swaggerUrl: string; healthUrl: string }; message: string };
    expect(response.status).toBe(200);
    expect(body.message).toBe('Gift App Backend is running successfully.');
    expect(body.data).toEqual(expect.objectContaining({ name: 'Gift App Backend', apiBasePath: '/api/v1', swaggerUrl: '/docs', healthUrl: '/health' }));
  });

  it('GET /health returns 200 without authentication', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json() as { message: string };
    expect(response.status).toBe(200);
    expect(body.message).toBe('Service is healthy.');
  });

  it('GET /health does not expose secrets', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const serialized = JSON.stringify(await response.json()).toLowerCase();
    expect(serialized).not.toContain('database_url');
    expect(serialized).not.toContain('stripe_secret');
    expect(serialized).not.toContain('aws_secret');
    expect(serialized).not.toContain('smtp');
  });

  it('GET /api/v1 existing routes remain unchanged and are not handled by public root', async () => {
    const response = await fetch(`${baseUrl}/api/v1`);
    expect(response.status).toBe(404);
  });
});
