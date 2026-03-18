import { MigrationInterface, QueryRunner } from 'typeorm';

export class LeadMarketingMetadataAndStatusNormalization1710000001000
  implements MigrationInterface
{
  name = 'LeadMarketingMetadataAndStatusNormalization1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS source TEXT;
      ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS utm_json JSONB;
      ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS landing_path TEXT;
      ALTER TABLE IF EXISTS leads ADD COLUMN IF NOT EXISTS referrer TEXT;
      ALTER TABLE IF EXISTS leads ALTER COLUMN status SET DEFAULT 'diagnostic_captured';
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.leads') IS NOT NULL THEN
          UPDATE leads
          SET status = CASE
            WHEN LOWER(TRIM(status)) IN ('diagnóstico capturado', 'diagnostico capturado', 'diagnostic_captured') THEN 'diagnostic_captured'
            WHEN LOWER(TRIM(status)) IN ('brief enviado', 'brief_requested', 'brief_sent') THEN 'brief_requested'
            WHEN LOWER(TRIM(status)) IN ('brief completado', 'brief_submitted', 'brief_completed') THEN 'brief_submitted'
            WHEN LOWER(TRIM(status)) IN ('cotización en revisión', 'cotizacion en revision', 'quote_in_review', 'in_review') THEN 'quote_in_review'
            WHEN LOWER(TRIM(status)) IN ('firmado', 'signed', 'approved', 'quote_signed') THEN 'quote_signed'
            WHEN LOWER(TRIM(status)) IN ('contrato enviado', 'contract_sent', 'contracted') THEN 'contract_sent'
            WHEN LOWER(TRIM(status)) IN ('contract_signed') THEN 'contract_signed'
            ELSE status
          END;
        END IF;

        IF to_regclass('public.quotes') IS NOT NULL THEN
          UPDATE quotes
          SET quote_status = CASE
            WHEN LOWER(TRIM(quote_status)) IN ('en revisión', 'en revision', 'quote_in_review') THEN 'in_review'
            WHEN LOWER(TRIM(quote_status)) IN ('firmado', 'signed', 'approved') THEN 'signed'
            ELSE quote_status
          END;
        END IF;

        IF to_regclass('public.contracts') IS NOT NULL THEN
          UPDATE contracts
          SET contract_status = CASE
            WHEN LOWER(TRIM(contract_status)) IN ('en revisión', 'en revision', 'contract_in_review') THEN 'in_review'
            WHEN LOWER(TRIM(contract_status)) IN ('firmado', 'signed', 'approved') THEN 'signed'
            ELSE contract_status
          END;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_company_email ON leads(company, email);
      CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_leads_source;
      DROP INDEX IF EXISTS idx_leads_company_email;
      DROP INDEX IF EXISTS idx_leads_status;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS leads DROP COLUMN IF EXISTS referrer;
      ALTER TABLE IF EXISTS leads DROP COLUMN IF EXISTS landing_path;
      ALTER TABLE IF EXISTS leads DROP COLUMN IF EXISTS utm_json;
      ALTER TABLE IF EXISTS leads DROP COLUMN IF EXISTS source;
      ALTER TABLE IF EXISTS leads DROP COLUMN IF EXISTS phone;
      ALTER TABLE IF EXISTS leads ALTER COLUMN status SET DEFAULT 'diagnostic_captured';
    `);
  }
}

