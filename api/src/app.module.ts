import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InternalAuthGuard } from './auth/internal-auth.guard';
import { BriefsModule } from './modules/briefs/briefs.module';
import { ChannelsWhatsappModule } from './modules/channels-whatsapp/channels-whatsapp.module';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RaidModule } from './modules/raid/raid.module';
import { SharedModule } from './modules/shared/shared.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { buildTypeOrmOptions } from './config/database.config';
import { ContractsModule } from './contracts/contracts.module';
import { HealthModule } from './health/health.module';
import { LeadsModule } from './leads/leads.module';
import { QuotesModule } from './quotes/quotes.module';
import { WorkflowEventsModule } from './workflow-events/workflow-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildTypeOrmOptions(configService),
    }),
    HealthModule,
    LeadsModule,
    QuotesModule,
    ContractsModule,
    WorkflowEventsModule,
    SharedModule,
    BriefsModule,
    ProjectsModule,
    ApprovalsModule,
    ChangeRequestsModule,
    TicketsModule,
    FinanceModule,
    PaymentsModule,
    DocumentsModule,
    ChannelsWhatsappModule,
    WebhooksModule,
    RaidModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: InternalAuthGuard,
    },
  ],
})
export class AppModule {}
