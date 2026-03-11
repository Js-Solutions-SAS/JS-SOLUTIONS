import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditEventEntity } from './audit-event.entity';

interface AuditInput {
  actorType: AuditEventEntity['actorType'];
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  correlationId: string;
  idempotencyKey?: string;
  payloadJson?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly auditRepository: Repository<AuditEventEntity>,
  ) {}

  async log(input: AuditInput): Promise<void> {
    await this.auditRepository.save(
      this.auditRepository.create({
        actorType: input.actorType,
        actorId: input.actorId || null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId || null,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey || null,
        payloadJson: input.payloadJson || null,
      }),
    );
  }
}
