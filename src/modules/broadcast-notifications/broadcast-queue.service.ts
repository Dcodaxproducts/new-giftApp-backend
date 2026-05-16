import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BroadcastStatus } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { BroadcastDeliveryService } from './broadcast-delivery.service';
import { BroadcastQueueRepository } from './broadcast-queue.repository';

@Injectable()
export class BroadcastQueueService implements OnModuleInit {
  private readonly logger = new Logger(BroadcastQueueService.name);
  private queue?: Queue<{ broadcastId: string }>;
  private worker?: Worker<{ broadcastId: string }>;

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: BroadcastQueueRepository,
    private readonly delivery: BroadcastDeliveryService,
  ) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue('broadcast-delivery', { connection });
      this.worker = new Worker('broadcast-delivery', async (job) => this.delivery.process(job.data.broadcastId), { connection });
      this.logger.log('Broadcast queue initialized with BullMQ/Redis');
      return;
    }
    this.logger.warn('REDIS_URL missing; using in-memory broadcast queue adapter');
  }

  async enqueueNow(broadcastId: string): Promise<void> {
    if (this.queue) {
      await this.queue.add('broadcast.send', { broadcastId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
      return;
    }
    setImmediate(() => void this.delivery.process(broadcastId));
  }

  async enqueueScheduled(broadcastId: string, scheduledAt: Date): Promise<void> {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    if (this.queue) {
      await this.queue.add('broadcast.send', { broadcastId }, { delay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
      return;
    }
    setTimeout(() => void this.runIfStillScheduled(broadcastId), delay);
  }

  async cancel(): Promise<void> {
    // BullMQ delayed job IDs are not persisted yet; status guard prevents cancelled broadcasts from processing.
  }

  private async runIfStillScheduled(broadcastId: string): Promise<void> {
    const broadcast = await this.repository.findBroadcastById(broadcastId);
    if (broadcast?.status === BroadcastStatus.SCHEDULED) {
      await this.delivery.process(broadcastId);
    }
  }
}
