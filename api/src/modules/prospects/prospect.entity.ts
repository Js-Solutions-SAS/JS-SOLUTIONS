import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'prospects' })
@Index('idx_prospects_city', ['city'])
@Index('idx_prospects_vertical', ['vertical'])
@Index('idx_prospects_status', ['status'])
@Index('idx_prospects_lead_score', ['leadScore'])
@Index('idx_prospects_source_ref', ['source', 'osmType', 'osmId'], {
  unique: true,
})
export class ProspectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'source', type: 'text', default: 'osm' })
  source!: 'osm' | 'google' | 'manual';

  @Column({ name: 'osm_id', type: 'text', nullable: true })
  osmId!: string | null;

  @Column({ name: 'osm_type', type: 'text', nullable: true })
  osmType!: string | null;

  @Column({ name: 'business_name', type: 'text' })
  businessName!: string;

  @Column({ name: 'category', type: 'text', nullable: true })
  category!: string | null;

  @Column({ name: 'vertical', type: 'text' })
  vertical!: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'phone', type: 'text', nullable: true })
  phone!: string | null;

  @Column({ name: 'website', type: 'text', nullable: true })
  website!: string | null;

  @Column({ name: 'email', type: 'text', nullable: true })
  email!: string | null;

  @Column({
    name: 'lat',
    type: 'numeric',
    precision: 11,
    scale: 7,
    nullable: true,
  })
  lat!: string | null;

  @Column({
    name: 'lon',
    type: 'numeric',
    precision: 11,
    scale: 7,
    nullable: true,
  })
  lon!: string | null;

  @Column({ name: 'city', type: 'text' })
  city!: string;

  @Column({ name: 'maps_url', type: 'text', nullable: true })
  mapsUrl!: string | null;

  @Column({ name: 'source_query', type: 'text', nullable: true })
  sourceQuery!: string | null;

  @Column({ name: 'lead_score', type: 'int', default: 0 })
  leadScore!: number;

  @Column({ name: 'recommended_offer', type: 'text', nullable: true })
  recommendedOffer!: string | null;

  @Column({ name: 'status', type: 'text', default: 'nuevo' })
  status!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'next_action_at', type: 'date', nullable: true })
  nextActionAt!: string | null;

  @Column({ name: 'opt_out', type: 'boolean', default: false })
  optOut!: boolean;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
