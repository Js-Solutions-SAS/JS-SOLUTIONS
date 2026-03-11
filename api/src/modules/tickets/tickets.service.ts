import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { okResponse } from '../shared/contracts/api-response';
import { TicketEntity } from './ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
  ) {}

  async list(correlationId: string) {
    const items = await this.ticketsRepository.find({
      order: { updatedAt: 'DESC' },
      take: 300,
    });

    return okResponse(
      items.map((item) => ({
        id: item.id,
        ticketId: item.ticketId,
        projectId: item.projectId || 'unknown-project',
        projectName: item.projectName || 'Project',
        clientName: item.clientName || 'Client',
        clientType: item.clientType || 'Technology',
        industry: item.industry || 'Technology',
        owner: item.owner || 'Support',
        priority: item.priority,
        channel: item.channel,
        status: item.status,
        summary: item.summary,
        createdAt: item.createdAt.toISOString(),
        firstResponseAt: item.firstResponseAt?.toISOString() || undefined,
        resolvedAt: item.resolvedAt?.toISOString() || undefined,
        targetResponseHours: item.targetResponseHours,
        targetResolutionHours: item.targetResolutionHours,
        externalUrl: item.externalUrl || undefined,
        version: item.version,
      })),
      correlationId,
    );
  }
}
