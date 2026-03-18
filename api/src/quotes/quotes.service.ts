import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  generateCorrelationId,
  generateFallbackId,
  generateIdempotencyKey,
} from '../common/ids';
import { MetaConversionsApiService } from '../common/meta-conversions-api.service';
import { N8nClientService } from '../common/n8n-client.service';
import { PublicRequestContext } from '../common/public-request-context';
import { ContractEntity } from '../contracts/contract.entity';
import { LeadEntity } from '../leads/lead.entity';
import { LEAD_STATUS } from '../leads/lead-status';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
import { GenerateQuoteDto } from './dto/generate-quote.dto';
import { ListQuotesDto } from './dto/list-quotes.dto';
import { PublicQuoteEstimateDto } from './dto/public-quote-estimate.dto';
import { QuoteEntity } from './quote.entity';

type CountRow = {
  total: number;
};

type QuoteListRow = Record<string, unknown>;

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly n8nClientService: N8nClientService,
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(QuoteEntity)
    private readonly quotesRepository: Repository<QuoteEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractsRepository: Repository<ContractEntity>,
    @InjectRepository(WorkflowEventEntity)
    private readonly workflowEventsRepository: Repository<WorkflowEventEntity>,
    private readonly metaConversionsApiService: MetaConversionsApiService,
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

  async listQuotes(query: ListQuotesDto) {
    const correlationId = generateCorrelationId('quotes-list');
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize || 50)));
    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = [];
    const values: unknown[] = [];

    if (query.search?.trim()) {
      values.push(`%${query.search.trim().toLowerCase()}%`);
      whereClauses.push(
        `LOWER(CONCAT_WS(' ', l.lead_id, l.name, l.company, COALESCE(l.email,''), COALESCE(l.service,''))) LIKE $${values.length}`,
      );
    }

    if (query.status?.trim()) {
      values.push(query.status.trim().toLowerCase());
      whereClauses.push(`LOWER(l.status) = $${values.length}`);
    }

    if (
      query.industry?.trim() &&
      query.industry.trim().toLowerCase() !== 'todas'
    ) {
      values.push(`%${query.industry.trim().toLowerCase()}%`);
      whereClauses.push(
        `LOWER(CONCAT_WS(' ', l.company, COALESCE(l.service,''), COALESCE(l.status,''))) LIKE $${values.length}`,
      );
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const portalBaseUrl = this.configService.get<string>(
      'PORTAL_BASE_URL',
      'https://portal.jssolutions.com.co',
    );

    const countRows = await this.dataSource.query<CountRow[]>(
      `SELECT COUNT(*)::int AS total FROM leads l ${whereSql}`,
      values,
    );

    const dataValues = [
      ...values,
      pageSize,
      offset,
      portalBaseUrl,
      portalBaseUrl,
    ];

    const items = await this.dataSource.query<QuoteListRow[]>(
      `
      SELECT
        l.lead_id AS id,
        l.lead_id AS "leadId",
        l.name AS nombre,
        l.company AS empresa,
        COALESCE(l.service, 'Sin servicio') AS servicio,
        '$0 COP' AS monto,
        l.status AS estado,
        l.email AS email,
        CASE
          WHEN LOWER(COALESCE(l.service, '')) LIKE '%public%' THEN 'Sector Público'
          ELSE 'General'
        END AS industria,
        l.brief_token AS "briefToken",
        CASE WHEN l.brief_token IS NOT NULL THEN CONCAT($${values.length + 3}, '/brief/', l.brief_token) END AS "briefUrl",
        CASE WHEN l.brief_token IS NOT NULL THEN CONCAT($${values.length + 4}, '/dashboard?token=', l.brief_token) END AS "clientDashboardUrl",
        bs.answers_json AS "technicalBrief",
        bs.submitted_at AS "briefCompletedAt",
        q.quote_document_id AS "quoteDocumentId",
        q.quote_pdf_url AS "quotePdfUrl",
        q.quote_status AS "quoteStatus",
        q.quote_generated_at AS "quoteGeneratedAt",
        q.quote_approved_at AS "quoteApprovedAt",
        q.quote_feedback AS "quoteLastFeedback",
        c.contract_url AS "contractUrl",
        c.contract_generated_at AS "contractGeneratedAt"
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT answers_json, submitted_at
        FROM brief_submissions bs
        WHERE bs.lead_id = l.id
        ORDER BY bs.submitted_at DESC
        LIMIT 1
      ) bs ON true
      LEFT JOIN LATERAL (
        SELECT quote_document_id, quote_pdf_url, quote_status, quote_generated_at, quote_approved_at, quote_feedback
        FROM quotes q
        WHERE q.lead_id = l.id
        ORDER BY q.updated_at DESC
        LIMIT 1
      ) q ON true
      LEFT JOIN LATERAL (
        SELECT contract_url, contract_generated_at
        FROM contracts c
        WHERE c.lead_id = l.id
        ORDER BY c.updated_at DESC
        LIMIT 1
      ) c ON true
      ${whereSql}
      ORDER BY l.updated_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
      `,
      dataValues,
    );

    return {
      items,
      total: Number(countRows[0]?.total || 0),
      page,
      pageSize,
      correlationId,
    };
  }

  async generateQuote(dto: GenerateQuoteDto) {
    const lead = await this.leadsRepository.findOne({
      where: { leadId: dto.leadId.trim() },
    });

    if (!lead) {
      throw new NotFoundException(
        'Lead no encontrado para generar cotización.',
      );
    }

    const correlationId =
      dto.correlationId?.trim() || generateCorrelationId('quote');
    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      generateIdempotencyKey(
        `generate-quote:${dto.mode}`,
        `${dto.leadId}:${dto.clientToken}:${dto.feedback || 'na'}`,
      );

    const webhookUrl = this.configService.get<string>('N8N_GENERATE_QUOTE_URL');
    if (!webhookUrl) {
      throw new ServiceUnavailableException(
        'N8N_GENERATE_QUOTE_URL no está configurada en api.',
      );
    }
    const quoteTimeoutMs = Number(
      this.configService.get<string>(
        'N8N_GENERATE_QUOTE_TIMEOUT_MS',
        this.configService.get<string>('N8N_REQUEST_TIMEOUT_MS', '15000'),
      ),
    );

    const upstream = await this.n8nClientService.postJson({
      url: webhookUrl,
      body: {
        leadId: dto.leadId,
        clientToken: dto.clientToken,
        transcripcion: dto.transcripcion,
        feedback: dto.feedback || undefined,
        mode: dto.mode,
      },
      correlationId,
      idempotencyKey,
      timeoutMs:
        Number.isFinite(quoteTimeoutMs) && quoteTimeoutMs > 0
          ? quoteTimeoutMs
          : 15000,
    });

    if (!upstream.ok) {
      await this.logWorkflowEvent({
        workflowName: 'api.generate-quote',
        eventName: 'quote.generate.failed',
        status: 'error',
        leadId: dto.leadId,
        idempotencyKey,
        correlationId,
        errorMessage: upstream.errorMessage,
        payloadJson: { mode: dto.mode },
      });

      throw new BadGatewayException(
        upstream.errorMessage || 'n8n falló al generar cotización.',
      );
    }

    const result = upstream.data;
    const quotePdfUrl =
      typeof result.quotePdfUrl === 'string'
        ? result.quotePdfUrl
        : typeof result.pdfUrl === 'string'
          ? result.pdfUrl
          : undefined;

    const quoteDocumentId =
      typeof result.quoteDocumentId === 'string' &&
      result.quoteDocumentId.trim()
        ? result.quoteDocumentId.trim()
        : generateFallbackId('quote-doc');

    if (dto.mode === 'send') {
      await this.quotesRepository.save(
        this.quotesRepository.create({
          leadId: lead.id,
          quoteDocumentId,
          quotePdfUrl: quotePdfUrl || null,
          quoteStatus: 'in_review',
          quoteFeedback: dto.feedback || null,
          quoteGeneratedAt: new Date(),
          idempotencyKey,
          correlationId,
        }),
      );

      lead.status = LEAD_STATUS.QUOTE_IN_REVIEW;
      await this.leadsRepository.save(lead);
    }

    await this.logWorkflowEvent({
      workflowName: 'api.generate-quote',
      eventName: dto.mode === 'preview' ? 'quote.previewed' : 'quote.generated',
      status: 'success',
      leadId: dto.leadId,
      idempotencyKey,
      correlationId,
      payloadJson: {
        mode: dto.mode,
        quotePdfUrl,
        quoteDocumentId,
      },
    });

    return {
      success: true,
      mode: dto.mode,
      quotePdfUrl,
      quoteDocumentId,
      message:
        dto.mode === 'preview'
          ? 'Previsualización de cotización generada.'
          : 'Cotización generada y enviada.',
      correlationId,
    };
  }

  private sanitizeMetadataObject(
    input?: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return null;
    }

    return input;
  }

  private async resolveLeadForPublicEstimate(
    dto: PublicQuoteEstimateDto,
  ): Promise<LeadEntity | null> {
    if (dto.leadId?.trim()) {
      const leadById = await this.leadsRepository.findOne({
        where: { leadId: dto.leadId.trim() },
      });
      if (leadById) {
        return leadById;
      }
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedCompany = dto.companyName.trim().toLowerCase();

    return this.leadsRepository
      .createQueryBuilder('lead')
      .where('LOWER(lead.email) = :email', { email: normalizedEmail })
      .andWhere('LOWER(lead.company) = :company', { company: normalizedCompany })
      .andWhere(`lead.updated_at >= NOW() - INTERVAL '24 hours'`)
      .orderBy('lead.updated_at', 'DESC')
      .getOne();
  }

  async publicEstimate(
    dto: PublicQuoteEstimateDto,
    requestContext?: PublicRequestContext,
  ) {
    const correlationId =
      dto.correlationId?.trim() || generateCorrelationId('public-quote');
    const idempotencyKey =
      dto.idempotencyKey?.trim() ||
      generateIdempotencyKey(
        'public-quote-estimate',
        `${dto.email}:${dto.companyName}:${dto.serviceInterest}:${dto.mode || 'preview'}`,
      );

    const existingLead = await this.resolveLeadForPublicEstimate(dto);
    const lead = this.leadsRepository.create({
      id: existingLead?.id,
      leadId: existingLead?.leadId || generateFallbackId('lead'),
      briefToken: existingLead?.briefToken || generateFallbackId('brief'),
      name: dto.fullName.trim(),
      company: dto.companyName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || existingLead?.phone || null,
      service: dto.serviceInterest.trim(),
      source: dto.source?.trim() || existingLead?.source || 'landing_quote_estimator',
      utmJson: this.sanitizeMetadataObject(dto.utm) || existingLead?.utmJson || null,
      landingPath: dto.landingPath?.trim() || existingLead?.landingPath || null,
      referrer: dto.referrer?.trim() || existingLead?.referrer || null,
      status: LEAD_STATUS.DIAGNOSTIC_CAPTURED,
      version: existingLead ? existingLead.version + 1 : 1,
    });

    const savedLead = await this.leadsRepository.save(lead);

    const mode = dto.mode || 'preview';
    const generated = await this.generateQuote({
      leadId: savedLead.leadId,
      clientToken: savedLead.briefToken || generateFallbackId('brief'),
      transcripcion: dto.transcription,
      feedback: dto.feedback,
      mode,
      correlationId,
      idempotencyKey,
    });

    void this.metaConversionsApiService
      .sendEvents([
        {
          eventName: 'Search',
          eventId: `search:${correlationId}`,
          eventSourceUrl:
            requestContext?.sourceUrl ||
            dto.landingPath?.trim() ||
            undefined,
          actionSource: 'website',
          userData: {
            email: dto.email,
            phone: dto.phone,
            externalId: savedLead.leadId,
            clientIpAddress: requestContext?.clientIpAddress,
            clientUserAgent: requestContext?.clientUserAgent,
            fbc: requestContext?.fbc,
            fbp: requestContext?.fbp,
          },
          customData: {
            source: dto.source?.trim() || 'landing_quote_estimator',
            search_string: dto.serviceInterest.trim(),
            mode,
            correlation_id: correlationId,
            landing_path: dto.landingPath || '',
            referrer: dto.referrer || requestContext?.referrer || '',
          },
        },
      ])
      .catch(async (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`No se pudo enviar evento Search a Meta CAPI: ${errorMessage}`);
        await this.logWorkflowEvent({
          workflowName: 'api.public-quote-estimate',
          eventName: 'meta.search.failed',
          status: 'warning',
          leadId: savedLead.leadId,
          idempotencyKey,
          correlationId,
          errorMessage,
        });
      });

    return {
      ...generated,
      leadId: savedLead.leadId,
      briefToken: savedLead.briefToken,
    };
  }
}
