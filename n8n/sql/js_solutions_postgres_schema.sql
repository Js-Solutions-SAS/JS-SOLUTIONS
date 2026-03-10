-- JS Solutions - Operational source of truth (PostgreSQL VPS)
-- Run with a privileged role in your Postgres instance.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL UNIQUE,
  brief_token TEXT UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  service TEXT,
  status TEXT NOT NULL DEFAULT 'Diagnóstico Capturado',
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
  quote_status TEXT NOT NULL DEFAULT 'En revisión',
  quote_feedback TEXT,
  quote_generated_at TIMESTAMPTZ,
  quote_approved_at TIMESTAMPTZ,
  signature_envelope_id TEXT,
  signature_provider TEXT,
  signature_status TEXT,
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
  contract_status TEXT NOT NULL DEFAULT 'En revisión',
  contract_generated_at TIMESTAMPTZ,
  contract_approved_at TIMESTAMPTZ,
  signature_envelope_id TEXT,
  signature_provider TEXT,
  signature_status TEXT,
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
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_leads_brief_token ON leads(brief_token);
CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_contracts_lead ON contracts(lead_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_envelope ON signature_events(envelope_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_reference ON payment_events(provider_reference);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created ON workflow_events(created_at DESC);
