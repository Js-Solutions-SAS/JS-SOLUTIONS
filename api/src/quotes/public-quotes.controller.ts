import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../auth/public.decorator';
import { PublicRateLimitGuard } from '../auth/public-rate-limit.guard';
import { extractPublicRequestContext } from '../common/public-request-context';
import { PublicQuoteEstimateDto } from './dto/public-quote-estimate.dto';
import { QuotesService } from './quotes.service';

@Controller('api/v1/public/quotes')
export class PublicQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Public()
  @UseGuards(PublicRateLimitGuard)
  @Post('estimate')
  publicEstimate(@Body() dto: PublicQuoteEstimateDto, @Req() req: Request) {
    return this.quotesService.publicEstimate(dto, extractPublicRequestContext(req));
  }
}
