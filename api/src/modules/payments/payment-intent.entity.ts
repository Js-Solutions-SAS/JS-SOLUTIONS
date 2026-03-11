import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'payment_intents' })
@Index('idx_payment_intents_lead', ['leadId'])
@Index('idx_payment_intents_status', ['status'])
export class PaymentIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId!: string | null;

  @Column({ name: 'provider', type: 'text', default: 'bancolombia' })
  provider!: string;

  @Column({ name: 'payment_method', type: 'text', default: 'bancolombia_button' })
  paymentMethod!: string;

  @Column({ name: 'amount_cop', type: 'numeric', precision: 14, scale: 2, nullable: true })
  amountCop!: string | null;

  @Column({ name: 'currency', type: 'text', default: 'COP' })
  currency!: string;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl!: string | null;

  @Column({ name: 'provider_reference', type: 'text', unique: true, nullable: true })
  providerReference!: string | null;

  @Column({ name: 'status', type: 'text', default: 'pending' })
  status!: string;

  @Column({ name: 'idempotency_key', type: 'text', unique: true })
  idempotencyKey!: string;

  @Column({ name: 'correlation_id', type: 'text' })
  correlationId!: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
