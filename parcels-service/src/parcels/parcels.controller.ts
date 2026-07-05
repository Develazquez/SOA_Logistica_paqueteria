import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CompensationResultDto } from './dto/compensation-result.dto';
import { ParcelReservationDto } from './dto/parcel-reservation.dto';
import { ParcelValidationResultDto } from './dto/parcel-validation-result.dto';
import { ReserveParcelDto } from './dto/reserve-parcel.dto';
import { ValidateParcelDto } from './dto/validate-parcel.dto';
import { ParcelsService } from './parcels.service';

@ApiTags('parcels')
@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcels: ParcelsService) {}

  @Post('validate')
  @ApiOkResponse({ type: ParcelValidationResultDto })
  validate(@Body() dto: ValidateParcelDto) {
    return this.parcels.validate(dto);
  }

  @Post('reservations')
  @ApiCreatedResponse({ type: ParcelReservationDto })
  reserve(@Body() dto: ReserveParcelDto) {
    return this.parcels.reserve(dto);
  }

  @Delete('reservations/:id')
  @ApiOkResponse({ type: CompensationResultDto })
  release(@Param('id') id: string) {
    return this.parcels.release(id);
  }
}
