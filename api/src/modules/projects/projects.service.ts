import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ContractEntity } from '../../contracts/contract.entity';
import { LeadEntity } from '../../leads/lead.entity';
import { QuoteEntity } from '../../quotes/quote.entity';
import { okResponse } from '../shared/contracts/api-response';
import { DocumentEntity } from '../documents/document.entity';
import { ProjectMilestoneEntity } from './project-milestone.entity';
import { ProjectEntity } from './project.entity';

function mapDocStatus(status?: string | null): 'Pendiente' | 'En revisión' | 'Aprobado' {
  const normalized = String(status || '').toLowerCase();

  if (normalized.includes('approv') || normalized.includes('aprob')) {
    return 'Aprobado';
  }

  if (normalized.includes('review') || normalized.includes('revisi')) {
    return 'En revisión';
  }

  return 'Pendiente';
}

function mapMilestoneStatus(status?: string | null):
  | 'Pendiente'
  | 'En Proceso'
  | 'Completado' {
  const normalized = String(status || '').toLowerCase();

  if (normalized.includes('complete') || normalized.includes('done')) {
    return 'Completado';
  }

  if (normalized.includes('progress') || normalized.includes('curso')) {
    return 'En Proceso';
  }

  return 'Pendiente';
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectMilestoneEntity)
    private readonly milestonesRepository: Repository<ProjectMilestoneEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(QuoteEntity)
    private readonly quotesRepository: Repository<QuoteEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractsRepository: Repository<ContractEntity>,
  ) {}

  async listAdminMilestones(correlationId: string) {
    const milestones = await this.milestonesRepository.find({
      order: { updatedAt: 'DESC' },
      take: 300,
    });

    const projectIds = Array.from(new Set(milestones.map((item) => item.projectId)));
    const projects = projectIds.length
      ? await this.projectsRepository.find({
          where: {
            id: In(projectIds),
          },
        })
      : [];
    const projectsMap = new Map(projects.map((project) => [project.id, project]));

    return okResponse(
      milestones.map((item) => {
        const project = projectsMap.get(item.projectId);

        return {
          id: item.id,
          projectId: item.projectId,
          projectName: project?.name || 'Project',
          clientName: project?.name || 'Client',
          industry: 'Technology',
          owner: item.owner || 'Unassigned',
          phase: item.phase || project?.currentPhase || 'execution',
          title: item.title,
          dueDate: item.dueDate || new Date().toISOString().slice(0, 10),
          status: mapMilestoneStatus(item.status),
          priority: item.priority,
          externalUrl: item.externalUrl || undefined,
          version: item.version,
        };
      }),
      correlationId,
    );
  }

  async getClientDashboardByProjectId(projectId: string, correlationId: string) {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return this.buildDashboard(project, correlationId);
  }

  async getClientDashboardByToken(clientToken: string, correlationId: string) {
    const project = await this.projectsRepository.findOne({
      where: { clientToken },
    });

    if (project) {
      return this.buildDashboard(project, correlationId);
    }

    const lead = await this.leadsRepository.findOne({ where: { briefToken: clientToken } });
    if (!lead) {
      throw new NotFoundException('Client token not found.');
    }

    const quote = await this.quotesRepository.findOne({
      where: { leadId: lead.id },
      order: { updatedAt: 'DESC' },
    });
    const contract = await this.contractsRepository.findOne({
      where: { leadId: lead.id },
      order: { updatedAt: 'DESC' },
    });

    return okResponse(
      {
        clientToken,
        projectName: lead.company,
        serviceType: lead.service || 'Implementación tecnológica',
        currentPhase: lead.status || 'Onboarding',
        progressPercentage: quote ? 60 : 25,
        driveFolderUrl: '',
        quote: quote
          ? {
              id: quote.quoteDocumentId,
              name: 'Cotización Comercial',
              url: quote.quotePdfUrl || '',
              status: mapDocStatus(quote.quoteStatus),
              sentAt: quote.quoteGeneratedAt?.toISOString(),
              approvedAt: quote.quoteApprovedAt?.toISOString() || undefined,
            }
          : undefined,
        contract: contract
          ? {
              id: contract.contractDocumentId,
              name: 'Contrato',
              url: contract.contractUrl || '',
              status: mapDocStatus(contract.contractStatus),
              sentAt: contract.contractGeneratedAt?.toISOString(),
              approvedAt: contract.contractApprovedAt?.toISOString() || undefined,
            }
          : undefined,
        tasks: [],
        milestones: [],
        documents: [],
      },
      correlationId,
    );
  }

  private async buildDashboard(project: ProjectEntity, correlationId: string) {
    const milestones = await this.milestonesRepository.find({
      where: { projectId: project.id },
      order: { dueDate: 'ASC', createdAt: 'ASC' },
      take: 100,
    });

    const documents = await this.documentsRepository.find({
      where: { projectId: project.id },
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    const quoteDoc = documents.find((item) => item.kind === 'quote');
    const contractDoc = documents.find((item) => item.kind === 'contract');

    return okResponse(
      {
        projectId: project.id,
        clientToken: project.clientToken || '',
        projectName: project.name,
        serviceType: project.serviceType || 'Implementación tecnológica',
        currentPhase: project.currentPhase,
        progressPercentage: project.progressPercentage,
        driveFolderUrl: project.driveFolderUrl || '',
        quote: quoteDoc
          ? {
              id: quoteDoc.id,
              name: quoteDoc.name,
              url: quoteDoc.url,
              status: mapDocStatus(quoteDoc.status),
            }
          : undefined,
        contract: contractDoc
          ? {
              id: contractDoc.id,
              name: contractDoc.name,
              url: contractDoc.url,
              status: mapDocStatus(contractDoc.status),
            }
          : undefined,
        tasks: milestones.slice(0, 8).map((item) => ({
          id: item.id,
          name: item.title,
          phase: item.phase || project.currentPhase,
          status:
            mapMilestoneStatus(item.status) === 'Completado'
              ? 'Finalizado'
              : mapMilestoneStatus(item.status) === 'En Proceso'
                ? 'En curso'
                : 'Pendiente',
        })),
        milestones: milestones.map((item) => ({
          id: item.id,
          name: item.title,
          description: item.description || undefined,
          status: mapMilestoneStatus(item.status),
        })),
        documents: documents.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.documentType,
          status: mapDocStatus(item.status),
          url: item.url,
          updatedAt: item.updatedAt.toISOString(),
          sizeLabel: item.sizeLabel || undefined,
          kind: item.kind,
        })),
      },
      correlationId,
      project.version,
    );
  }
}
