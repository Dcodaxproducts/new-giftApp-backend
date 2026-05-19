import { PublicController } from './public.controller';

type HealthBody = { data: { status: string; service: string; company: string; uptime: number; timestamp: string }; message: string };

describe('PublicController', () => {
  let controller: PublicController;

  beforeEach(() => {
    controller = new PublicController();
  });

  it('GET / returns health JSON without authentication', () => {
    const body = controller.getHome() as HealthBody;
    expect(body).toEqual(expect.objectContaining({ message: 'Service is healthy.' }));
    expect(body.data).toEqual(expect.objectContaining({ status: 'ok', service: 'Gift App Backend', company: 'Dcodax Technologies' }));
    expect(typeof body.data.uptime).toBe('number');
    expect(body.data.timestamp).toEqual(expect.any(String));
  });

  it('GET /health returns health JSON without authentication', () => {
    const body = controller.getHealth() as HealthBody;
    expect(body.message).toBe('Service is healthy.');
  });

  it('GET /health does not expose secrets', () => {
    const serialized = JSON.stringify(controller.getHealth()).toLowerCase();
    expect(serialized).not.toContain('database_url');
    expect(serialized).not.toContain('stripe_secret');
    expect(serialized).not.toContain('aws_secret');
    expect(serialized).not.toContain('smtp');
  });

  it('does not define an /api/v1 public handler', () => {
    const methodNames = Object.getOwnPropertyNames(PublicController.prototype);
    expect(methodNames).toEqual(expect.arrayContaining(['getHome', 'getHealth']));
    expect(methodNames).not.toContain('apiV1');
  });
});
