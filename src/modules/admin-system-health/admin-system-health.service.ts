import { Injectable } from '@nestjs/common';
import { statfsSync } from 'fs';
import { cpus, freemem, totalmem } from 'os';
import { RequestMetricsService } from '../../common/services/request-metrics.service';
import { SystemHealthGraphRange } from './dto/admin-system-health.dto';

type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';
type CpuSnapshot = { idle: number; total: number };
type DiskUsage = { usedGb: number | null; totalGb: number | null; usagePercent: number | null; status: HealthStatus };
type Bucket = { start: Date; end: Date; label: string };

@Injectable()
export class AdminSystemHealthService {
  private cpuSnapshot = this.readCpuSnapshot();

  constructor(private readonly requestMetrics: RequestMetricsService) {}

  stats() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const metrics = this.requestMetrics.getSamples(last24Hours);
    const totalRequests = metrics.length;
    const failedRequests = metrics.filter((sample) => sample.statusCode >= 400).length;
    const successRequests = totalRequests - failedRequests;
    const averageLatencyMs = this.average(metrics.map((sample) => sample.durationMs));
    const p95LatencyMs = this.percentile(metrics.map((sample) => sample.durationMs), 95);
    const cpuUsagePercent = this.cpuUsagePercent();
    const memory = this.memoryUsage();
    const disk = this.diskUsage();

    return {
      data: {
        serverHealth: {
          cpuUsagePercent,
          cpuStatus: this.percentStatus(cpuUsagePercent, 75, 90),
          memory,
          disk,
          uptimeHours: this.round(process.uptime() / 3600),
          uptimeStatus: 'HEALTHY' as HealthStatus,
        },
        apiHealth: {
          successRatePercent: totalRequests === 0 ? 100 : this.round((successRequests / totalRequests) * 100),
          failureRatePercent: totalRequests === 0 ? 0 : this.round((failedRequests / totalRequests) * 100),
          totalRequests,
          averageLatencyMs,
          p95LatencyMs,
          latencyStatus: this.percentStatus(averageLatencyMs, 500, 1000),
        },
      },
      message: 'System health stats fetched successfully.',
    };
  }

  latencyGraph(range: SystemHealthGraphRange = SystemHealthGraphRange.DAILY) {
    const buckets = this.buckets(range);
    const metrics = this.requestMetrics.getSamples(buckets[0]?.start);

    return {
      data: {
        range,
        points: buckets.map((bucket) => {
          const samples = metrics.filter((sample) => sample.timestamp >= bucket.start && sample.timestamp < bucket.end);
          return {
            label: bucket.label,
            averageLatencyMs: this.average(samples.map((sample) => sample.durationMs)),
            p95LatencyMs: this.percentile(samples.map((sample) => sample.durationMs), 95),
            totalRequests: samples.length,
            failureRatePercent: samples.length === 0 ? 0 : this.round((samples.filter((sample) => sample.statusCode >= 400).length / samples.length) * 100),
          };
        }),
      },
      message: 'System health latency graph fetched successfully.',
    };
  }

  private cpuUsagePercent(): number {
    const current = this.readCpuSnapshot();
    const idleDelta = current.idle - this.cpuSnapshot.idle;
    const totalDelta = current.total - this.cpuSnapshot.total;
    this.cpuSnapshot = current;

    if (totalDelta <= 0) return 0;
    return this.round(Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100)));
  }

  private readCpuSnapshot(): CpuSnapshot {
    return cpus().reduce<CpuSnapshot>(
      (snapshot, cpu) => {
        const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
        return { idle: snapshot.idle + cpu.times.idle, total: snapshot.total + total };
      },
      { idle: 0, total: 0 },
    );
  }

  private memoryUsage() {
    const totalBytes = totalmem();
    const usedBytes = totalBytes - freemem();
    const usagePercent = totalBytes === 0 ? 0 : this.round((usedBytes / totalBytes) * 100);

    return {
      usedGb: this.bytesToGb(usedBytes),
      totalGb: this.bytesToGb(totalBytes),
      usagePercent,
      status: this.percentStatus(usagePercent, 75, 90),
    };
  }

  private diskUsage(): DiskUsage {
    try {
      const stats = statfsSync(process.cwd());
      const totalBytes = Number(stats.blocks) * Number(stats.bsize);
      const availableBytes = Number(stats.bavail) * Number(stats.bsize);
      const usedBytes = Math.max(0, totalBytes - availableBytes);
      const usagePercent = totalBytes === 0 ? 0 : this.round((usedBytes / totalBytes) * 100);

      return {
        usedGb: this.bytesToGb(usedBytes),
        totalGb: this.bytesToGb(totalBytes),
        usagePercent,
        status: this.percentStatus(usagePercent, 80, 92),
      };
    } catch {
      return { usedGb: null, totalGb: null, usagePercent: null, status: 'WARNING' };
    }
  }

  private buckets(range: SystemHealthGraphRange): Bucket[] {
    if (range === SystemHealthGraphRange.WEEKLY) return this.weeklyBuckets();
    if (range === SystemHealthGraphRange.MONTHLY) return this.monthlyBuckets();
    return this.dailyBuckets();
  }

  private dailyBuckets(): Bucket[] {
    const today = this.startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(today);
      start.setDate(today.getDate() - (6 - index));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      return { start, end, label: start.toLocaleDateString('en-US', { weekday: 'short' }) };
    });
  }

  private weeklyBuckets(): Bucket[] {
    const thisWeek = this.startOfWeek(new Date());
    return Array.from({ length: 8 }, (_, index) => {
      const start = new Date(thisWeek);
      start.setDate(thisWeek.getDate() - (7 * (7 - index)));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end, label: `W${index + 1}` };
    });
  }

  private monthlyBuckets(): Bucket[] {
    const thisMonth = this.startOfMonth(new Date());
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(thisMonth);
      start.setMonth(thisMonth.getMonth() - (11 - index));
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      return { start, end, label: start.toLocaleDateString('en-US', { month: 'short' }) };
    });
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private startOfWeek(date: Date): Date {
    const start = this.startOfDay(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return this.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return this.round(sorted[Math.max(0, Math.min(sorted.length - 1, index))]);
  }

  private percentStatus(value: number | null, warningAt: number, criticalAt: number): HealthStatus {
    if (value === null) return 'WARNING';
    if (value >= criticalAt) return 'CRITICAL';
    if (value >= warningAt) return 'WARNING';
    return 'HEALTHY';
  }

  private bytesToGb(value: number): number {
    return this.round(value / 1024 / 1024 / 1024);
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
