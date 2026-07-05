import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RouteRepository } from './routes.repository';
import { RoutesService } from './routes.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutesService, RouteRepository],
  exports: [RoutesService, RouteRepository],
})
export class RoutesModule {}
