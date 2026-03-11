import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tickets' })
@Index('idx_tickets_project', ['projectId'])
@Index('idx_tickets_status', ['status'])
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_id', type: 'text', unique: true })
  ticketId!: string;

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

  @Column({ name: 'priority', type: 'text', default: 'Medium' })
  priority!: string;

  @Column({ name: 'channel', type: 'text', default: 'whatsapp' })
  channel!: string;

  @Column({ name: 'status', type: 'text', default: 'Open' })
  status!: string;

  @Column({ name: 'summary', type: 'text' })
  summary!: string;

  @Column({ name: 'target_response_hours', type: 'int', default: 4 })
  targetResponseHours!: number;

  @Column({ name: 'target_resolution_hours', type: 'int', default: 24 })
  targetResolutionHours!: number;

  @Column({ name: 'first_response_at', type: 'timestamptz', nullable: true })
  firstResponseAt!: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
