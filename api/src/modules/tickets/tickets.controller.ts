import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

import { getCorrelationId } from '../shared/context/request-context';
import { TicketsService } from './tickets.service';

@Controller('api/v1/admin/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-tickets');
    return this.ticketsService.list(correlationId);
  }
}
