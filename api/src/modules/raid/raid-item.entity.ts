import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'raid_items' })
@Index('idx_raid_items_project', ['projectId'])
@Index('idx_raid_items_status', ['status'])
export class RaidItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ name: 'project_name', type: 'text', nullable: true })
  projectName!: string | null;

  @Column({ name: 'client_name', type: 'text', nullable: true })
  clientName!: string | null;

  @Column({ name: 'industry', type: 'text', nullable: true })
  industry!: string | null;

  @Column({ name: 'owner', type: 'text', nullable: true })
  owner!: string | null;

  @Column({ name: 'type', type: 'text', default: 'Risk' })
  type!: 'Risk' | 'Assumption' | 'Issue' | 'Dependency';

  @Column({ name: 'status', type: 'text', default: 'Open' })
  status!: string;

  @Column({ name: 'priority', type: 'text', default: 'Medium' })
  priority!: string;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'detail', type: 'text', nullable: true })
  detail!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({ name: 'mitigation', type: 'text', nullable: true })
  mitigation!: string | null;

  @Column({ name: 'dependency_on', type: 'text', nullable: true })
  dependencyOn!: string | null;

  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl!: string | null;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
