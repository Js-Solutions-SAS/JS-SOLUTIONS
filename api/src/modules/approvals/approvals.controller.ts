import { Body, Controller, Get, Patch, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../../auth/public.decorator';
import {
  getCorrelationId,
  getIdempotencyKey,
} from '../shared/context/request-context';
import { ApprovalsService } from './approvals.service';
import { AdminApprovalDecisionDto } from './dto/admin-approval-decision.dto';
import { ClientApprovalDto } from './dto/client-approval.dto';

@Controller()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Public()
  @Post('api/v1/client/approvals')
  createClientApproval(@Body() dto: ClientApprovalDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'client-approval');
    const idempotencyKey = getIdempotencyKey(
      req,
      'client-approval',
      `${dto.resourceType}:${dto.resourceId}:${dto.clientToken || 'anonymous'}`,
    );

    return this.approvalsService.createClientDecision(
      dto,
      correlationId,
      idempotencyKey,
    );
  }

  @Get('api/v1/admin/approvals')
  listAdminApprovals(@Req() req: Request) {
    const correlationId = getCorrelationId(req, 'admin-approvals');
    return this.approvalsService.listAdminApprovals(correlationId);
  }

  @Patch('api/v1/admin/approvals/:approvalId/decision')
  decideApproval(
    @Param('approvalId') approvalId: string,
    @Body() dto: AdminApprovalDecisionDto,
    @Req() req: Request,
  ) {
    const correlationId = getCorrelationId(req, 'admin-approval-decision');
    const idempotencyKey = getIdempotencyKey(
      req,
      'admin-approval-decision',
      `${approvalId}:${dto.decision}`,
    );

    return this.approvalsService.decideByAdmin(
      approvalId,
      dto,
      correlationId,
      idempotencyKey,
    );
  }
}
