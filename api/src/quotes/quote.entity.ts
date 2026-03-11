import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'quotes' })
export class QuoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId!: string;

  @Column({ name: 'quote_document_id', type: 'text', unique: true })
  quoteDocumentId!: string;

  @Column({ name: 'quote_pdf_url', type: 'text', nullable: true })
  quotePdfUrl!: string | null;

  @Column({ name: 'quote_status', type: 'text', default: 'En revisión' })
  quoteStatus!: string;

  @Column({ name: 'quote_feedback', type: 'text', nullable: true })
  quoteFeedback!: string | null;

  @Column({ name: 'quote_generated_at', type: 'timestamptz', nullable: true })
  quoteGeneratedAt!: Date | null;

  @Column({ name: 'quote_approved_at', type: 'timestamptz', nullable: true })
  quoteApprovedAt!: Date | null;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'correlation_id', type: 'text', nullable: true })
  correlationId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
