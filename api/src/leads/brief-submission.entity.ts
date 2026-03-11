import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'brief_submissions' })
export class BriefSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId!: string;

  @Column({ name: 'brief_token', type: 'text' })
  briefToken!: string;

  @Column({ name: 'answers_json', type: 'jsonb' })
  answersJson!: Record<string, unknown>;

  @Column({ name: 'idempotency_key', type: 'text', unique: true })
  idempotencyKey!: string;

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;
}
