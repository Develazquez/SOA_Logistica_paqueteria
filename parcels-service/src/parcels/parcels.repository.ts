import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReserveParcelDto } from './dto/reserve-parcel.dto';

export interface ParcelReservationRecord {
  id: string;
  shipment_id: string;
  label_code: string;
  handling_category: string;
  status: string;
  correlation_id: string;
  expires_at: Date;
}

@Injectable()
export class ParcelRepository {
  constructor(private readonly db: DatabaseService) {}

  async createReservation(id: string, labelCode: string, expiresAt: Date, dto: ReserveParcelDto) {
    const result = await this.db.query<ParcelReservationRecord>(
      `
        INSERT INTO parcel_reservations (
          id, shipment_id, label_code, parcel, handling_category, status, correlation_id, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, 'RESERVED', $6, $7)
        RETURNING *
      `,
      [
        id,
        dto.shipmentId,
        labelCode,
        dto.parcel,
        dto.handlingCategory,
        dto.correlationId,
        expiresAt,
      ],
    );

    return result.rows[0];
  }

  async releaseReservation(id: string) {
    const result = await this.db.query<ParcelReservationRecord>(
      `
        UPDATE parcel_reservations
        SET status = 'RELEASED', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );
    return result.rows[0] ?? null;
  }
}
