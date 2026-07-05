import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DemoTokenDto } from './dto/demo-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  @Post('demo-token')
  @ApiOkResponse({ description: 'Genera un token JWT de demostracion para probar Swagger.' })
  createDemoToken(@Body() dto: DemoTokenDto) {
    const token = this.jwt.sign({
      sub: dto.userId,
      role: dto.role ?? 'operator',
      name: dto.name ?? 'Demo User',
    });

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: '2h',
    };
  }
}
