import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateWorkflowEventDto } from './dto/create-workflow-event.dto';
import { WorkflowEventEntity } from './workflow-event.entity';

@Injectable()
export class WorkflowEventsService {
  constructor(
    @InjectRepository(WorkflowEventEntity)
    private readonly workflowEventsRepository: Repository<WorkflowEventEntity>,
  ) {}

  async create(dto: CreateWorkflowEventDto) {
    const entity = this.workflowEventsRepository.create({
      workflowName: dto.workflowName,
      eventName: dto.eventName,
      status: dto.status,
      leadId: dto.leadId || null,
      idempotencyKey: dto.idempotencyKey || null,
      correlationId: dto.correlationId || null,
      payloadJson: dto.payloadJson || null,
      errorMessage: dto.errorMessage || null,
    });

    const saved = await this.workflowEventsRepository.save(entity);

    return {
      success: true,
      id: saved.id,
      createdAt: saved.createdAt,
    };
  }

  async list(limit = 50) {
    return this.workflowEventsRepository.find({
      take: Math.min(Math.max(limit, 1), 200),
      order: { createdAt: 'DESC' },
    });
  }
}
