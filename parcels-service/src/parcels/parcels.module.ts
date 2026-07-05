import { Module } from '@nestjs/common';
import { ParcelsController } from './parcels.controller';
import { ParcelRepository } from './parcels.repository';
import { ParcelsService } from './parcels.service';

@Module({
  controllers: [ParcelsController],
  providers: [ParcelsService, ParcelRepository],
})
export class ParcelsModule {}
