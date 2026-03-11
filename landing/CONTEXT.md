# Landing Context

## Mission

`landing` is the Demand Engine of JS Solutions.

Its job is to capture qualified demand, frame the value proposition clearly,
and move prospects into the structured commercial funnel with as little manual
cleanup as possible.

## Production Goal

In the next 20 days this module must be able to support aggressive commercial
growth while preserving data quality and conversion quality.

For the 50-client phase, the goal is not just traffic. The goal is predictable
qualified intake.

## Role In The System

- presents the brand and services
- captures public leads
- runs qualification flows
- pushes normalized intake into `api`
- triggers automations only through trusted backend paths

## Current Reality

The current implementation already includes:

- public marketing site
- contact form
- interactive quote estimator

Current weaknesses:

- contact and quote flows still call n8n webhooks directly from the browser
- there is no canonical persistence path for public intake
- public protection layers are still too thin for production scaling

## Target State

`landing` must become a secure public acquisition layer backed by server-side
contracts and production-grade intake handling.

Target capabilities:

- contact capture
- commercial qualification
- lead scoring
- service segmentation
- campaign/source tracking
- guided first brief or diagnostic intake

## Non Negotiable Rules

- no direct browser -> n8n production webhook calls for critical public flows
- every public submission must go through a trusted backend path
- anti-spam and rate limiting are mandatory
- marketing metrics must be attributable
- all qualified intake must be persisted canonically

## Correct Traffic Pattern

Required path:

```text
browser -> landing server route -> api /public/* -> postgres
                                         |
                                         -> n8n async automation
```

Not acceptable as target production architecture:

```text
browser -> raw n8n webhook
```

## Public Funnel Areas

### Contact

Must capture:

- name
- company
- email
- message
- acquisition source

### Quote Estimator

Must capture:

- service interest
- complexity
- sector
- budget range
- notes
- contact identity

### Qualification

Must classify:

- service line
- urgency
- deal size signal
- probable delivery path

## UX Standard

`landing` must feel high-end and fast:

- premium brand expression
- clear service positioning
- low-friction forms
- strong mobile performance
- explicit trust cues

## Production Metrics

For this module the key metrics are:

- form submission success rate
- lead-to-brief conversion rate
- spam rejection quality
- quote estimator completion rate
- source attribution coverage

## Immediate 20 Day Priorities

### Priority 1

Move contact and quote submission behind server-side routes.

### Priority 2

Integrate public intake with canonical API contracts:

- `/api/v1/public/leads`
- `/api/v1/public/briefs`

### Priority 3

Add public production protections:

- rate limit
- validation
- anti-spam/captcha
- request logging

### Priority 4

Track acquisition quality, not only volume.

## Definition Of Done

This module is ready for the 50-client phase when:

- public intake no longer depends on direct browser webhooks
- qualified leads enter the canonical funnel cleanly
- source tracking is reliable
- commercial automation can run without losing lead quality
