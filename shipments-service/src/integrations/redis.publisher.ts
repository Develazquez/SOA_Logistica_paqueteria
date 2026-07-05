import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPublisher.name);
  private readonly redis: Redis;
  private readonly channel = 'logistics.events';

  constructor(config: ConfigService) {
    this.redis = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
  }

  async publishShipmentCreated(event: Record<string, unknown>) {
    await this.redis.connect().catch(() => undefined);
    await this.redis.publish(this.channel, JSON.stringify(event));
    this.logger.log(`Published shipment.created correlationId=${event.correlationId}`);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
