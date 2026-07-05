import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { RedisEventsModule } from './redis-events/redis-events.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RoutesModule,
    RedisEventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
