import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import {
  getCorrelationId,
  getIdempotencyKey,
} from '../shared/context/request-context';
import { ChannelsWhatsappService } from './channels-whatsapp.service';
import { WhatsappInboundEventDto } from './dto/whatsapp-inbound-event.dto';

@Controller('api/v1/internal/channels/whatsapp')
export class ChannelsWhatsappController {
  constructor(
    private readonly channelsWhatsappService: ChannelsWhatsappService,
  ) {}

  @Post('inbound-events')
  inboundEvents(@Body() dto: WhatsappInboundEventDto, @Req() req: Request) {
    const correlationId = getCorrelationId(req, 'whatsapp-inbound');
    const idempotencyKey = getIdempotencyKey(
      req,
      'whatsapp-inbound',
      `${dto.provider}:${dto.externalChatId}:${dto.externalMessageId || 'message'}`,
    );

    return this.channelsWhatsappService.ingestInboundEvent(
      dto,
      correlationId,
      idempotencyKey,
    );
  }
}
