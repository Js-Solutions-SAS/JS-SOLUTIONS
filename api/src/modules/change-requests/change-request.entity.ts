import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'change_requests' })
@Index('idx_change_requests_project', ['projectId'])
@Index('idx_change_requests_status', ['status'])
export class ChangeRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'request_type', type: 'text', default: 'Scope' })
  requestType!: string;

  @Column({ name: 'status', type: 'text', default: 'Pending Review' })
  status!:
    | 'Pending Review'
    | 'Approved'
    | 'Rejected'
    | 'In Progress'
    | 'Implemented';

  @Column({ name: 'requested_at', type: 'timestamptz', nullable: true })
  requestedAt!: Date | null;

  @Column({ name: 'baseline_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  baselineCost!: string;

  @Column({ name: 'proposed_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  proposedCost!: string;

  @Column({ name: 'baseline_due_date', type: 'date', nullable: true })
  baselineDueDate!: string | null;

  @Column({ name: 'proposed_due_date', type: 'date', nullable: true })
  proposedDueDate!: string | null;

  @Column({ name: 'owner', type: 'text', nullable: true })
  owner!: string | null;

  @Column({ name: 'industry', type: 'text', nullable: true })
  industry!: string | null;

  @Column({ name: 'client_name', type: 'text', nullable: true })
  clientName!: string | null;

  @Column({ name: 'project_name', type: 'text', nullable: true })
  projectName!: string | null;

  @Column({ name: 'decision_reason', type: 'text', nullable: true })
  decisionReason!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
