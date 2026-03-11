import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  readiness() {
    return {
      success: true,
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('db')
  async db(@Headers('authorization') authorization?: string) {
    const protectedDbHealth =
      String(
        this.configService.get('HEALTH_DB_PROTECTED', 'false'),
      ).toLowerCase() === 'true';

    if (protectedDbHealth) {
      const expectedToken =
        this.configService.get<string>('API_INTERNAL_TOKEN');
      const token = (authorization || '').replace(/^Bearer\s+/i, '').trim();
      if (!expectedToken || token !== expectedToken) {
        throw new UnauthorizedException('Unauthorized health db check.');
      }
    }

    await this.dataSource.query('SELECT 1');
    return {
      success: true,
      database: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
