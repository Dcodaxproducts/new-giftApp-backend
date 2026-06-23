import { readFileSync } from 'fs';
import { join } from 'path';
import { RequestMetricsService } from '../../common/services/request-metrics.service';
import { AdminSystemHealthService } from './admin-system-health.service';
import { SystemHealthGraphRange } from './dto/admin-system-health.dto';

describe('AdminSystemHealthService', () => {
  function createService() {
    const metrics = new RequestMetricsService();
    const now = new Date();
    metrics.record({ timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), method: 'GET', path: '/api/v1/customer/gifts', statusCode: 200, durationMs: 120 });
    metrics.record({ timestamp: new Date(now.getTime() - 60 * 60 * 1000), method: 'POST', path: '/api/v1/auth/login', statusCode: 401, durationMs: 300 });
    metrics.record({ timestamp: now, method: 'GET', path: '/api/v1/admin/dashboard', statusCode: 200, durationMs: 60 });
    return { service: new AdminSystemHealthService(metrics), metrics };
  }

  it('returns server and API health card data from runtime metrics', () => {
    const { service } = createService();
    const result = service.stats();

    expect(result.message).toBe('System health stats fetched successfully.');
    expect(result.data.serverHealth).toEqual(expect.objectContaining({
      cpuUsagePercent: expect.any(Number),
      cpuStatus: expect.any(String),
      memory: expect.objectContaining({ usedGb: expect.any(Number), totalGb: expect.any(Number), usagePercent: expect.any(Number) }),
      disk: expect.objectContaining({ status: expect.any(String) }),
      uptimeHours: expect.any(Number),
    }));
    expect(result.data.apiHealth).toEqual(expect.objectContaining({
      totalRequests: 3,
      successRatePercent: 66.67,
      failureRatePercent: 33.33,
      averageLatencyMs: 160,
      p95LatencyMs: 300,
    }));
  });

  it('returns daily, weekly, and monthly latency graph buckets', () => {
    const { service } = createService();

    expect(service.latencyGraph(SystemHealthGraphRange.DAILY).data.points).toHaveLength(7);
    expect(service.latencyGraph(SystemHealthGraphRange.WEEKLY).data.points).toHaveLength(8);
    expect(service.latencyGraph(SystemHealthGraphRange.MONTHLY).data.points).toHaveLength(12);
  });

  it('exposes only the system health stats and latency graph routes', () => {
    const controller = readFileSync(join(__dirname, './admin-system-health.controller.ts'), 'utf8');

    expect(controller).toContain("@Controller('admin/system-health')");
    expect(controller).toContain("@Get('stats')");
    expect(controller).toContain("@Get('latency-graph')");
    expect(controller.match(/@Permissions\('systemHealth\.read'\)/g)).toHaveLength(2);
  });
});
