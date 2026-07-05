import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CompensationResultDto } from './dto/compensation-result.dto';
import { ReserveRouteDto } from './dto/reserve-route.dto';
import { RouteQuoteDto } from './dto/route-quote.dto';
import { RouteQuoteResultDto } from './dto/route-quote-result.dto';
import { RouteReservationDto } from './dto/route-reservation.dto';
import { RoutesService } from './routes.service';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Post('quote')
  @ApiOkResponse({ type: RouteQuoteResultDto })
  quote(@Body() dto: RouteQuoteDto) {
    return this.routes.quote(dto);
  }

  @Post('reservations')
  @ApiCreatedResponse({ type: RouteReservationDto })
  reserve(@Body() dto: ReserveRouteDto) {
    return this.routes.reserve(dto);
  }

  @Delete('reservations/:id')
  @ApiOkResponse({ type: CompensationResultDto })
  release(@Param('id') id: string) {
    return this.routes.release(id);
  }
}
