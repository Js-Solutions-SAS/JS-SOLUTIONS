import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'idempotency_registry' })
export class IdempotencyRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'scope', type: 'text' })
  scope!: string;

  @Column({ name: 'idempotency_key', type: 'text', unique: true })
  idempotencyKey!: string;

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @Column({ name: 'status', type: 'text', default: 'claimed' })
  status!: 'claimed' | 'completed' | 'failed';

  @Column({ name: 'response_json', type: 'jsonb', nullable: true })
  responseJson!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
