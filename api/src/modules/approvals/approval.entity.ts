import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'approvals' })
@Index('idx_approvals_project', ['projectId'])
@Index('idx_approvals_status', ['status'])
@Index('idx_approvals_resource', ['resourceType', 'resourceId'])
export class ApprovalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'client_token', type: 'text', nullable: true })
  clientToken!: string | null;

  @Column({ name: 'resource_type', type: 'text' })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'text' })
  resourceId!: string;

  @Column({ name: 'resource_name', type: 'text', nullable: true })
  resourceName!: string | null;

  @Column({ name: 'stage', type: 'text', default: 'Scope' })
  stage!: string;

  @Column({ name: 'status', type: 'text', default: 'Pending' })
  status!: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Blocked';

  @Column({ name: 'requested_by', type: 'text', nullable: true })
  requestedBy!: string | null;

  @Column({ name: 'requested_at', type: 'timestamptz', nullable: true })
  requestedAt!: Date | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'decision_by', type: 'text', nullable: true })
  decisionBy!: string | null;

  @Column({ name: 'decision_at', type: 'timestamptz', nullable: true })
  decisionAt!: Date | null;

  @Column({ name: 'decision_reason', type: 'text', nullable: true })
  decisionReason!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
