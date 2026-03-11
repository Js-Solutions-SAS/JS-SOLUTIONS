import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'outbox_events' })
export class OutboxEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_name', type: 'text' })
  eventName!: string;

  @Column({ name: 'aggregate_type', type: 'text' })
  aggregateType!: string;

  @Column({ name: 'aggregate_id', type: 'text' })
  aggregateId!: string;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson!: Record<string, unknown>;

  @Column({ name: 'status', type: 'text', default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
