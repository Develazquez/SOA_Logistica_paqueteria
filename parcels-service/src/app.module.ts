import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { ParcelsModule } from './parcels/parcels.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, ParcelsModule],
  controllers: [HealthController],
})
export class AppModule {}
