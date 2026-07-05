import { Module } from '@nestjs/common';
import { RoutesModule } from '../routes/routes.module';
import { RedisSubscriberService } from './redis-subscriber.service';

@Module({
  imports: [RoutesModule],
  providers: [RedisSubscriberService],
})
export class RedisEventsModule {}
