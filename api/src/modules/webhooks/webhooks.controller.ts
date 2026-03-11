import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { getCorrelationId } from '../shared/context/request-context';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { SignatureCallbackDto } from './dto/signature-callback.dto';
import { WebhooksService } from './webhooks.service';

@Controller('api/v1/internal/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payments')
  paymentsCallback(@Body() dto: PaymentCallbackDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'payments-callback');
    return this.webhooksService.handlePaymentsCallback(dto, correlationId);
  }

  @Post('signatures')
  signaturesCallback(@Body() dto: SignatureCallbackDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'signatures-callback');
    return this.webhooksService.handleSignaturesCallback(dto, correlationId);
  }
}
