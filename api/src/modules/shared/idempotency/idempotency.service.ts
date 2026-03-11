import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { IdempotencyRegistryEntity } from './idempotency-registry.entity';

interface ClaimInput {
  scope: string;
  idempotencyKey: string;
  correlationId: string;
}

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyRegistryEntity)
    private readonly idempotencyRepository: Repository<IdempotencyRegistryEntity>,
  ) {}

  async claim(input: ClaimInput): Promise<{
    alreadyClaimed: boolean;
    record: IdempotencyRegistryEntity;
  }> {
    try {
      const record = await this.idempotencyRepository.save(
        this.idempotencyRepository.create({
          scope: input.scope,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.correlationId,
          status: 'claimed',
        }),
      );

      return {
        alreadyClaimed: false,
        record,
      };
    } catch (error) {
      const queryError = error as QueryFailedError & { code?: string };
      if (
        queryError instanceof QueryFailedError &&
        typeof queryError.code === 'string' &&
        queryError.code === '23505'
      ) {
        const existing = await this.idempotencyRepository.findOne({
          where: { idempotencyKey: input.idempotencyKey },
        });

        if (existing) {
          return {
            alreadyClaimed: true,
            record: existing,
          };
        }
      }

      throw error;
    }
  }

  async complete(
    recordId: string,
    responseJson?: Record<string, unknown>,
  ): Promise<void> {
    const record = await this.idempotencyRepository.findOne({
      where: { id: recordId },
    });
    if (!record) return;

    record.status = 'completed';
    record.responseJson = responseJson || null;
    await this.idempotencyRepository.save(record);
  }

  async fail(recordId: string, responseJson?: Record<string, unknown>) {
    const record = await this.idempotencyRepository.findOne({
      where: { id: recordId },
    });
    if (!record) return;

    record.status = 'failed';
    record.responseJson = responseJson || null;
    await this.idempotencyRepository.save(record);
  }
}
