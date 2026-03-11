import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateLeadIntakeDto } from './dto/create-lead-intake.dto';
import { RequestBriefDto } from './dto/request-brief.dto';
import { LeadsService } from './leads.service';

@Controller('api/v1')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads/intake')
  createIntake(@Body() dto: CreateLeadIntakeDto) {
    return this.leadsService.createIntake(dto);
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
