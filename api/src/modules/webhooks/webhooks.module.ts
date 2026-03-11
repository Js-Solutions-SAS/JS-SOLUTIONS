import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContractEntity } from '../../contracts/contract.entity';
import { LeadEntity } from '../../leads/lead.entity';
import { QuoteEntity } from '../../quotes/quote.entity';
import { PaymentIntentEntity } from '../payments/payment-intent.entity';
import { PaymentsModule } from '../payments/payments.module';
import { StgProviderCallbackRawEntity } from '../shared/staging/stg-provider-callback-raw.entity';
import { SignatureEventEntity } from './signature-event.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StgProviderCallbackRawEntity,
      SignatureEventEntity,
      LeadEntity,
      QuoteEntity,
      ContractEntity,
      PaymentIntentEntity,
    ]),
    PaymentsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
