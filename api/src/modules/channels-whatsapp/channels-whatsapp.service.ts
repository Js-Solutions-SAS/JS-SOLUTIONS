import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from '../shared/audit/audit.service';
import { okResponse } from '../shared/contracts/api-response';
import { IdempotencyService } from '../shared/idempotency/idempotency.service';
import { StgWhatsappInboundEventEntity } from '../shared/staging/stg-whatsapp-inbound-event.entity';
import { ConversationMessageEntity } from './conversation-message.entity';
import { ConversationSandboxEntity } from './conversation-sandbox.entity';
import { WhatsappInboundEventDto } from './dto/whatsapp-inbound-event.dto';

@Injectable()
export class ChannelsWhatsappService {
  constructor(
    @InjectRepository(ConversationSandboxEntity)
    private readonly conversationSandboxesRepository: Repository<ConversationSandboxEntity>,
    @InjectRepository(ConversationMessageEntity)
    private readonly conversationMessagesRepository: Repository<ConversationMessageEntity>,
    @InjectRepository(StgWhatsappInboundEventEntity)
    private readonly stagingRepository: Repository<StgWhatsappInboundEventEntity>,
    private readonly idempotencyService: IdempotencyService,
    private readonly auditService: AuditService,
  ) {}

  async ingestInboundEvent(
    dto: WhatsappInboundEventDto,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const claim = await this.idempotencyService.claim({
      scope: 'whatsapp-inbound-event',
      idempotencyKey,
      correlationId,
    });

    if (claim.alreadyClaimed && claim.record.responseJson) {
      return okResponse(claim.record.responseJson, correlationId);
    }

    await this.stagingRepository.save(
      this.stagingRepository.create({
        provider: dto.provider,
        externalChatId: dto.externalChatId,
        externalMessageId: dto.externalMessageId || null,
        messageType: dto.messageType,
        payloadJson: dto.payload,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
        correlationId,
        idempotencyKey,
      }),
    );

    let sandbox = await this.conversationSandboxesRepository.findOne({
      where: {
        provider: dto.provider,
        externalChatId: dto.externalChatId,
      },
    });

    if (!sandbox) {
      sandbox = await this.conversationSandboxesRepository.save(
        this.conversationSandboxesRepository.create({
          provider: dto.provider,
          externalChatId: dto.externalChatId,
          externalContactId: dto.externalContactId || null,
          status: 'active',
          metadataJson: {
            source: 'n8n-ingress',
          },
          lastMessageAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        }),
      );
    } else {
      sandbox.lastMessageAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
      sandbox.version += 1;
      await this.conversationSandboxesRepository.save(sandbox);
    }

    const message = await this.conversationMessagesRepository.save(
      this.conversationMessagesRepository.create({
        sandboxId: sandbox.id,
        provider: dto.provider,
        direction: 'inbound',
        messageType: dto.messageType,
        externalMessageId: dto.externalMessageId || null,
        contentText: dto.text || null,
        payloadJson: dto.payload,
        correlationId,
        idempotencyKey,
      }),
    );

    await this.auditService.log({
      actorType: 'internal',
      action: 'whatsapp.inbound_event',
      resourceType: 'conversation_message',
      resourceId: message.id,
      correlationId,
      idempotencyKey,
      payloadJson: {
        sandboxId: sandbox.id,
        provider: dto.provider,
      },
    });

    const responsePayload = {
      sandboxId: sandbox.id,
      messageId: message.id,
      status: 'accepted',
      version: sandbox.version,
    };

    await this.idempotencyService.complete(claim.record.id, responsePayload);

    return okResponse(responsePayload, correlationId, sandbox.version);
  }
}
