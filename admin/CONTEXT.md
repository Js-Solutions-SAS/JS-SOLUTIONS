# Admin Context

## Mission

`admin` is the Operations Cockpit of JS Solutions.

Its purpose is to let the internal team operate sales, delivery, approvals,
change control, SLA, finance and portfolio health for 50+ active clients
without fragmentation, hidden state or spreadsheet-only workflows.

## Production Goal

In 20 days this module must support a team that can manage 50+ concurrent
clients with confidence, speed and traceability.

This is an operations product, not a dashboard demo.

## Role In The System

- consumes admin contracts from `api`
- exposes a controlled internal UI for operators
- triggers business actions that persist through `api`
- displays workflow results and operational risk in one place

`admin` should not be the source of truth.

## Current Reality

The current implementation already provides:

- login and session handling
- operations dashboard
- views for:
  - `cotizaciones`
  - `entregas`
  - `capacidad`
  - `aprobaciones`
  - `cambios`
  - `sla`
  - `portafolio`
  - `finanzas`
  - `raid`
  - `sops`
- `cotizaciones` already integrated with `api`
- the rest already define UI contracts through BFF routes

The main weakness today:

- most non-quote modules still rely on direct n8n reads or fallback mock data

## Target State

`admin` must become a thin but powerful operations client over canonical API
contracts.

Target rule:

- reads from `api`
- writes to `api`
- async automations happen through `api` -> `n8n`
- no critical module runs on mock data in production

## Core Modules

### Quotes

Must manage:

- lead intake
- brief status
- quote review
- commercial approval
- contract initiation
- first payment visibility

### Deliveries

Must manage:

- active projects
- milestones
- due dates
- owners
- risk windows

### Capacity

Must manage:

- allocation by person
- allocation by role
- weekly load
- over-capacity flags
- rebalance suggestions

### Approvals

Must manage:

- checkpoints per stage
- pending approvers
- due dates
- audit trail

### Change Requests

Must manage:

- scope changes
- cost impact
- date impact
- decision trail

### Tickets And SLA

Must manage:

- support queue
- response SLA
- resolution SLA
- breach visibility

### RAID

Must manage:

- risks
- assumptions
- issues
- dependencies
- critical open items

### Finance

Must manage:

- budget
- executed
- invoiced
- pending billing
- margin pressure

### Portfolio

Must manage:

- health by vertical
- project risk concentration
- governance pressure
- executive summary

## Non Negotiable Rules

- no critical module powered by mocks in production
- every mutation must return actionable status feedback
- every table/filter card must map to canonical API fields
- permissions must be explicit by role
- operator actions must leave an audit trail

## UX Standard

This module must feel like a high-end internal operating system:

- fast load on real data
- clear status hierarchy
- strong empty/error/loading states
- dense but readable tables
- one-click operational actions where safe

## Production Metrics

The team should be able to:

- see portfolio and delivery health in less than 3 clicks
- process approvals and changes in under 1 minute
- detect breached SLA, overdue milestones and financial risk immediately
- operate all critical flows without opening raw n8n workflows

## Immediate 20 Day Priorities

### Priority 1

Keep `cotizaciones` stable and fully tied to `api`.

### Priority 2

Replace mock/fallback data for:

- `entregas`
- `aprobaciones`
- `cambios`
- `sla`
- `finanzas`

### Priority 3

Normalize filters, statuses and metrics so every page speaks the same business
language.

### Priority 4

Add operator-grade safeguards:

- clearer error handling
- action confirmations where needed
- audit/event visibility
- role restrictions

## Definition Of Done

This module is ready for the 50-client phase when:

- operators can run the daily business from this UI
- critical pages do not depend on mock data
- all major actions persist through `api`
- operational risk is visible in real time
- the team can manage concurrent projects without spreadsheet shadow systems
