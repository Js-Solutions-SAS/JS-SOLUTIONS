# API Context

## Mission

`api` is the Core Business API of JS Solutions.

Its job is not to be a thin proxy to n8n. Its job is to own the canonical
business model, persist every critical state transition, expose stable
contracts to all frontends, and let n8n orchestrate around that core.

## Production Goal

In the next 20 days this module must be ready to support 50+ active clients in
parallel without depending on ad hoc spreadsheet logic or frontend-specific
state handling.

That means:

- one canonical source of truth
- predictable contracts
- auditability
- recoverable failures
- no critical flow depending on browser-to-webhook direct calls

## Role In The System

- `landing` sends public lead and intake traffic here
- `portal` reads and writes client-visible project state here
- `admin` operates the business through admin routes backed by this API
- `n8n` consumes internal events and triggers internal callbacks here

## Current Reality

The current implementation already provides a strong base:

- NestJS application
- Postgres integration
- internal auth guard for admin -> api calls
- persistence for leads, brief submissions, quotes, contracts and workflow logs
- safe n8n client with timeout, correlation id and idempotency support

Current live domains:

- `health`
- `leads`
- `quotes`
- `contracts`
- `workflow-events`

## Target State

This codebase should evolve into a modular monolith with clear business
domains, not into a fragile collection of endpoint-specific services.

Recommended domain map:

```text
api/src/modules
  iam/
  organizations/
  clients/
  leads/
  briefs/
  quotes/
  contracts/
  onboarding/
  projects/
  milestones/
  approvals/
  change-requests/
  tickets/
  finance/
  documents/
  payments/
  notifications/
  workflows/
  audit/
```

## Canonical Entities

The API must become the owner of these entities:

- `Organization`
- `User`
- `Client`
- `Lead`
- `Brief`
- `Quote`
- `Contract`
- `Project`
- `Milestone`
- `Approval`
- `ChangeRequest`
- `Ticket`
- `Invoice`
- `PaymentIntent`
- `Document`
- `WorkflowRun`
- `AuditEvent`

## Non Negotiable Rules

- `api` is the source of truth for business state
- `n8n` is an orchestrator, not the primary database
- every critical mutation must carry `correlationId`
- every critical mutation must support `idempotencyKey`
- long running work must leave the request path and move to jobs/workflows
- every external callback must end in canonical persistence
- every frontend must consume versioned contracts

## API Surface

The API should be split by trust boundary:

```text
/api/v1/public/*
/api/v1/client/*
/api/v1/admin/*
/api/v1/internal/*
```

Examples:

```text
/api/v1/public/leads
/api/v1/public/briefs
/api/v1/client/projects/:projectId/dashboard
/api/v1/client/documents
/api/v1/client/tickets
/api/v1/client/approvals
/api/v1/client/payments
/api/v1/admin/projects
/api/v1/admin/milestones
/api/v1/admin/approvals
/api/v1/admin/change-requests
/api/v1/admin/tickets
/api/v1/admin/finance
/api/v1/internal/workflows/events
/api/v1/internal/webhooks/docusign
/api/v1/internal/webhooks/payments
```

## Production Principles

### Data

- Postgres is canonical
- migrations only, no blind synchronize in production
- no critical state stored only in Google Sheets
- all statuses must use a controlled vocabulary

### Reliability

- health endpoints for app and database
- retry only where idempotent
- dead letter visibility for failed workflow callbacks
- background jobs for expensive tasks

### Security

- public endpoints rate limited
- admin and internal endpoints authenticated
- role based access control for admin and client users
- webhook verification for payment and signature providers

### Observability

- structured logs
- correlation ids across API, n8n and frontends
- error reporting
- workflow and callback audit trail

## Target SLOs

These are realistic production targets for the next phase:

- public/admin/client read requests: p95 under 400 ms when data is local
- write requests that only persist state: p95 under 700 ms
- async workflow acknowledgement: under 2 s
- 99.5% availability for core routes
- zero silent failures on payment/signature callbacks

## Immediate 20 Day Priorities

### Priority 1

Harden the current commercial funnel:

- lead intake
- brief request
- brief submission
- quote generation
- quote approval sync
- contract generation
- payment callbacks

### Priority 2

Introduce missing core domains:

- `projects`
- `approvals`
- `change-requests`
- `tickets`
- `finance`
- `documents`

### Priority 3

Move all browser-facing critical traffic away from direct n8n usage and behind
this API.

### Priority 4

Add production essentials:

- migrations
- OpenAPI
- RBAC
- audit tables
- callback verification
- operational dashboards/logs

## Out Of Scope For This Module

- presentation-specific UI logic
- direct browser rendering concerns
- business logic hidden only inside n8n nodes

## Definition Of Done

This module is considered production-ready for the 50-client phase when:

- all core business state is persisted here
- `landing`, `portal` and `admin` consume stable contracts from here
- payment and signature callbacks update canonical state here
- admin no longer depends on mock data for critical modules
- n8n failures can be observed and retried without losing state
