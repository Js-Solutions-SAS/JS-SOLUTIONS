import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PublicRateLimitGuard } from '../auth/public-rate-limit.guard';
import { N8nClientService } from '../common/n8n-client.service';
import { ContractEntity } from '../contracts/contract.entity';
import { LeadEntity } from '../leads/lead.entity';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
import { PublicQuotesController } from './public-quotes.controller';
import { QuoteEntity } from './quote.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadEntity,
      QuoteEntity,
      ContractEntity,
      WorkflowEventEntity,
    ]),
  ],
  controllers: [QuotesController, PublicQuotesController],
  providers: [QuotesService, N8nClientService, PublicRateLimitGuard],
  exports: [QuotesService],
})
export class QuotesModule {}
