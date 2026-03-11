import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'documents' })
@Index('idx_documents_project', ['projectId'])
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId!: string | null;

  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'kind', type: 'text', default: 'deliverable' })
  kind!: 'quote' | 'contract' | 'deliverable' | 'other';

  @Column({ name: 'document_type', type: 'text', default: 'link' })
  documentType!: string;

  @Column({ name: 'status', type: 'text', default: 'pending' })
  status!: string;

  @Column({ name: 'url', type: 'text' })
  url!: string;

  @Column({ name: 'size_label', type: 'text', nullable: true })
  sizeLabel!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
