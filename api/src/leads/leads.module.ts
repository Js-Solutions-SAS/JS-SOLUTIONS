import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PublicRateLimitGuard } from '../auth/public-rate-limit.guard';
import { MetaConversionsApiService } from '../common/meta-conversions-api.service';
import { N8nClientService } from '../common/n8n-client.service';
import { WorkflowEventEntity } from '../workflow-events/workflow-event.entity';
import { LeadEntity } from './lead.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([LeadEntity, WorkflowEventEntity])],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    N8nClientService,
    PublicRateLimitGuard,
    MetaConversionsApiService,
  ],
  exports: [LeadsService],
})
export class LeadsModule {}
