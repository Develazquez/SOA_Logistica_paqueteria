import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ShipmentsService } from './shipments.service';

@ApiTags('shipments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT requerido o invalido.' })
@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Post()
  @ApiCreatedResponse({ type: ShipmentResponseDto })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipments.create(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShipmentResponseDto })
  findOne(@Param('id') id: string) {
    return this.shipments.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ type: ShipmentResponseDto })
  cancel(@Param('id') id: string, @Body() dto: CancelShipmentDto) {
    return this.shipments.cancel(id, dto);
  }
}
