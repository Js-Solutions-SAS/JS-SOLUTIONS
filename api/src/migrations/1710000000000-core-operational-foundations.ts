import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoreOperationalFoundations1710000000000
  implements MigrationInterface
{
  name = 'CoreOperationalFoundations1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Bootstrap legacy core tables when the database is empty.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id TEXT NOT NULL UNIQUE,
        brief_token TEXT UNIQUE,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        email TEXT,
        service TEXT,
        status TEXT NOT NULL DEFAULT 'diagnostic_captured',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS brief_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        brief_token TEXT NOT NULL,
        answers_json JSONB NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        correlation_id TEXT NOT NULL,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        quote_document_id TEXT NOT NULL UNIQUE,
        quote_pdf_url TEXT,
        quote_status TEXT NOT NULL DEFAULT 'in_review',
        quote_feedback TEXT,
        quote_generated_at TIMESTAMPTZ,
        quote_approved_at TIMESTAMPTZ,
        idempotency_key TEXT,
        correlation_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        contract_document_id TEXT NOT NULL UNIQUE,
        contract_url TEXT,
        contract_status TEXT NOT NULL DEFAULT 'in_review',
        contract_generated_at TIMESTAMPTZ,
        contract_approved_at TIMESTAMPTZ,
        idempotency_key TEXT,
        correlation_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS signature_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        resource_type TEXT NOT NULL CHECK (resource_type IN ('quote', 'contract')),
        envelope_id TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'docusign',
        event_type TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        correlation_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'bancolombia',
        payment_method TEXT NOT NULL DEFAULT 'bancolombia_button',
        amount_cop NUMERIC(14, 2),
        checkout_url TEXT,
        provider_reference TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        idempotency_key TEXT NOT NULL UNIQUE,
        correlation_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
        provider TEXT NOT NULL DEFAULT 'bancolombia',
        provider_reference TEXT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        correlation_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflow_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_name TEXT NOT NULL,
        event_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
        lead_id TEXT,
        idempotency_key TEXT,
        correlation_id TEXT,
        payload_json JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signature_envelope_id TEXT;
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signature_provider TEXT;
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS signature_status TEXT;
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_envelope_id TEXT;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_provider TEXT;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_status TEXT;
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
      ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS project_id UUID;
      ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'COP';
      ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_code TEXT NOT NULL UNIQUE,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        client_token TEXT UNIQUE,
        name TEXT NOT NULL,
        service_type TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        current_phase TEXT NOT NULL DEFAULT 'discovery',
        progress_percentage INT NOT NULL DEFAULT 0,
        drive_folder_url TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        phase TEXT,
        owner TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date DATE,
        external_url TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        client_token TEXT,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        resource_name TEXT,
        stage TEXT NOT NULL DEFAULT 'Scope',
        status TEXT NOT NULL DEFAULT 'Pending',
        requested_by TEXT,
        requested_at TIMESTAMPTZ,
        due_date DATE,
        decision_by TEXT,
        decision_at TIMESTAMPTZ,
        decision_reason TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS change_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        request_type TEXT NOT NULL DEFAULT 'Scope',
        status TEXT NOT NULL DEFAULT 'Pending Review',
        requested_at TIMESTAMPTZ,
        baseline_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
        proposed_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
        baseline_due_date DATE,
        proposed_due_date DATE,
        owner TEXT,
        industry TEXT,
        client_name TEXT,
        project_name TEXT,
        decision_reason TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id TEXT NOT NULL UNIQUE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        project_name TEXT,
        client_name TEXT,
        client_type TEXT,
        industry TEXT,
        owner TEXT,
        priority TEXT NOT NULL DEFAULT 'Medium',
        channel TEXT NOT NULL DEFAULT 'whatsapp',
        status TEXT NOT NULL DEFAULT 'Open',
        summary TEXT NOT NULL,
        target_response_hours INT NOT NULL DEFAULT 4,
        target_resolution_hours INT NOT NULL DEFAULT 24,
        first_response_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        external_url TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS finance_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        project_name TEXT,
        client_name TEXT,
        client_type TEXT,
        industry TEXT,
        owner TEXT,
        currency TEXT NOT NULL DEFAULT 'COP',
        budget_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        executed_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        pending_billing_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        invoiced_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        billing_status TEXT NOT NULL DEFAULT 'Pending Billing',
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'deliverable',
        document_type TEXT NOT NULL DEFAULT 'link',
        status TEXT NOT NULL DEFAULT 'pending',
        url TEXT NOT NULL,
        size_label TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversation_sandboxes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider TEXT NOT NULL,
        external_chat_id TEXT NOT NULL,
        external_contact_id TEXT,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active',
        metadata_json JSONB,
        last_message_at TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(provider, external_chat_id)
      );

      CREATE TABLE IF NOT EXISTS conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sandbox_id UUID NOT NULL REFERENCES conversation_sandboxes(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        direction TEXT NOT NULL DEFAULT 'inbound',
        message_type TEXT NOT NULL DEFAULT 'text',
        external_message_id TEXT,
        content_text TEXT,
        payload_json JSONB,
        correlation_id TEXT NOT NULL,
        idempotency_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_type TEXT NOT NULL,
        actor_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        correlation_id TEXT NOT NULL,
        idempotency_key TEXT,
        payload_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS idempotency_registry (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        correlation_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'claimed',
        response_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS outbox_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_name TEXT NOT NULL,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        correlation_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stg_whatsapp_inbound_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider TEXT NOT NULL,
        external_chat_id TEXT NOT NULL,
        external_message_id TEXT,
        message_type TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        occurred_at TIMESTAMPTZ,
        correlation_id TEXT NOT NULL,
        idempotency_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stg_admin_feed_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_name TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        correlation_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stg_provider_callbacks_raw (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        correlation_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS raid_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        project_name TEXT,
        client_name TEXT,
        industry TEXT,
        owner TEXT,
        type TEXT NOT NULL DEFAULT 'Risk',
        status TEXT NOT NULL DEFAULT 'Open',
        priority TEXT NOT NULL DEFAULT 'Medium',
        title TEXT NOT NULL,
        detail TEXT,
        due_date DATE,
        mitigation TEXT,
        dependency_on TEXT,
        external_url TEXT,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_client_token ON projects(client_token);
      CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
      CREATE INDEX IF NOT EXISTS idx_approvals_project ON approvals(project_id);
      CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
      CREATE INDEX IF NOT EXISTS idx_approvals_resource ON approvals(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_change_requests_project ON change_requests(project_id);
      CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_project ON finance_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_messages_sandbox ON conversation_messages(sandbox_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_messages_external ON conversation_messages(external_message_id);
      CREATE INDEX IF NOT EXISTS idx_idempotency_registry_scope ON idempotency_registry(scope, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_stg_whatsapp_inbound_events_created ON stg_whatsapp_inbound_events(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_stg_provider_callbacks_raw_created ON stg_provider_callbacks_raw(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_raid_items_project ON raid_items(project_id);
      CREATE INDEX IF NOT EXISTS idx_raid_items_status ON raid_items(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS raid_items;
      DROP TABLE IF EXISTS stg_provider_callbacks_raw;
      DROP TABLE IF EXISTS stg_admin_feed_snapshots;
      DROP TABLE IF EXISTS stg_whatsapp_inbound_events;
      DROP TABLE IF EXISTS outbox_events;
      DROP TABLE IF EXISTS idempotency_registry;
      DROP TABLE IF EXISTS audit_events;
      DROP TABLE IF EXISTS conversation_messages;
      DROP TABLE IF EXISTS conversation_sandboxes;
      DROP TABLE IF EXISTS documents;
      DROP TABLE IF EXISTS finance_entries;
      DROP TABLE IF EXISTS tickets;
      DROP TABLE IF EXISTS change_requests;
      DROP TABLE IF EXISTS approvals;
      DROP TABLE IF EXISTS project_milestones;
      DROP TABLE IF EXISTS projects;
    `);
  }
}
