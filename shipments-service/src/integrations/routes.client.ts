import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddressDto } from '../shipments/dto/address.dto';
import { deleteJson, postJson } from './http-client';

export interface RouteQuoteResult {
  covered: boolean;
  estimatedDays: number;
  price: number;
  candidateRouteId: string;
  capacityAvailable: boolean;
}

export interface RouteReservation {
  reservationId: string;
  routeId: string;
  courierZone: string;
  expiresAt: string;
  status: 'RESERVED';
}

@Injectable()
export class RoutesClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('ROUTES_SERVICE_URL', 'http://localhost:3003');
    this.timeoutMs = Number(this.config.get<string>('HTTP_TIMEOUT_MS', '5000'));
  }

  quote(input: {
    originAddress: AddressDto;
    destinationAddress: AddressDto;
    serviceLevel: string;
    parcelCategory: string;
    correlationId: string;
  }) {
    return postJson<RouteQuoteResult>(
      `${this.baseUrl}/routes/quote`,
      {
        originPostalCode: input.originAddress.postalCode,
        destinationPostalCode: input.destinationAddress.postalCode,
        serviceLevel: input.serviceLevel,
        parcelCategory: input.parcelCategory,
      },
      this.timeoutMs,
      input.correlationId,
    );
  }

  reserve(input: {
    shipmentId: string;
    candidateRouteId: string;
    serviceLevel: string;
    correlationId: string;
  }) {
    return postJson<RouteReservation>(
      `${this.baseUrl}/routes/reservations`,
      input,
      this.timeoutMs,
      input.correlationId,
    );
  }

  release(reservationId: string, correlationId: string) {
    return deleteJson<{ released: boolean; reservationId: string }>(
      `${this.baseUrl}/routes/reservations/${reservationId}`,
      this.timeoutMs,
      correlationId,
    );
  }
}
