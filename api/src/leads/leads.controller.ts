import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../auth/public.decorator';
import { PublicRateLimitGuard } from '../auth/public-rate-limit.guard';
import { extractPublicRequestContext } from '../common/public-request-context';
import { CreateLeadIntakeDto } from './dto/create-lead-intake.dto';
import { PublicMarketingEventDto } from './dto/public-marketing-event.dto';
import { PublicLeadIntakeDto } from './dto/public-lead-intake.dto';
import { RequestBriefDto } from './dto/request-brief.dto';
import { LeadsService } from './leads.service';

@Controller('api/v1')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads/intake')
  createIntake(@Body() dto: CreateLeadIntakeDto) {
    return this.leadsService.createIntake(dto);
  }

  @Public()
  @UseGuards(PublicRateLimitGuard)
  @Post('public/leads/intake')
  createPublicIntake(@Body() dto: PublicLeadIntakeDto, @Req() req: Request) {
    return this.leadsService.createPublicIntake(
      dto,
      extractPublicRequestContext(req),
    );
  }

  @Public()
  @UseGuards(PublicRateLimitGuard)
  @Post('public/marketing/events')
  capturePublicMarketingEvent(
    @Body() dto: PublicMarketingEventDto,
    @Req() req: Request,
  ) {
    return this.leadsService.capturePublicMarketingEvent(
      dto,
      extractPublicRequestContext(req),
    );
  }

  @Post('brief/request')
  requestBrief(@Body() dto: RequestBriefDto) {
    return this.leadsService.requestBrief(dto);
  }

  @Get('leads/:leadId')
  findByLeadId(@Param('leadId') leadId: string) {
    return this.leadsService.findByLeadId(leadId);
  }
}
