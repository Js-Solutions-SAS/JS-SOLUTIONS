import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InternalAuthGuard } from './auth/internal-auth.guard';
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: InternalAuthGuard,
    },
  ],
})
export class AppModule {}
