import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { okResponse } from '../shared/contracts/api-response';
import { RaidItemEntity } from './raid-item.entity';

@Injectable()
export class RaidService {
  constructor(
    @InjectRepository(RaidItemEntity)
    private readonly raidRepository: Repository<RaidItemEntity>,
  ) {}

  async list(correlationId: string) {
    const items = await this.raidRepository.find({
      order: { updatedAt: 'DESC' },
      take: 300,
    });

    return okResponse(
      items.map((item) => ({
        id: item.id,
        projectId: item.projectId || 'unknown-project',
        projectName: item.projectName || 'Project',
        clientName: item.clientName || 'Client',
        industry: item.industry || 'Technology',
        owner: item.owner || 'PMO',
        type: item.type,
        status: item.status,
        priority: item.priority,
        title: item.title,
        detail: item.detail || '',
        dueDate: item.dueDate || undefined,
        mitigation: item.mitigation || undefined,
        dependencyOn: item.dependencyOn || undefined,
        externalUrl: item.externalUrl || undefined,
        version: item.version,
      })),
      correlationId,
    );
  }
}
