import {
  BadGatewayException,
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
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
import { CreateLeadIntakeDto } from './dto/create-lead-intake.dto';
import { PublicLeadIntakeDto } from './dto/public-lead-intake.dto';
import { RequestBriefDto } from './dto/request-brief.dto';
import { LeadEntity } from './lead.entity';
import { LEAD_STATUS } from './lead-status';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(WorkflowEventEntity)
    private readonly workflowEventsRepository: Repository<WorkflowEventEntity>,
    private readonly configService: ConfigService,
    private readonly n8nClientService: N8nClientService,
  ) {}

  private buildPortalUrls(token: string) {
    const portalBaseUrl = this.configService.get<string>(
      'PORTAL_BASE_URL',
      'https://portal.jssolutions.com.co',
    );

    return {
      briefUrl: `${portalBaseUrl}/brief/${token}`,
      clientDashboardUrl: `${portalBaseUrl}/dashboard?token=${token}`,
    };
  }

  private generateBriefToken(): string {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }

    return generateFallbackId('brief');
  }

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

  async createIntake(dto: CreateLeadIntakeDto) {
    const leadId = dto.leadId?.trim() || generateFallbackId('lead');
    const correlationId =
      dto.correlationId?.trim() || generateCorrelationId('create-quote');
    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      generateIdempotencyKey(
        'create-quote',
        `${leadId}:${dto.email || dto.nombre}`,
      );

    const existing = await this.leadsRepository.findOne({ where: { leadId } });
    const briefToken = existing?.briefToken || this.generateBriefToken();

    const lead = this.leadsRepository.create({
      id: existing?.id,
      leadId,
      briefToken,
      name: dto.nombre.trim(),
      company: dto.empresa.trim(),
      email: dto.email?.trim() || existing?.email || null,
      phone: dto.phone?.trim() || existing?.phone || null,
      service: dto.servicio?.trim() || existing?.service || null,
      source: dto.source?.trim() || existing?.source || null,
      utmJson:
        dto.utm && typeof dto.utm === 'object'
          ? dto.utm
          : existing?.utmJson || null,
      landingPath: dto.landingPath?.trim() || existing?.landingPath || null,
      referrer: dto.referrer?.trim() || existing?.referrer || null,
      status: dto.estado?.trim() || LEAD_STATUS.DIAGNOSTIC_CAPTURED,
    });

    const savedLead = await this.leadsRepository.save(lead);
    const links = this.buildPortalUrls(briefToken);

    await this.logWorkflowEvent({
      workflowName: 'api.create-intake',
      eventName: existing ? 'lead.updated' : 'lead.created',
      status: 'success',
      leadId,
      idempotencyKey,
      correlationId,
      payloadJson: {
        email: savedLead.email,
        service: savedLead.service,
      },
    });

    return {
      success: true,
      leadId,
      token: briefToken,
      briefUrl: links.briefUrl,
      clientDashboardUrl: links.clientDashboardUrl,
      correlationId,
      message: existing
        ? 'Lead actualizado y brief conservado.'
        : 'Lead creado y brief preparado.',
    };
  }

  async createPublicIntake(dto: PublicLeadIntakeDto) {
    return this.createIntake({
      nombre: dto.fullName,
      empresa: dto.companyName,
      email: dto.email,
      phone: dto.phone,
      servicio: dto.serviceInterest,
      source: dto.source,
      utm: dto.utm,
      landingPath: dto.landingPath,
      referrer: dto.referrer,
      estado: LEAD_STATUS.DIAGNOSTIC_CAPTURED,
      correlationId: dto.correlationId,
      idempotencyKey:
        dto.idempotencyKey ||
        generateIdempotencyKey(
          'public-intake',
          `${dto.email || dto.fullName}:${dto.companyName}:${dto.source}`,
        ),
    });
  }

  async requestBrief(dto: RequestBriefDto) {
    if (!dto.leadId && !dto.email) {
      throw new NotFoundException('Debes enviar leadId o email.');
    }

    const correlationId =
      dto.correlationId?.trim() || generateCorrelationId('request-brief');
    const requestId =
      dto.requestId?.trim() || generateFallbackId('request-brief');
    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      generateIdempotencyKey('request-brief', requestId);

    const lead = await this.leadsRepository.findOne({
      where: dto.leadId
        ? { leadId: dto.leadId.trim() }
        : { email: dto.email?.trim() },
    });

    if (!lead) {
      throw new NotFoundException(
        'No se encontró el lead para solicitar brief.',
      );
    }

    const existingEvent = await this.workflowEventsRepository.findOne({
      where: {
        workflowName: 'api.request-brief',
        idempotencyKey,
        status: 'success',
      },
      order: { createdAt: 'DESC' },
    });

    if (existingEvent && !dto.forceResend) {
      const token = lead.briefToken || this.generateBriefToken();
      const links = this.buildPortalUrls(token);

      return {
        success: true,
        leadId: lead.leadId,
        token,
        briefUrl: links.briefUrl,
        clientDashboardUrl: links.clientDashboardUrl,
        deliveryStatus: 'skipped_idempotent',
        correlationId,
        message: 'Solicitud ya procesada por idempotencia.',
      };
    }

    if (!lead.briefToken) {
      lead.briefToken = this.generateBriefToken();
    }

    lead.status = LEAD_STATUS.BRIEF_REQUESTED;
    await this.leadsRepository.save(lead);

    const links = this.buildPortalUrls(lead.briefToken);

    const webhookUrl = this.configService.get<string>(
      'N8N_REQUEST_BRIEF_WEBHOOK_URL',
    );
    if (!webhookUrl) {
      throw new ServiceUnavailableException(
        'N8N_REQUEST_BRIEF_WEBHOOK_URL no está configurada en api.',
      );
    }

    const upstream = await this.n8nClientService.postJson({
      url: webhookUrl,
      body: {
        leadId: lead.leadId,
        email: lead.email || dto.email,
        requestId,
        forceResend: Boolean(dto.forceResend),
      },
      correlationId,
      idempotencyKey,
    });

    if (!upstream.ok) {
      await this.logWorkflowEvent({
        workflowName: 'api.request-brief',
        eventName: 'brief.request.failed',
        status: 'error',
        leadId: lead.leadId,
        idempotencyKey,
        correlationId,
        errorMessage: upstream.errorMessage,
      });

      throw new BadGatewayException(
        upstream.errorMessage || 'n8n falló al enviar el brief.',
      );
    }

    const deliveryStatus =
      typeof upstream.data.deliveryStatus === 'string'
        ? upstream.data.deliveryStatus
        : 'sent';

    await this.logWorkflowEvent({
      workflowName: 'api.request-brief',
      eventName: dto.forceResend ? 'brief.resent' : 'brief.requested',
      status: 'success',
      leadId: lead.leadId,
      idempotencyKey,
      correlationId,
      payloadJson: {
        email: lead.email,
        forceResend: Boolean(dto.forceResend),
        deliveryStatus,
      },
    });

    return {
      success: true,
      leadId: lead.leadId,
      token: lead.briefToken,
      briefUrl:
        typeof upstream.data.briefUrl === 'string'
          ? upstream.data.briefUrl
          : links.briefUrl,
      clientDashboardUrl:
        typeof upstream.data.clientDashboardUrl === 'string'
          ? upstream.data.clientDashboardUrl
          : links.clientDashboardUrl,
      deliveryStatus,
      correlationId,
      message:
        typeof upstream.data.message === 'string'
          ? upstream.data.message
          : dto.forceResend
            ? 'Brief reenviado correctamente.'
            : 'Brief solicitado correctamente.',
    };
  }

  async findByLeadId(leadId: string) {
    const lead = await this.leadsRepository.findOne({ where: { leadId } });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado.');
    }

    return lead;
  }
}
