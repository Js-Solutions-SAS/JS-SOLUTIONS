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

  @Column({ name: 'contract_status', type: 'text', default: 'in_review' })
  contractStatus!: string;

  @Column({
    name: 'contract_generated_at',
    type: 'timestamptz',
    nullable: true,
  })
  contractGeneratedAt!: Date | null;

  @Column({ name: 'contract_approved_at', type: 'timestamptz', nullable: true })
  contractApprovedAt!: Date | null;

  @Column({ name: 'signature_envelope_id', type: 'text', nullable: true })
  signatureEnvelopeId!: string | null;

  @Column({ name: 'signature_provider', type: 'text', nullable: true })
  signatureProvider!: string | null;

  @Column({ name: 'signature_status', type: 'text', nullable: true })
  signatureStatus!: string | null;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'correlation_id', type: 'text', nullable: true })
  correlationId!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
