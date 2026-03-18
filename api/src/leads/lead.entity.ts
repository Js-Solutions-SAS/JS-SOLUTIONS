import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LEAD_STATUS } from './lead-status';

@Entity({ name: 'leads' })
export class LeadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'text', unique: true })
  leadId!: string;

  @Column({ name: 'brief_token', type: 'text', unique: true, nullable: true })
  briefToken!: string | null;

  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'company', type: 'text' })
  company!: string;

  @Column({ name: 'email', type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'phone', type: 'text', nullable: true })
  phone!: string | null;

  @Column({ name: 'service', type: 'text', nullable: true })
  service!: string | null;

  @Column({ name: 'source', type: 'text', nullable: true })
  source!: string | null;

  @Column({ name: 'utm_json', type: 'jsonb', nullable: true })
  utmJson!: Record<string, unknown> | null;

  @Column({ name: 'landing_path', type: 'text', nullable: true })
  landingPath!: string | null;

  @Column({ name: 'referrer', type: 'text', nullable: true })
  referrer!: string | null;

  @Column({
    name: 'status',
    type: 'text',
    default: LEAD_STATUS.DIAGNOSTIC_CAPTURED,
  })
  status!: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
