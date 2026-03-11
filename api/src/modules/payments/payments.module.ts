import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { N8nClientService } from '../../common/n8n-client.service';
import { LeadEntity } from '../../leads/lead.entity';
import { ProjectEntity } from '../projects/project.entity';
import { PaymentEventEntity } from './payment-event.entity';
import { PaymentIntentEntity } from './payment-intent.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      LeadEntity,
      PaymentIntentEntity,
      PaymentEventEntity,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, N8nClientService],
  exports: [TypeOrmModule, PaymentsService],
})
export class PaymentsModule {}
