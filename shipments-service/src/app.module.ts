import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { IntegrationsModule } from './integrations/integrations.module';
import { ShipmentsModule } from './shipments/shipments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    IntegrationsModule,
    ShipmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
