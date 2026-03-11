import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditEventEntity } from './audit/audit-event.entity';
import { AuditService } from './audit/audit.service';
import { IdempotencyRegistryEntity } from './idempotency/idempotency-registry.entity';
import { IdempotencyService } from './idempotency/idempotency.service';
import { OutboxEventEntity } from './staging/outbox-event.entity';
import { StgAdminFeedSnapshotEntity } from './staging/stg-admin-feed-snapshot.entity';
import { StgProviderCallbackRawEntity } from './staging/stg-provider-callback-raw.entity';
import { StgWhatsappInboundEventEntity } from './staging/stg-whatsapp-inbound-event.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdempotencyRegistryEntity,
      AuditEventEntity,
      OutboxEventEntity,
      StgWhatsappInboundEventEntity,
      StgAdminFeedSnapshotEntity,
      StgProviderCallbackRawEntity,
    ]),
  ],
  providers: [IdempotencyService, AuditService],
  exports: [
    TypeOrmModule,
    IdempotencyService,
    AuditService,
  ],
})
export class SharedModule {}
