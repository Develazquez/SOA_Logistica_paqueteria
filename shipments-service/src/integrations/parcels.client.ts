import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParcelInputDto } from '../shipments/dto/parcel-input.dto';
import { deleteJson, postJson } from './http-client';

export interface ParcelValidationResult {
  valid: boolean;
  normalizedWeightKg: number;
  handlingCategory: string;
  restrictions: string[];
}

export interface ParcelReservation {
  reservationId: string;
  labelCode: string;
  expiresAt: string;
  status: 'RESERVED';
}

@Injectable()
export class ParcelsClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('PARCELS_SERVICE_URL', 'http://localhost:3002');
    this.timeoutMs = Number(this.config.get<string>('HTTP_TIMEOUT_MS', '5000'));
  }

  validate(parcel: ParcelInputDto, correlationId: string) {
    return postJson<ParcelValidationResult>(
      `${this.baseUrl}/parcels/validate`,
      parcel,
      this.timeoutMs,
      correlationId,
    );
  }

  reserve(input: {
    shipmentId: string;
    parcel: ParcelInputDto;
    handlingCategory: string;
    correlationId: string;
  }) {
    return postJson<ParcelReservation>(
      `${this.baseUrl}/parcels/reservations`,
      input,
      this.timeoutMs,
      input.correlationId,
    );
  }

  release(reservationId: string, correlationId: string) {
    return deleteJson<{ released: boolean; reservationId: string }>(
      `${this.baseUrl}/parcels/reservations/${reservationId}`,
      this.timeoutMs,
      correlationId,
    );
  }
}
