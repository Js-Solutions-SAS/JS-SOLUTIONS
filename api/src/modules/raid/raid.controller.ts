import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

import { getCorrelationId } from '../shared/context/request-context';
import { RaidService } from './raid.service';

@Controller('api/v1/admin/raid')
export class RaidController {
  constructor(private readonly raidService: RaidService) {}

  @Get()
  list(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-raid');
    return this.raidService.list(correlationId);
  }
}
