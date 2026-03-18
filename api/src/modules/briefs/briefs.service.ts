import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { BriefSubmissionEntity } from '../../leads/brief-submission.entity';
import { LeadEntity } from '../../leads/lead.entity';
import { LEAD_STATUS } from '../../leads/lead-status';
import { ProjectEntity } from '../projects/project.entity';
import { AuditService } from '../shared/audit/audit.service';
import { okResponse } from '../shared/contracts/api-response';
import { SubmitBriefDto } from './dto/submit-brief.dto';

@Injectable()
export class BriefsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(BriefSubmissionEntity)
    private readonly briefSubmissionsRepository: Repository<BriefSubmissionEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    private readonly auditService: AuditService,
  ) {}

  async getBriefContext(briefToken: string, correlationId: string) {
    const lead = await this.leadsRepository.findOne({
      where: { briefToken },
    });

    if (!lead) {
      throw new NotFoundException('Brief token not found.');
    }

    return okResponse(
      {
        briefToken,
        leadId: lead.leadId,
        companyName: lead.company,
        status: lead.status,
      },
      correlationId,
      lead.version,
    );
  }

  async submitBrief(
    briefToken: string,
    dto: SubmitBriefDto,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const lead = await this.leadsRepository.findOne({
      where: { briefToken },
    });

    if (!lead) {
      throw new NotFoundException('Brief token not found.');
    }

    let submission: BriefSubmissionEntity;

    try {
      submission = await this.briefSubmissionsRepository.save(
        this.briefSubmissionsRepository.create({
          leadId: lead.id,
          briefToken,
          answersJson: {
            answers: dto.answers,
            attachments: dto.attachments || [],
            submittedBy: dto.submittedBy || 'client',
          },
          idempotencyKey,
          correlationId,
        }),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { code?: string }).code === '23505'
      ) {
        const existing = await this.briefSubmissionsRepository.findOne({
          where: { idempotencyKey },
        });

        if (existing) {
          return okResponse(
            {
              briefSubmissionId: existing.id,
              leadId: lead.leadId,
              status: 'idempotent_replay',
            },
            correlationId,
          );
        }
      }

      throw new ConflictException('Unable to persist brief submission.');
    }

    lead.status = LEAD_STATUS.BRIEF_SUBMITTED;
    await this.leadsRepository.save(lead);

    let project = await this.projectsRepository.findOne({
      where: { clientToken: briefToken },
    });

    if (!project) {
      project = await this.projectsRepository.save(
        this.projectsRepository.create({
          projectCode: `PRJ-${Date.now().toString(36).toUpperCase()}`,
          leadId: lead.id,
          clientToken: briefToken,
          name: lead.company,
          serviceType: lead.service,
          status: 'active',
          currentPhase: 'brief_submitted',
          progressPercentage: 20,
        }),
      );
    } else {
      project.currentPhase = 'brief_submitted';
      project.progressPercentage = Math.max(project.progressPercentage, 20);
      project.version += 1;
      await this.projectsRepository.save(project);
    }

    await this.auditService.log({
      actorType: 'client',
      actorId: briefToken,
      action: 'brief.submitted',
      resourceType: 'brief_submission',
      resourceId: submission.id,
      correlationId,
      idempotencyKey,
      payloadJson: {
        leadId: lead.leadId,
      },
    });

    return okResponse(
      {
        briefSubmissionId: submission.id,
        leadId: lead.leadId,
        projectId: project.id,
        status: 'submitted',
      },
      correlationId,
      project.version,
    );
  }
}
