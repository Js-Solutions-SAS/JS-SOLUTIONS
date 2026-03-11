import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContractEntity } from '../../contracts/contract.entity';
import { LeadEntity } from '../../leads/lead.entity';
import { QuoteEntity } from '../../quotes/quote.entity';
import { PaymentIntentEntity } from '../payments/payment-intent.entity';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../shared/audit/audit.service';
import { okResponse } from '../shared/contracts/api-response';
import { StgProviderCallbackRawEntity } from '../shared/staging/stg-provider-callback-raw.entity';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { SignatureCallbackDto } from './dto/signature-callback.dto';
import { SignatureEventEntity } from './signature-event.entity';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(StgProviderCallbackRawEntity)
    private readonly stagingCallbacksRepository: Repository<StgProviderCallbackRawEntity>,
    @InjectRepository(SignatureEventEntity)
    private readonly signatureEventsRepository: Repository<SignatureEventEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
    @InjectRepository(QuoteEntity)
    private readonly quotesRepository: Repository<QuoteEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractsRepository: Repository<ContractEntity>,
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentsRepository: Repository<PaymentIntentEntity>,
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  async handlePaymentsCallback(dto: PaymentCallbackDto, correlationId: string) {
    const provider = dto.provider || 'bancolombia';

    await this.stagingCallbacksRepository.save(
      this.stagingCallbacksRepository.create({
        provider,
        eventType: dto.eventType,
        payloadJson: dto.payload,
        correlationId,
      }),
    );

    const response = await this.paymentsService.registerCallback({
      provider,
      providerReference: dto.providerReference,
      eventType: dto.eventType,
      status: dto.status,
      payload: dto.payload,
      correlationId,
    });

    await this.auditService.log({
      actorType: 'internal',
      action: 'payment.callback',
      resourceType: 'payment',
      resourceId:
        dto.providerReference ||
        (typeof response.data.paymentIntentId === 'string'
          ? response.data.paymentIntentId
          : undefined),
      correlationId,
      payloadJson: {
        provider,
        eventType: dto.eventType,
        status: dto.status,
      },
    });

    return response;
  }

  async handleSignaturesCallback(dto: SignatureCallbackDto, correlationId: string) {
    const provider = dto.provider || 'docusign';
    const lead = dto.leadId
      ? await this.leadsRepository.findOne({ where: { leadId: dto.leadId } })
      : null;

    await this.stagingCallbacksRepository.save(
      this.stagingCallbacksRepository.create({
        provider,
        eventType: dto.eventType,
        payloadJson: dto.payload,
        correlationId,
      }),
    );

    await this.signatureEventsRepository.save(
      this.signatureEventsRepository.create({
        leadId: lead?.id || null,
        resourceType: dto.resourceType,
        envelopeId: dto.envelopeId,
        provider,
        eventType: dto.eventType,
        payloadJson: dto.payload,
        correlationId,
      }),
    );

    if (dto.resourceType === 'quote' && lead) {
      const quote = await this.quotesRepository.findOne({
        where: { leadId: lead.id },
        order: { updatedAt: 'DESC' },
      });

      if (quote) {
        quote.signatureEnvelopeId = dto.envelopeId;
        quote.signatureProvider = provider;
        quote.signatureStatus = dto.status;
        quote.quoteStatus = dto.status.toLowerCase().includes('complete')
          ? 'approved'
          : quote.quoteStatus;
        quote.version += 1;
        if (quote.quoteStatus === 'approved') {
          quote.quoteApprovedAt = new Date();
        }
        await this.quotesRepository.save(quote);
      }
    }

    if (dto.resourceType === 'contract' && lead) {
      const contract = await this.contractsRepository.findOne({
        where: { leadId: lead.id },
        order: { updatedAt: 'DESC' },
      });

      if (contract) {
        contract.signatureEnvelopeId = dto.envelopeId;
        contract.signatureProvider = provider;
        contract.signatureStatus = dto.status;
        contract.contractStatus = dto.status.toLowerCase().includes('complete')
          ? 'approved'
          : contract.contractStatus;
        contract.version += 1;
        if (contract.contractStatus === 'approved') {
          contract.contractApprovedAt = new Date();
        }
        await this.contractsRepository.save(contract);
      }
    }

    await this.auditService.log({
      actorType: 'internal',
      action: 'signature.callback',
      resourceType: dto.resourceType,
      resourceId: dto.envelopeId,
      correlationId,
      payloadJson: {
        status: dto.status,
        eventType: dto.eventType,
      },
    });

    return okResponse(
      {
        accepted: true,
        provider,
        envelopeId: dto.envelopeId,
      },
      correlationId,
    );
  }
}
