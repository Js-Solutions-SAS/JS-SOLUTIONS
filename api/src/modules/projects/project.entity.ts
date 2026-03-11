import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'projects' })
@Index('idx_projects_client_token', ['clientToken'])
@Index('idx_projects_status', ['status'])
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_code', type: 'text', unique: true })
  projectCode!: string;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId!: string | null;

  @Column({ name: 'client_token', type: 'text', unique: true, nullable: true })
  clientToken!: string | null;

  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'service_type', type: 'text', nullable: true })
  serviceType!: string | null;

  @Column({ name: 'status', type: 'text', default: 'active' })
  status!: string;

  @Column({ name: 'current_phase', type: 'text', default: 'discovery' })
  currentPhase!: string;

  @Column({ name: 'progress_percentage', type: 'int', default: 0 })
  progressPercentage!: number;

  @Column({ name: 'drive_folder_url', type: 'text', nullable: true })
  driveFolderUrl!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
