import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CompensationResultDto } from './dto/compensation-result.dto';
import { ReserveRouteDto } from './dto/reserve-route.dto';
import { RouteQuoteDto } from './dto/route-quote.dto';
import { RouteQuoteResultDto } from './dto/route-quote-result.dto';
import { RouteReservationDto } from './dto/route-reservation.dto';
import { RouteRecord, RouteRepository, RouteReservationRecord } from './routes.repository';

@Injectable()
export class RoutesService {
  constructor(private readonly repository: RouteRepository) {}

  async quote(dto: RouteQuoteDto): Promise<RouteQuoteResultDto> {
    const route = await this.repository.findCandidate(dto.originPostalCode, dto.destinationPostalCode);
    if (!route) {
      return {
        covered: false,
        estimatedDays: 0,
        price: 0,
        capacityAvailable: false,
      };
    }

    const activeReservations = await this.repository.countActiveReservations(route.id);
    const capacityAvailable = activeReservations < route.daily_capacity;

    return {
      covered: true,
      estimatedDays: dto.serviceLevel === 'express' ? route.express_days : route.standard_days,
      price: this.calculatePrice(route, dto.parcelCategory, dto.serviceLevel),
      candidateRouteId: route.id,
      capacityAvailable,
    };
  }

  async reserve(dto: ReserveRouteDto): Promise<RouteReservationDto> {
    const route = await this.repository.findRouteById(dto.candidateRouteId);
    if (!route) {
      throw new NotFoundException('Ruta candidata no encontrada');
    }

    const activeReservations = await this.repository.countActiveReservations(route.id);
    if (activeReservations >= route.daily_capacity) {
      throw new UnprocessableEntityException('Ruta sin capacidad disponible');
    }

    const reservation = await this.repository.createReservation(
      randomUUID(),
      route,
      new Date(Date.now() + 30 * 60 * 1000),
      dto,
    );

    return this.toReservationDto(reservation);
  }

  async release(id: string): Promise<CompensationResultDto> {
    const reservation = await this.repository.releaseReservation(id);
    if (!reservation) {
      throw new NotFoundException('Reserva de ruta no encontrada');
    }

    return {
      released: true,
      reservationId: reservation.id,
      status: reservation.status,
    };
  }

  private calculatePrice(route: RouteRecord, parcelCategory: string, serviceLevel: string) {
    const base = Number(route.base_price);
    const fragileFee = parcelCategory.includes('FRAGILE') ? 35 : 0;
    const heavyFee = parcelCategory.includes('HEAVY') ? 50 : 0;
    const expressFee = serviceLevel === 'express' ? 90 : 0;
    return base + fragileFee + heavyFee + expressFee;
  }

  private toReservationDto(record: RouteReservationRecord): RouteReservationDto {
    return {
      reservationId: record.id,
      routeId: record.route_id,
      courierZone: record.courier_zone,
      expiresAt: record.expires_at.toISOString(),
      status: record.status,
    };
  }
}
