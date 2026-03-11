import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'finance_entries' })
@Index('idx_finance_entries_project', ['projectId'])
export class FinanceEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'project_name', type: 'text', nullable: true })
  projectName!: string | null;

  @Column({ name: 'client_name', type: 'text', nullable: true })
  clientName!: string | null;

  @Column({ name: 'client_type', type: 'text', nullable: true })
  clientType!: string | null;

  @Column({ name: 'industry', type: 'text', nullable: true })
  industry!: string | null;

  @Column({ name: 'owner', type: 'text', nullable: true })
  owner!: string | null;

  @Column({ name: 'currency', type: 'text', default: 'COP' })
  currency!: 'COP';

  @Column({ name: 'budget_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  budgetAmount!: string;

  @Column({ name: 'executed_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  executedAmount!: string;

  @Column({ name: 'pending_billing_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  pendingBillingAmount!: string;

  @Column({ name: 'invoiced_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  invoicedAmount!: string;

  @Column({ name: 'billing_status', type: 'text', default: 'Pending Billing' })
  billingStatus!: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
