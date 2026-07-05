import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { RouteRepository } from '../routes/routes.repository';

interface ShipmentCreatedEvent {
  event: 'shipment.created';
  shipmentId: string;
  trackingCode: string;
  routeReservationId: string;
  parcelReservationId: string;
  correlationId: string;
  occurredAt: string;
}

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisSubscriberService.name);
  private readonly redis: Redis;
  private readonly channel: string;

  constructor(
    config: ConfigService,
    private readonly repository: RouteRepository,
  ) {
    this.redis = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    this.channel = config.get<string>('LOGISTICS_EVENTS_CHANNEL', 'logistics.events');
  }

  async onModuleInit() {
    await this.redis.connect().catch((error) => {
      this.logger.warn(`Redis no disponible al iniciar: ${error.message}`);
    });

    this.redis.on('message', (channel, message) => {
      if (channel === this.channel) {
        void this.handleMessage(message);
      }
    });

    await this.redis.subscribe(this.channel).catch((error) => {
      this.logger.warn(`No se pudo suscribir a ${this.channel}: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private async handleMessage(message: string) {
    let payload: ShipmentCreatedEvent | undefined;

    try {
      payload = JSON.parse(message) as ShipmentCreatedEvent;

      if (payload.event !== 'shipment.created') {
        return;
      }

      await this.repository.createDispatchAssignment({
        id: randomUUID(),
        shipmentId: payload.shipmentId,
        trackingCode: payload.trackingCode,
        routeReservationId: payload.routeReservationId,
        parcelReservationId: payload.parcelReservationId,
        correlationId: payload.correlationId,
      });

      this.logger.log(
        `Dispatch assignment created shipmentId=${payload.shipmentId} correlationId=${payload.correlationId}`,
      );
    } catch (error) {
      await this.repository.logFailedEvent({
        eventName: payload?.event ?? 'unknown',
        payload: payload ?? { raw: message },
        reason: error instanceof Error ? error.message : 'Error desconocido',
        correlationId: payload?.correlationId,
      });
    }
  }
}
