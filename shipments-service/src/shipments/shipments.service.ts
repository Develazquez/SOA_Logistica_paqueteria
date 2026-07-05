import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ParcelsClient } from '../integrations/parcels.client';
import { RedisPublisher } from '../integrations/redis.publisher';
import { RoutesClient } from '../integrations/routes.client';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ShipmentRecord, ShipmentRepository } from './shipments.repository';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly repository: ShipmentRepository,
    private readonly parcels: ParcelsClient,
    private readonly routes: RoutesClient,
    private readonly events: RedisPublisher,
  ) {}

  async create(dto: CreateShipmentDto): Promise<ShipmentResponseDto> {
    const existing = await this.repository.findByIdempotencyKey(dto.idempotencyKey);
    if (existing) {
      return this.toResponse(existing);
    }

    const shipmentId = randomUUID();
    const correlationId = randomUUID();
    let parcelReservationId: string | undefined;
    let routeReservationId: string | undefined;

    const shipment = await this.repository.createPending(shipmentId, correlationId, dto);
    await this.repository.logStep({
      shipmentId,
      step: 'CREATE_PENDING',
      status: 'OK',
      correlationId,
    });

    try {
      const parcelValidation = await this.parcels.validate(dto.parcel, correlationId);
      await this.repository.logStep({
        shipmentId,
        step: 'PARCEL_VALIDATE',
        status: parcelValidation.valid ? 'OK' : 'REJECTED',
        detail: parcelValidation,
        correlationId,
      });

      if (!parcelValidation.valid) {
        const failed = await this.repository.fail(
          shipmentId,
          'FAILED_VALIDATION',
          parcelValidation.restrictions.join('; ') || 'Paquete no valido',
        );
        throw new UnprocessableEntityException(this.toResponse(failed));
      }

      const parcelReservation = await this.parcels.reserve({
        shipmentId,
        parcel: dto.parcel,
        handlingCategory: parcelValidation.handlingCategory,
        correlationId,
      });
      parcelReservationId = parcelReservation.reservationId;
      await this.repository.logStep({
        shipmentId,
        step: 'PARCEL_RESERVE',
        status: 'OK',
        detail: parcelReservation,
        correlationId,
      });

      const routeQuote = await this.routes.quote({
        originAddress: dto.originAddress,
        destinationAddress: dto.destinationAddress,
        serviceLevel: dto.serviceLevel,
        parcelCategory: parcelValidation.handlingCategory,
        correlationId,
      });
      await this.repository.logStep({
        shipmentId,
        step: 'ROUTE_QUOTE',
        status: routeQuote.covered && routeQuote.capacityAvailable ? 'OK' : 'REJECTED',
        detail: routeQuote,
        correlationId,
      });

      if (!routeQuote.covered || !routeQuote.capacityAvailable) {
        await this.compensateParcel(parcelReservationId, correlationId, shipmentId);
        const failed = await this.repository.fail(
          shipmentId,
          'FAILED_COMPENSATED',
          'Ruta sin cobertura o sin capacidad disponible',
        );
        throw new UnprocessableEntityException(this.toResponse(failed));
      }

      const routeReservation = await this.routes.reserve({
        shipmentId,
        candidateRouteId: routeQuote.candidateRouteId,
        serviceLevel: dto.serviceLevel,
        correlationId,
      });
      routeReservationId = routeReservation.reservationId;
      await this.repository.logStep({
        shipmentId,
        step: 'ROUTE_RESERVE',
        status: 'OK',
        detail: routeReservation,
        correlationId,
      });

      const trackingCode = this.createTrackingCode();
      const confirmed = await this.repository.confirm(
        shipmentId,
        trackingCode,
        parcelReservationId,
        routeReservationId,
      );
      await this.repository.logStep({
        shipmentId,
        step: 'CONFIRM_SHIPMENT',
        status: 'OK',
        correlationId,
      });

      try {
        await this.events.publishShipmentCreated({
          event: 'shipment.created',
          shipmentId,
          trackingCode,
          routeReservationId,
          parcelReservationId,
          correlationId,
          occurredAt: new Date().toISOString(),
        });
        await this.repository.logStep({
          shipmentId,
          step: 'PUBLISH_EVENT',
          status: 'OK',
          correlationId,
        });
      } catch (error) {
        await this.repository.logStep({
          shipmentId,
          step: 'PUBLISH_EVENT',
          status: 'FAILED',
          detail: { message: error instanceof Error ? error.message : error },
          correlationId,
        });
      }

      return this.toResponse(confirmed);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (routeReservationId) {
        await this.compensateRoute(routeReservationId, correlationId, shipmentId);
      }
      if (parcelReservationId) {
        await this.compensateParcel(parcelReservationId, correlationId, shipmentId);
      }

      const failed = await this.repository.fail(
        shipment.id,
        'FAILED_COMPENSATED',
        error instanceof Error ? error.message : 'Falla inesperada de Saga',
      );

      throw new InternalServerErrorException(this.toResponse(failed));
    }
  }

  async findOne(id: string) {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new NotFoundException('Envio no encontrado');
    }
    return this.toResponse(shipment);
  }

  async cancel(id: string, dto: CancelShipmentDto) {
    const shipment = await this.repository.cancel(id, `${dto.reason} | requestedBy=${dto.requestedBy}`);
    if (!shipment) {
      throw new NotFoundException('Envio no encontrado');
    }
    return this.toResponse(shipment);
  }

  private async compensateParcel(reservationId: string, correlationId: string, shipmentId: string) {
    await this.parcels.release(reservationId, correlationId).catch(async (error) => {
      await this.repository.logStep({
        shipmentId,
        step: 'COMPENSATE_PARCEL',
        status: 'FAILED',
        detail: { reservationId, message: error instanceof Error ? error.message : error },
        correlationId,
      });
    });
  }

  private async compensateRoute(reservationId: string, correlationId: string, shipmentId: string) {
    await this.routes.release(reservationId, correlationId).catch(async (error) => {
      await this.repository.logStep({
        shipmentId,
        step: 'COMPENSATE_ROUTE',
        status: 'FAILED',
        detail: { reservationId, message: error instanceof Error ? error.message : error },
        correlationId,
      });
    });
  }

  private createTrackingCode() {
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    return `PKG-${new Date().getFullYear()}-${suffix}`;
  }

  private toResponse(record: ShipmentRecord): ShipmentResponseDto {
    return {
      id: record.id,
      status: record.status,
      trackingCode: record.tracking_code,
      routeReservationId: record.route_reservation_id,
      parcelReservationId: record.parcel_reservation_id,
      correlationId: record.correlation_id,
      failureReason: record.failure_reason,
    };
  }
}
