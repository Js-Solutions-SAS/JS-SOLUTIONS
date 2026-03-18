import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  generateCorrelationId,
  generateFallbackId,
  generateIdempotencyKey,
} from '../common/ids';
import { N8nClientService } from '../common/n8n-client.service';
import { GenerateContractDto } from './dto/generate-contract.dto';
import { ContractEntity } from './contract.entity';
import { LeadEntity } from '../leads/lead.entity';
import { LEAD_STATUS } from '../leads/lead-status';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';

@Injectable()
export class ContractsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly n8nClientService: N8nClientService,
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractsRepository: Repository<ContractEntity>,
    @InjectRepository(WorkflowEventEntity)
    private readonly workflowEventsRepository: Repository<WorkflowEventEntity>,
  ) {}

  private async logWorkflowEvent(input: {
    workflowName: string;
    eventName: string;
    status: 'success' | 'error' | 'warning';
    leadId?: string;
    idempotencyKey?: string;
    correlationId?: string;
    payloadJson?: Record<string, unknown>;
    errorMessage?: string;
  }) {
    await this.workflowEventsRepository.save(
      this.workflowEventsRepository.create({
        workflowName: input.workflowName,
        eventName: input.eventName,
        status: input.status,
        leadId: input.leadId || null,
        idempotencyKey: input.idempotencyKey || null,
        correlationId: input.correlationId || null,
        payloadJson: input.payloadJson || null,
        errorMessage: input.errorMessage || null,
      }),
    );
  }

  async generateContract(dto: GenerateContractDto) {
    const normalizedStatus = dto.estado.trim().toLowerCase();
    if (!['firmado', 'approved', 'signed'].includes(normalizedStatus)) {
      throw new BadRequestException(
        'Solo puedes generar contrato cuando la cotización esté firmada.',
      );
    }

    const lead = await this.leadsRepository.findOne({
      where: { leadId: dto.leadId.trim() },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado para generar contrato.');
    }

    const correlationId =
      dto.correlationId?.trim() || generateCorrelationId('contract');
    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      generateIdempotencyKey(
        'generate-contract',
        `${dto.leadId}:${dto.email || 'na'}`,
      );

    const webhookUrl = this.configService.get<string>(
      'N8N_GENERATE_CONTRACT_URL',
    );
    if (!webhookUrl) {
      throw new ServiceUnavailableException(
        'N8N_GENERATE_CONTRACT_URL no está configurada en api.',
      );
    }

    const upstream = await this.n8nClientService.postJson({
      url: webhookUrl,
      body: {
        leadId: dto.leadId,
        email: dto.email,
        estado: dto.estado,
      },
      correlationId,
      idempotencyKey,
    });

    if (!upstream.ok) {
      await this.logWorkflowEvent({
        workflowName: 'api.generate-contract',
        eventName: 'contract.generate.failed',
        status: 'error',
        leadId: dto.leadId,
        idempotencyKey,
        correlationId,
        errorMessage: upstream.errorMessage,
      });

      throw new BadGatewayException(
        upstream.errorMessage || 'n8n falló al generar contrato.',
      );
    }

    const result = upstream.data;
    const contractUrl =
      typeof result.contractUrl === 'string' ? result.contractUrl : undefined;
    const contractDocumentId =
      typeof result.contractDocumentId === 'string' &&
      result.contractDocumentId.trim()
        ? result.contractDocumentId.trim()
        : generateFallbackId('contract-doc');

    await this.contractsRepository.save(
      this.contractsRepository.create({
        leadId: lead.id,
        contractDocumentId,
        contractUrl: contractUrl || null,
        contractStatus: 'in_review',
        contractGeneratedAt: new Date(),
        idempotencyKey,
        correlationId,
      }),
    );

    lead.status = LEAD_STATUS.CONTRACT_SENT;
    await this.leadsRepository.save(lead);

    await this.logWorkflowEvent({
      workflowName: 'api.generate-contract',
      eventName: 'contract.generated',
      status: 'success',
      leadId: dto.leadId,
      idempotencyKey,
      correlationId,
      payloadJson: {
        contractUrl,
        contractDocumentId,
      },
    });

    return {
      success: true,
      contractUrl,
      message: 'Contrato generado y enviado correctamente.',
      correlationId,
    };
  }
}
