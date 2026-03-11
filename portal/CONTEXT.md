# Portal Context

## Mission

`portal` is the Client Workspace of JS Solutions.

Its job is to give every client a premium, reliable and structured place to:

- understand project status
- complete briefs
- review documents
- approve deliverables
- open support requests
- track payments and next steps

## Production Goal

In the next 20 days this module must be able to support 50+ active clients in
parallel with a trustworthy experience and no dependence on backchannel manual
status explanations.

The client should not need to ask "what is happening with my project?" if the
portal is working correctly.

## Role In The System

- reads canonical client-facing data from `api`
- writes client actions back to `api`
- displays workflow outcomes produced by `api` and `n8n`
- acts as the client layer of the SaaS, not as a direct n8n console

## Current Reality

The current implementation already includes:

- dashboard access through token
- project status rendering
- technical brief submission
- approvals for deliverables, quotes and contracts
- payment initiation

Current weaknesses:

- the experience is still centered on the commercial funnel
- access still depends mainly on token-based flows
- it does not yet cover the full post-sale lifecycle

## Target State

`portal` must become a complete client workspace with stable contracts and a
serious trust model.

Target capabilities:

- project dashboard
- brief and onboarding
- documents center
- approvals center
- tickets/support
- project timeline
- payments and invoices
- client communications history

## Core Areas

### Dashboard

Must show:

- current phase
- progress
- next milestone
- blockers needing client action
- recent updates

### Brief And Onboarding

Must support:

- technical brief completion
- follow-up clarification requests
- attachment upload
- onboarding checklist visibility

### Documents

Must support:

- quote visibility
- contract visibility
- deliverable visibility
- safe download and preview

### Approvals

Must support:

- quote approval
- contract approval/signature tracking
- deliverable approval
- approval history

### Support

Must support:

- opening tickets
- viewing ticket status
- understanding SLA expectations
- replying with context

### Payments

Must support:

- payment start
- payment status
- receipts or references
- billing visibility

## Non Negotiable Rules

- no direct browser calls to raw n8n production webhooks for critical flows
- client-visible status must come from canonical state
- every approval and payment action must be auditable
- the portal must remain simple, premium and low-friction

## Access Model

Short term:

- signed token-based access can remain for urgent rollout

Target:

- real client accounts
- multi-user access per client organization
- role segmentation for decision makers vs observers

## UX Standard

The portal must feel premium and calm:

- no noisy internal terminology
- clear progress model
- clear next actions
- no contradictory statuses across pages
- mobile-safe experience for decision makers

## Production Metrics

- project dashboard should load reliably on first try
- brief submission should be recoverable and idempotent
- approval actions should confirm in seconds
- support and payment actions should never leave the client guessing

## Immediate 20 Day Priorities

### Priority 1

Move primary reads and writes behind canonical API contracts.

### Priority 2

Keep these flows production-safe:

- brief submission
- quote approval
- contract approval/signature state
- payment initiation/status

### Priority 3

Add the next minimum valuable client features:

- document center
- timeline/recent updates
- ticket entry point

### Priority 4

Prepare the path for real client accounts after initial rollout.

## Definition Of Done

This module is ready for the 50-client phase when:

- clients can self-serve status and next steps
- approvals and payments are trustworthy
- brief/onboarding works without manual rescue in normal conditions
- the portal reads the same truth the internal team sees
