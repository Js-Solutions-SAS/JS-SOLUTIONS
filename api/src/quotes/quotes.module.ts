import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { N8nClientService } from '../common/n8n-client.service';
import { ContractEntity } from '../contracts/contract.entity';
import { LeadEntity } from '../leads/lead.entity';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
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
  controllers: [QuotesController],
  providers: [QuotesService, N8nClientService],
  exports: [QuotesService],
})
export class QuotesModule {}
