import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkflowEventEntity } from './workflow-event.entity';
import { WorkflowEventsController } from './workflow-events.controller';
import { WorkflowEventsService } from './workflow-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowEventEntity])],
  controllers: [WorkflowEventsController],
  providers: [WorkflowEventsService],
  exports: [WorkflowEventsService],
})
export class WorkflowEventsModule {}
