import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';

import {
  getCorrelationId,
  getIdempotencyKey,
} from '../shared/context/request-context';
import { ChangeRequestsService } from './change-requests.service';
import { AdminChangeRequestDecisionDto } from './dto/admin-change-request-decision.dto';

@Controller('api/v1/admin/change-requests')
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Get()
  list(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-change-requests');
    return this.changeRequestsService.list(correlationId);
  }

  @Patch(':id/decision')
  decide(
    @Param('id') id: string,
    @Body() dto: AdminChangeRequestDecisionDto,
    @Req() req: Request,
  ) {
    const correlationId = getCorrelationId(req, 'admin-change-request-decision');
    const idempotencyKey = getIdempotencyKey(
      req,
      'admin-change-request-decision',
      `${id}:${dto.decision}`,
    );

    return this.changeRequestsService.decide(
      id,
      dto,
      correlationId,
      idempotencyKey,
    );
  }
}
