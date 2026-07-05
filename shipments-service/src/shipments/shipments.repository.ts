import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';

export interface ShipmentRecord {
  id: string;
  customer_id: string;
  origin_address: Record<string, unknown>;
  destination_address: Record<string, unknown>;
  parcel: Record<string, unknown>;
  service_level: string;
  declared_value: string;
  status: string;
  tracking_code?: string;
  parcel_reservation_id?: string;
  route_reservation_id?: string;
  correlation_id: string;
  idempotency_key: string;
  failure_reason?: string;
}

@Injectable()
export class ShipmentRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    const result = await this.db.query<ShipmentRecord>('SELECT * FROM shipments WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const result = await this.db.query<ShipmentRecord>(
      'SELECT * FROM shipments WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async createPending(id: string, correlationId: string, dto: CreateShipmentDto) {
    const result = await this.db.query<ShipmentRecord>(
      `
        INSERT INTO shipments (
          id, customer_id, origin_address, destination_address, parcel, service_level,
          declared_value, status, correlation_id, idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9)
        RETURNING *
      `,
      [
        id,
        dto.customerId,
        dto.originAddress,
        dto.destinationAddress,
        dto.parcel,
        dto.serviceLevel,
        dto.declaredValue,
        correlationId,
        dto.idempotencyKey,
      ],
    );
    return result.rows[0];
  }

  async confirm(id: string, trackingCode: string, parcelReservationId: string, routeReservationId: string) {
    const result = await this.db.query<ShipmentRecord>(
      `
        UPDATE shipments
        SET status = 'CONFIRMED',
            tracking_code = $2,
            parcel_reservation_id = $3,
            route_reservation_id = $4,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id, trackingCode, parcelReservationId, routeReservationId],
    );
    return result.rows[0];
  }

  async fail(id: string, status: string, failureReason: string) {
    const result = await this.db.query<ShipmentRecord>(
      `
        UPDATE shipments
        SET status = $2,
            failure_reason = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id, status, failureReason],
    );
    return result.rows[0];
  }

  async cancel(id: string, reason: string) {
    const result = await this.db.query<ShipmentRecord>(
      `
        UPDATE shipments
        SET status = 'CANCELLED',
            failure_reason = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id, reason],
    );
    return result.rows[0] ?? null;
  }

  async logStep(input: {
    shipmentId?: string;
    step: string;
    status: string;
    detail?: unknown;
    correlationId: string;
  }) {
    await this.db.query(
      `
        INSERT INTO shipment_saga_logs (shipment_id, step, status, detail, correlation_id)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        input.shipmentId ?? null,
        input.step,
        input.status,
        input.detail ? JSON.stringify(input.detail) : null,
        input.correlationId,
      ],
    );
  }
}
