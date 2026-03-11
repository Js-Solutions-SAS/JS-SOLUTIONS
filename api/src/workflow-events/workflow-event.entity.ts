import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'workflow_events' })
export class WorkflowEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workflow_name', type: 'text' })
  workflowName!: string;

  @Column({ name: 'event_name', type: 'text' })
  eventName!: string;

  @Column({ name: 'status', type: 'text' })
  status!: 'success' | 'error' | 'warning';

  @Column({ name: 'lead_id', type: 'text', nullable: true })
  leadId!: string | null;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'correlation_id', type: 'text', nullable: true })
  correlationId!: string | null;

  @Column({ name: 'payload_json', type: 'jsonb', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
