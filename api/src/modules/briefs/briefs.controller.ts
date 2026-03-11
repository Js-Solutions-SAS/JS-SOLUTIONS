import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../../auth/public.decorator';
import { PublicRateLimitGuard } from '../../auth/public-rate-limit.guard';
import {
  getCorrelationId,
  getIdempotencyKey,
} from '../shared/context/request-context';
import { BriefsService } from './briefs.service';
import { SubmitBriefDto } from './dto/submit-brief.dto';

@Controller('api/v1/public/briefs')
export class BriefsController {
  constructor(private readonly briefsService: BriefsService) {}

  @Public()
  @UseGuards(PublicRateLimitGuard)
  @Post(':briefToken/submissions')
  submitBrief(
    @Param('briefToken') briefToken: string,
    @Body() dto: SubmitBriefDto,
    @Req() req: Request,
  ) {
    const correlationId = getCorrelationId(req, 'public-brief-submit');
    const idempotencyKey = getIdempotencyKey(
      req,
      'public-brief-submit',
      `${briefToken}:${JSON.stringify(dto.answers || {}).slice(0, 120)}`,
    );

    return this.briefsService.submitBrief(
      briefToken,
      dto,
      correlationId,
      idempotencyKey,
    );
  }
}
