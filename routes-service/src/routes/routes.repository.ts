import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReserveRouteDto } from './dto/reserve-route.dto';

export interface RouteRecord {
  id: string;
  origin_prefix: string;
  destination_prefix: string;
  courier_zone: string;
  standard_days: number;
  express_days: number;
  base_price: string;
  daily_capacity: number;
}

export interface RouteReservationRecord {
  id: string;
  shipment_id: string;
  route_id: string;
  service_level: string;
  courier_zone: string;
  status: string;
  correlation_id: string;
  expires_at: Date;
}

@Injectable()
export class RouteRepository {
  constructor(private readonly db: DatabaseService) {}

  async findCandidate(originPostalCode: string, destinationPostalCode: string) {
    const result = await this.db.query<RouteRecord>(
      `
        SELECT *
        FROM routes
        WHERE active = TRUE
          AND $1 LIKE origin_prefix || '%'
          AND $2 LIKE destination_prefix || '%'
        ORDER BY base_price ASC
        LIMIT 1
      `,
      [originPostalCode, destinationPostalCode],
    );

    return result.rows[0] ?? null;
  }

  async countActiveReservations(routeId: string) {
    const result = await this.db.query<{ count: string }>(
      `
        SELECT COUNT(*)::TEXT AS count
        FROM route_reservations
        WHERE route_id = $1
          AND status = 'RESERVED'
          AND expires_at > NOW()
      `,
      [routeId],
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async findRouteById(routeId: string) {
    const result = await this.db.query<RouteRecord>('SELECT * FROM routes WHERE id = $1', [routeId]);
    return result.rows[0] ?? null;
  }

  async createReservation(id: string, route: RouteRecord, expiresAt: Date, dto: ReserveRouteDto) {
    const result = await this.db.query<RouteReservationRecord>(
      `
        INSERT INTO route_reservations (
          id, shipment_id, route_id, service_level, courier_zone, status, correlation_id, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, 'RESERVED', $6, $7)
        RETURNING *
      `,
      [
        id,
        dto.shipmentId,
        route.id,
        dto.serviceLevel,
        route.courier_zone,
        dto.correlationId,
        expiresAt,
      ],
    );

    return result.rows[0];
  }

  async releaseReservation(id: string) {
    const result = await this.db.query<RouteReservationRecord>(
      `
        UPDATE route_reservations
        SET status = 'RELEASED', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async createDispatchAssignment(input: {
    id: string;
    shipmentId: string;
    trackingCode: string;
    routeReservationId: string;
    parcelReservationId: string;
    correlationId: string;
  }) {
    await this.db.query(
      `
        INSERT INTO dispatch_assignments (
          id, shipment_id, tracking_code, route_reservation_id,
          parcel_reservation_id, status, correlation_id
        )
        VALUES ($1, $2, $3, $4, $5, 'ASSIGNED', $6)
        ON CONFLICT (shipment_id) DO NOTHING
      `,
      [
        input.id,
        input.shipmentId,
        input.trackingCode,
        input.routeReservationId,
        input.parcelReservationId,
        input.correlationId,
      ],
    );
  }

  async logFailedEvent(input: {
    eventName: string;
    payload: unknown;
    reason: string;
    correlationId?: string;
  }) {
    await this.db.query(
      `
        INSERT INTO failed_events (event_name, payload, reason, correlation_id)
        VALUES ($1, $2, $3, $4)
      `,
      [
        input.eventName,
        JSON.stringify(input.payload),
        input.reason,
        input.correlationId ?? null,
      ],
    );
  }
}
