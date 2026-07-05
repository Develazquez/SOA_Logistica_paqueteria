import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ShipmentRepository } from './shipments.repository';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [AuthModule, IntegrationsModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentRepository],
})
export class ShipmentsModule {}
