import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

import { getCorrelationId } from '../shared/context/request-context';
import { FinanceService } from './finance.service';

@Controller('api/v1/admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  list(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-finance');
    return this.financeService.list(correlationId);
  }
}
