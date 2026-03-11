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
import { AdminApprovalDecisionDto } from './dto/admin-approval-decision.dto';
import { ClientApprovalDto } from './dto/client-approval.dto';
import { ApprovalEntity } from './approval.entity';

function mapDecisionToStatus(decision: string): ApprovalEntity['status'] {
  if (decision === 'approved') {
    return 'Approved';
  }

  if (decision === 'rejected') {
    return 'Rejected';
  }

  if (decision === 'blocked') {
    return 'Blocked';
  }

  return 'In Review';
}

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalsRepository: Repository<ApprovalEntity>,
    private readonly idempotencyService: IdempotencyService,
    private readonly auditService: AuditService,
  ) {}

  async listAdminApprovals(correlationId: string) {
    const items = await this.approvalsRepository.find({
      order: { updatedAt: 'DESC' },
      take: 300,
    });

    return okResponse(
      items.map((item) => ({
        id: item.id,
        projectId: item.projectId || 'unknown-project',
        projectName: 'Project',
        clientName: 'Client',
        industry: 'Technology',
        owner: item.requestedBy || 'Operations',
        stage: item.stage,
        status: item.status,
        requestedAt:
          item.requestedAt?.toISOString() || item.createdAt.toISOString(),
        dueDate: item.dueDate || undefined,
        approvedAt: item.decisionAt?.toISOString() || undefined,
        title: item.resourceName || `${item.resourceType}:${item.resourceId}`,
        notes: item.decisionReason || undefined,
        version: item.version,
      })),
      correlationId,
    );
  }

  async createClientDecision(
    dto: ClientApprovalDto,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const claimed = await this.idempotencyService.claim({
      scope: 'client-approval',
      idempotencyKey,
      correlationId,
    });

    if (claimed.alreadyClaimed && claimed.record.responseJson) {
      return okResponse(claimed.record.responseJson, correlationId);
    }

    let approval = await this.approvalsRepository.findOne({
      where: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
      },
      order: { updatedAt: 'DESC' },
    });

    if (!approval) {
      approval = this.approvalsRepository.create({
        projectId: dto.projectId || null,
        clientToken: dto.clientToken || null,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        resourceName: dto.resourceName || null,
        stage: dto.resourceType === 'contract' ? 'Contract' : 'Scope',
        requestedBy: 'client',
        requestedAt: new Date(),
        status: 'Pending',
      });
      approval = await this.approvalsRepository.save(approval);
    }

    if (
      typeof dto.expectedVersion === 'number' &&
      dto.expectedVersion !== approval.version
    ) {
      throw new ConflictException('Approval version mismatch.');
    }

    const newVersion = approval.version + 1;
    const result = await this.approvalsRepository.update(
      {
        id: approval.id,
        version: approval.version,
      },
      {
        status: mapDecisionToStatus(dto.decision),
        decisionBy: 'client',
        decisionAt: new Date(),
        decisionReason: dto.comment || null,
        version: newVersion,
      },
    );

    if (!result.affected) {
      throw new ConflictException('Approval was updated concurrently.');
    }

    await this.auditService.log({
      actorType: 'client',
      actorId: dto.clientToken || null || undefined,
      action: 'approval.client_decision',
      resourceType: 'approval',
      resourceId: approval.id,
      correlationId,
      idempotencyKey,
      payloadJson: {
        decision: dto.decision,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
      },
    });

    const responsePayload = {
      approvalId: approval.id,
      status: mapDecisionToStatus(dto.decision),
      version: newVersion,
    };

    await this.idempotencyService.complete(claimed.record.id, responsePayload);

    return okResponse(responsePayload, correlationId, newVersion);
  }

  async decideByAdmin(
    approvalId: string,
    dto: AdminApprovalDecisionDto,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const claimed = await this.idempotencyService.claim({
      scope: 'admin-approval-decision',
      idempotencyKey,
      correlationId,
    });

    if (claimed.alreadyClaimed && claimed.record.responseJson) {
      return okResponse(claimed.record.responseJson, correlationId);
    }

    const approval = await this.approvalsRepository.findOne({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found.');
    }

    if (
      typeof dto.expectedVersion === 'number' &&
      dto.expectedVersion !== approval.version
    ) {
      throw new ConflictException('Approval version mismatch.');
    }

    const newVersion = approval.version + 1;

    const result = await this.approvalsRepository.update(
      {
        id: approval.id,
        version: approval.version,
      },
      {
        status: mapDecisionToStatus(dto.decision),
        decisionBy: 'admin',
        decisionAt: new Date(),
        decisionReason: dto.reason || null,
        version: newVersion,
      },
    );

    if (!result.affected) {
      throw new ConflictException('Approval was updated concurrently.');
    }

    await this.auditService.log({
      actorType: 'admin',
      action: 'approval.admin_decision',
      resourceType: 'approval',
      resourceId: approval.id,
      correlationId,
      idempotencyKey,
      payloadJson: {
        decision: dto.decision,
      },
    });

    const responsePayload = {
      approvalId: approval.id,
      status: mapDecisionToStatus(dto.decision),
      version: newVersion,
    };

    await this.idempotencyService.complete(claimed.record.id, responsePayload);

    return okResponse(responsePayload, correlationId, newVersion);
  }
}
