import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { N8nClientService } from '../common/n8n-client.service';
import { LeadEntity } from '../leads/lead.entity';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
import { ContractEntity } from './contract.entity';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEntity, ContractEntity, WorkflowEventEntity]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService, N8nClientService],
  exports: [ContractsService],
})
export class ContractsModule {}
