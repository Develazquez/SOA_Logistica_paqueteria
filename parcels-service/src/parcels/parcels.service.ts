import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CompensationResultDto } from './dto/compensation-result.dto';
import { ParcelReservationDto } from './dto/parcel-reservation.dto';
import { ParcelValidationResultDto } from './dto/parcel-validation-result.dto';
import { ReserveParcelDto } from './dto/reserve-parcel.dto';
import { ValidateParcelDto } from './dto/validate-parcel.dto';
import { ParcelRepository, ParcelReservationRecord } from './parcels.repository';

@Injectable()
export class ParcelsService {
  private readonly restrictedContent = new Set(['hazmat', 'weapons', 'cash', 'animals']);

  constructor(private readonly repository: ParcelRepository) {}

  validate(dto: ValidateParcelDto): ParcelValidationResultDto {
    const restrictions: string[] = [];
    const girth = dto.lengthCm + 2 * (dto.widthCm + dto.heightCm);

    if (dto.weightKg > 30) {
      restrictions.push('El peso supera el maximo permitido de 30 kg.');
    }
    if (Math.max(dto.lengthCm, dto.widthCm, dto.heightCm) > 120) {
      restrictions.push('Una dimension supera 120 cm.');
    }
    if (girth > 300) {
      restrictions.push('El contorno logistico supera 300 cm.');
    }
    if (this.restrictedContent.has(dto.contentType.toLowerCase())) {
      restrictions.push(`Contenido restringido: ${dto.contentType}.`);
    }

    return {
      valid: restrictions.length === 0,
      normalizedWeightKg: Number(dto.weightKg.toFixed(2)),
      handlingCategory: this.getHandlingCategory(dto),
      restrictions,
    };
  }

  async reserve(dto: ReserveParcelDto): Promise<ParcelReservationDto> {
    const reservationId = randomUUID();
    const labelCode = `LBL-${Date.now()}-${reservationId.slice(0, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const reservation = await this.repository.createReservation(
      reservationId,
      labelCode,
      expiresAt,
      dto,
    );

    return this.toReservationDto(reservation);
  }

  async release(id: string): Promise<CompensationResultDto> {
    const reservation = await this.repository.releaseReservation(id);
    if (!reservation) {
      throw new NotFoundException('Reserva de paquete no encontrada');
    }

    return {
      released: true,
      reservationId: reservation.id,
      status: reservation.status,
    };
  }

  private getHandlingCategory(dto: ValidateParcelDto) {
    if (dto.fragile && dto.weightKg >= 10) {
      return 'FRAGILE_HEAVY';
    }
    if (dto.fragile) {
      return 'FRAGILE_MEDIUM';
    }
    if (dto.weightKg >= 15) {
      return 'HEAVY';
    }
    return 'STANDARD';
  }

  private toReservationDto(record: ParcelReservationRecord): ParcelReservationDto {
    return {
      reservationId: record.id,
      labelCode: record.label_code,
      expiresAt: record.expires_at.toISOString(),
      status: record.status,
    };
  }
}
