import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { GenerateQuoteDto } from './dto/generate-quote.dto';
import { ListQuotesDto } from './dto/list-quotes.dto';
import { QuotesService } from './quotes.service';

@Controller('api/v1/quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  listQuotes(@Query() query: ListQuotesDto) {
    return this.quotesService.listQuotes(query);
  }

  @Post('generate')
  generateQuote(@Body() dto: GenerateQuoteDto) {
    return this.quotesService.generateQuote(dto);
  }
}
