import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { generateFallbackId } from '../../common/ids';
import { N8nClientService } from '../../common/n8n-client.service';
import { LeadEntity } from '../../leads/lead.entity';
import { ProjectEntity } from '../projects/project.entity';
import { AuditService } from '../shared/audit/audit.service';
import { okResponse } from '../shared/contracts/api-response';
import { IdempotencyService } from '../shared/idempotency/idempotency.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentEventEntity } from './payment-event.entity';
import { PaymentIntentEntity } from './payment-intent.entity';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly n8nClientService: N8nClientService,
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentsRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventsRepository: Repository<PaymentEventEntity>,
    private readonly idempotencyService: IdempotencyService,
    private readonly auditService: AuditService,
  ) {}

  async createIntent(
    dto: CreatePaymentIntentDto,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const claimed = await this.idempotencyService.claim({
      scope: 'client-payment-intent',
      idempotencyKey,
      correlationId,
    });

    if (claimed.alreadyClaimed && claimed.record.responseJson) {
      return okResponse(claimed.record.responseJson, correlationId);
    }

    let project: ProjectEntity | null = null;

    if (dto.projectId) {
      project = await this.projectsRepository.findOne({ where: { id: dto.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found for payment intent.');
      }
    }

    if (!project && dto.clientToken) {
      project = await this.projectsRepository.findOne({ where: { clientToken: dto.clientToken } });
    }

    if (
      project &&
      typeof dto.expectedVersion === 'number' &&
      dto.expectedVersion !== project.version
    ) {
      throw new ConflictException('Project version mismatch for payment intent.');
    }

    const lead =
      !project && dto.clientToken
        ? await this.leadsRepository.findOne({
            where: { briefToken: dto.clientToken },
          })
        : null;

    const webhookUrl = this.configService.get<string>('N8N_PAYMENTS_CREATE_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new ServiceUnavailableException(
        'N8N_PAYMENTS_CREATE_WEBHOOK_URL is not configured.',
      );
    }

    const upstream = await this.n8nClientService.postJson({
      url: webhookUrl,
      body: {
        projectId: project?.id,
        clientToken: dto.clientToken || project?.clientToken,
        amount: dto.amount,
        currency: dto.currency || 'COP',
        method: dto.method || 'bancolombia_button',
      },
      correlationId,
      idempotencyKey,
    });

    const providerReference =
      typeof upstream.data.providerReference === 'string' &&
      upstream.data.providerReference.trim()
        ? upstream.data.providerReference.trim()
        : generateFallbackId('payment-ref');

    const checkoutUrl =
      typeof upstream.data.checkoutUrl === 'string'
        ? upstream.data.checkoutUrl
        : typeof upstream.data.paymentUrl === 'string'
          ? upstream.data.paymentUrl
          : null;

    const status =
      upstream.ok && checkoutUrl
        ? 'processing'
        : upstream.ok
          ? 'pending'
          : 'failed';

    const intent = await this.paymentIntentsRepository.save(
      this.paymentIntentsRepository.create({
        projectId: project?.id || null,
        leadId: project?.leadId || lead?.id || null,
        provider: 'bancolombia',
        paymentMethod: dto.method || 'bancolombia_button',
        amountCop:
          typeof dto.amount === 'number' && Number.isFinite(dto.amount)
            ? String(dto.amount)
            : null,
        currency: dto.currency || 'COP',
        checkoutUrl,
        providerReference,
        status,
        idempotencyKey,
        correlationId,
      }),
    );

    await this.paymentEventsRepository.save(
      this.paymentEventsRepository.create({
        paymentIntentId: intent.id,
        provider: intent.provider,
        providerReference: intent.providerReference,
        eventType: upstream.ok ? 'payment.intent.created' : 'payment.intent.failed',
        status,
        payloadJson: upstream.data,
        correlationId,
      }),
    );

    await this.auditService.log({
      actorType: 'client',
      actorId: dto.clientToken,
      action: 'payment.intent.create',
      resourceType: 'payment_intent',
      resourceId: intent.id,
      correlationId,
      idempotencyKey,
      payloadJson: {
        upstreamOk: upstream.ok,
        status,
      },
    });

    const responsePayload = {
      paymentIntentId: intent.id,
      checkoutUrl: intent.checkoutUrl,
      status: intent.status,
      providerReference: intent.providerReference,
      version: intent.version,
    };

    await this.idempotencyService.complete(claimed.record.id, responsePayload);

    return okResponse(responsePayload, correlationId, intent.version);
  }

  async registerCallback(input: {
    provider: string;
    providerReference?: string;
    eventType: string;
    status: string;
    payload: Record<string, unknown>;
    correlationId: string;
  }) {
    const intent = input.providerReference
      ? await this.paymentIntentsRepository.findOne({
          where: { providerReference: input.providerReference },
        })
      : null;

    if (intent) {
      intent.status = input.status;
      intent.version += 1;
      await this.paymentIntentsRepository.save(intent);
    }

    await this.paymentEventsRepository.save(
      this.paymentEventsRepository.create({
        paymentIntentId: intent?.id || null,
        provider: input.provider,
        providerReference: input.providerReference || null,
        eventType: input.eventType,
        status: input.status,
        payloadJson: input.payload,
        correlationId: input.correlationId,
      }),
    );

    return okResponse(
      {
        paymentIntentId: intent?.id,
        status: input.status,
      },
      input.correlationId,
      intent?.version,
    );
  }
}
