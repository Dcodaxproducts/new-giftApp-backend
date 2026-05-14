import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AddressInfo } from 'net';
import { PublicController } from './public.controller';

type HealthBody = { data: { status: string; service: string; company: string; uptime: number; timestamp: string }; message: string };

describe('PublicController', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [PublicController] }).compile();
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

  it('GET / returns health JSON', async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.json() as HealthBody;
    expect(body).toEqual(expect.objectContaining({ message: 'Service is healthy.' }));
    expect(body.data).toEqual(expect.objectContaining({ status: 'ok', service: 'Gift App Backend', company: 'Dcodax Technologies' }));
    expect(typeof body.data.uptime).toBe('number');
    expect(body.data.timestamp).toEqual(expect.any(String));
  });

  it('GET /health returns 200 without authentication', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json() as HealthBody;
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
