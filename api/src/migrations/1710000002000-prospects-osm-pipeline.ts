import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProspectsOsmPipeline1710000002000 implements MigrationInterface {
  name = 'ProspectsOsmPipeline1710000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS prospects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source text NOT NULL DEFAULT 'osm',
        osm_id text,
        osm_type text,
        business_name text NOT NULL,
        category text,
        vertical text NOT NULL,
        address text,
        phone text,
        website text,
        email text,
        lat numeric(11, 7),
        lon numeric(11, 7),
        city text NOT NULL,
        maps_url text,
        source_query text,
        lead_score integer NOT NULL DEFAULT 0,
        recommended_offer text,
        status text NOT NULL DEFAULT 'nuevo',
        notes text,
        next_action_at date,
        opt_out boolean NOT NULL DEFAULT false,
        last_seen_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_source_ref
      ON prospects (source, osm_type, osm_id)
      WHERE osm_type IS NOT NULL AND osm_id IS NOT NULL
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_prospects_city ON prospects (city)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_prospects_vertical ON prospects (vertical)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_prospects_lead_score ON prospects (lead_score)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS prospects`);
  }
}
