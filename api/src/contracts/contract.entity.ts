import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'contracts' })
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId!: string;

  @Column({ name: 'contract_document_id', type: 'text', unique: true })
  contractDocumentId!: string;

  @Column({ name: 'contract_url', type: 'text', nullable: true })
  contractUrl!: string | null;

  @Column({ name: 'contract_status', type: 'text', default: 'En revisión' })
  contractStatus!: string;

  @Column({
    name: 'contract_generated_at',
    type: 'timestamptz',
    nullable: true,
  })
  contractGeneratedAt!: Date | null;

  @Column({ name: 'contract_approved_at', type: 'timestamptz', nullable: true })
  contractApprovedAt!: Date | null;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'correlation_id', type: 'text', nullable: true })
  correlationId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
