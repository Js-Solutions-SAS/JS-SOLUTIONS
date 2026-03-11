import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_events' })
export class AuditEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_type', type: 'text' })
  actorType!: 'system' | 'public' | 'client' | 'admin' | 'internal';

  @Column({ name: 'actor_id', type: 'text', nullable: true })
  actorId!: string | null;

  @Column({ name: 'action', type: 'text' })
  action!: string;

  @Column({ name: 'resource_type', type: 'text' })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'text', nullable: true })
  resourceId!: string | null;

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'payload_json', type: 'jsonb', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
