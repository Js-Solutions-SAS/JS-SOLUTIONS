import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'project_milestones' })
@Index('idx_project_milestones_project', ['projectId'])
@Index('idx_project_milestones_status', ['status'])
export class ProjectMilestoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'phase', type: 'text', nullable: true })
  phase!: string | null;

  @Column({ name: 'owner', type: 'text', nullable: true })
  owner!: string | null;

  @Column({ name: 'status', type: 'text', default: 'pending' })
  status!: string;

  @Column({ name: 'priority', type: 'text', default: 'medium' })
  priority!: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
