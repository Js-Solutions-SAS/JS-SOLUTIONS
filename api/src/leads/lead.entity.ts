import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ name: 'service', type: 'text', nullable: true })
  service!: string | null;

  @Column({ name: 'status', type: 'text', default: 'Diagnóstico Capturado' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
