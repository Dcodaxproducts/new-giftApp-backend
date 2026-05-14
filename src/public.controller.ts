import { Controller, Get, Header, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

type LandingData = { name: string; company: string; status: string; version: string; environment: string; apiBasePath: string; swaggerUrl: string; healthUrl: string; timestamp: string };

@ApiTags('00 Public')
@Controller()
export class PublicController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/')
  @ApiOperation({ summary: 'Backend landing page', description: 'PUBLIC. Returns HTML for browsers and JSON for API clients.' })
  getHome(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const data = this.landingData();
    if (this.expectsJson(request)) return { data, message: 'Gift App Backend is running successfully.' };
    response.type('html');
    return this.html(data);
  }

  @Get('/health')
  @ApiOperation({ summary: 'Health check', description: 'PUBLIC. Does not expose secrets or internal paths.' })
  getHealth() {
    return { data: { status: 'ok', service: 'Gift App Backend', company: 'Dcodax Technologies', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() }, message: 'Service is healthy.' };
  }

  @Get('/health/ready')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Readiness check', description: 'PUBLIC. Basic app readiness check.' })
  getReadiness() {
    return { data: { status: 'ready', database: 'not_checked', service: 'Gift App Backend', timestamp: new Date().toISOString() }, message: 'Service is ready.' };
  }

  private landingData(): LandingData {
    return { name: 'Gift App Backend', company: 'Dcodax Technologies', status: 'running', version: this.version(), environment: this.configService.get<string>('NODE_ENV', 'development'), apiBasePath: '/api/v1', swaggerUrl: '/docs', healthUrl: '/health', timestamp: new Date().toISOString() };
  }

  private expectsJson(request: Request): boolean { const accept = request.headers.accept ?? ''; return accept.includes('application/json') && !accept.includes('text/html'); }

  private html(data: LandingData): string {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Gift App Backend | Dcodax Technologies</title><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e5e7eb}main{min-height:100vh;display:grid;place-items:center;padding:32px}section{max-width:760px;width:100%;background:#111827;border:1px solid #334155;border-radius:24px;padding:36px;box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{margin:0 0 8px;font-size:38px;color:#fff}p{color:#cbd5e1;line-height:1.6}.badge{display:inline-block;margin:16px 0;padding:8px 12px;border-radius:999px;background:#064e3b;color:#a7f3d0;font-weight:700}dl{display:grid;grid-template-columns:180px 1fr;gap:12px 18px;margin-top:24px}dt{color:#94a3b8}dd{margin:0;color:#f8fafc}a{color:#93c5fd;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><main><section><h1>${data.name}</h1><p>A Dcodax Technologies project.</p><div class="badge">API Status: Running</div><p>Gift App Backend is running successfully. Built by Dcodax Technologies. Use <a href="${data.swaggerUrl}">/docs</a> for Swagger API documentation and <code>/api/v1</code> for backend APIs.</p><dl><dt>Environment</dt><dd>${data.environment}</dd><dt>API Base Path</dt><dd>${data.apiBasePath}</dd><dt>Swagger Documentation</dt><dd><a href="${data.swaggerUrl}">${data.swaggerUrl}</a></dd><dt>Health Check</dt><dd><a href="${data.healthUrl}">${data.healthUrl}</a></dd><dt>Version</dt><dd>${data.version}</dd></dl></section></main></body></html>`;
  }

  private version(): string {
    try { const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version?: string }; return pkg.version ?? '0.1.0'; } catch { return '0.1.0'; }
  }
}
