import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../../auth/public.decorator';
import {
  getCorrelationId,
  getIdempotencyKey,
} from '../shared/context/request-context';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('api/v1/client/payments/intents')
  createIntent(@Body() dto: CreatePaymentIntentDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'client-payment-intent');
    const idempotencyKey = getIdempotencyKey(
      req,
      'client-payment-intent',
      `${dto.projectId || 'project'}:${dto.clientToken || 'token'}:${dto.amount || 0}`,
    );

    return this.paymentsService.createIntent(dto, correlationId, idempotencyKey);
  }
}
