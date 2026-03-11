import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CreateWorkflowEventDto } from './dto/create-workflow-event.dto';
import { WorkflowEventsService } from './workflow-events.service';

@Controller('api/v1/workflow-events')
export class WorkflowEventsController {
  constructor(private readonly workflowEventsService: WorkflowEventsService) {}

  @Post()
  create(@Body() dto: CreateWorkflowEventDto) {
    return this.workflowEventsService.create(dto);
  }

  @Get()
  list(@Query('limit') limit?: string) {
    return this.workflowEventsService.list(Number(limit || '50'));
  }
}
