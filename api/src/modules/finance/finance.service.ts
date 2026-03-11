import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { okResponse } from '../shared/contracts/api-response';
import { FinanceEntryEntity } from './finance-entry.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceEntryEntity)
    private readonly financeRepository: Repository<FinanceEntryEntity>,
  ) {}

  async list(correlationId: string) {
    const entries = await this.financeRepository.find({
      order: { updatedAt: 'DESC' },
      take: 300,
    });

    return okResponse(
      entries.map((entry) => ({
        id: entry.id,
        projectId: entry.projectId || 'unknown-project',
        projectName: entry.projectName || 'Project',
        clientName: entry.clientName || 'Client',
        clientType: entry.clientType || 'Technology',
        industry: entry.industry || 'Technology',
        owner: entry.owner || 'Finance',
        currency: entry.currency,
        budgetAmount: Number(entry.budgetAmount || 0),
        executedAmount: Number(entry.executedAmount || 0),
        pendingBillingAmount: Number(entry.pendingBillingAmount || 0),
        invoicedAmount: Number(entry.invoicedAmount || 0),
        billingStatus: entry.billingStatus,
        updatedAt: entry.updatedAt.toISOString(),
        version: entry.version,
      })),
      correlationId,
    );
  }
}
