import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { Public } from '../auth/public.decorator';
import { PublicRateLimitGuard } from '../auth/public-rate-limit.guard';
import { PublicQuoteEstimateDto } from './dto/public-quote-estimate.dto';
import { QuotesService } from './quotes.service';

@Controller('api/v1/public/quotes')
export class PublicQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Public()
  @UseGuards(PublicRateLimitGuard)
  @Post('estimate')
  publicEstimate(@Body() dto: PublicQuoteEstimateDto) {
    return this.quotesService.publicEstimate(dto);
  }
}
