import { Module } from '@nestjs/common';
import { ParcelsClient } from './parcels.client';
import { RedisPublisher } from './redis.publisher';
import { RoutesClient } from './routes.client';

@Module({
  providers: [ParcelsClient, RoutesClient, RedisPublisher],
  exports: [ParcelsClient, RoutesClient, RedisPublisher],
})
export class IntegrationsModule {}
