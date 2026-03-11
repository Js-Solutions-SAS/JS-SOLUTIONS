import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from '../shared/audit/audit.service';
import { okResponse } from '../shared/contracts/api-response';
import { IdempotencyService } from '../shared/idempotency/idempotency.service';
import { ChangeRequestEntity } from './change-request.entity';
import { AdminChangeRequestDecisionDto } from './dto/admin-change-request-decision.dto';

@Injectable()
export class ChangeRequestsService {
  constructor(
    @InjectRepository(ChangeRequestEntity)
    private readonly changeRequestsRepository: Repository<ChangeRequestEntity>,
    private readonly idempotencyService: IdempotencyService,
    private readonly auditService: AuditService,
  ) {}

  async list(correlationId: string) {
    const items = await this.changeRequestsRepository.find({
      order: { updatedAt: 'DESC' },
      take: 300,
    });

    return okResponse(
      items.map((item) => ({
        id: item.id,
        projectId: item.projectId || 'unknown-project',
        projectName: item.projectName || 'Project',
        clientName: item.clientName || 'Client',
        industry: item.industry || 'Technology',
        owner: item.owner || 'Operations',
        type: item.requestType,
        status: item.status,
        title: item.title,
        description: item.description || '',
        requestedAt:
          item.requestedAt?.toISOString() || item.createdAt.toISOString(),
        baselineCost: Number(item.baselineCost || 0),
        proposedCost: Number(item.proposedCost || 0),
        baselineDueDate:
          item.baselineDueDate || new Date().toISOString().slice(0, 10),
        proposedDueDate:
          item.proposedDueDate || new Date().toISOString().slice(0, 10),
        justification: item.decisionReason || undefined,
        version: item.version,
      })),
      correlationId,
    );
  }

  async decide(
    id: string,
    dto: AdminChangeRequestDecisionDto,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const claimed = await this.idempotencyService.claim({
      scope: 'admin-change-request-decision',
      idempotencyKey,
      correlationId,
    });

    if (claimed.alreadyClaimed && claimed.record.responseJson) {
      return okResponse(claimed.record.responseJson, correlationId);
    }

    const changeRequest = await this.changeRequestsRepository.findOne({
      where: { id },
    });

    if (!changeRequest) {
      throw new NotFoundException('Change request not found.');
    }

    if (
      typeof dto.expectedVersion === 'number' &&
      dto.expectedVersion !== changeRequest.version
    ) {
      throw new ConflictException('Change request version mismatch.');
    }

    const nextStatus = dto.decision === 'approve' ? 'Approved' : 'Rejected';
    const newVersion = changeRequest.version + 1;

    const result = await this.changeRequestsRepository.update(
      {
        id,
        version: changeRequest.version,
      },
      {
        status: nextStatus,
        decisionReason: dto.reason || null,
        version: newVersion,
      },
    );

    if (!result.affected) {
      throw new ConflictException('Change request was updated concurrently.');
    }

    await this.auditService.log({
      actorType: 'admin',
      action: 'change_request.decision',
      resourceType: 'change_request',
      resourceId: id,
      correlationId,
      idempotencyKey,
      payloadJson: {
        decision: dto.decision,
      },
    });

    const responsePayload = {
      id,
      status: nextStatus,
      version: newVersion,
    };

    await this.idempotencyService.complete(claimed.record.id, responsePayload);

    return okResponse(responsePayload, correlationId, newVersion);
  }
}
