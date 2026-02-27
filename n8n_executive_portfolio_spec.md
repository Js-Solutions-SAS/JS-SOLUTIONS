# WF_Executive_Portfolio_Health - Technical Contract (JS Solutions)

This document defines the integration contract for executive portfolio health by industry between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_EXECUTIVE_PORTFOLIO_WEBHOOK_URL=https://<your-n8n>/webhook/admin-executive-portfolio
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoint

- Next.js route: `GET /api/admin/portafolio`
- Behavior:
  - Reads executive entries grouped by industry.
  - Computes portfolio metrics (healthy/warning/critical industries, portfolio health average).

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ portfolio: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "portfolio-1",
    "industry": "Public Sector",
    "activeProjects": 8,
    "onTrackProjects": 5,
    "atRiskProjects": 2,
    "criticalProjects": 1,
    "avgSLACompliancePct": 84,
    "avgExecutionPct": 92,
    "pendingBillingAmount": 31200,
    "openApprovals": 6,
    "openRaidItems": 7,
    "owner": "Maria Torres",
    "updatedAt": "2026-03-01T12:00:00.000Z",
    "externalUrl": "https://bi.jssolutions.co/portfolio/public-sector"
  }
]
```

## 4) WF_Executive_Portfolio_Health Workflow

### Trigger

- `Schedule Trigger`: every weekday at 08:20 (America/Bogota)

### Steps

1. `Read Domain Sources`
- Inputs from delivery milestones, SLA snapshots, approvals, RAID logs, and operational finance.

2. `Normalize Industry Axis` (Code node)
- Consolidate to:
  - `Public Sector`
  - `Retail / E-commerce`
  - `Luxury`
  - `Media Production`

3. `Aggregate by Industry`
- Compute:
  - active projects
  - on-track / at-risk / critical
  - average SLA compliance
  - average execution percentage
  - pending billing
  - governance pressure (`openApprovals`, `openRaidItems`)

4. `Compute Health Score`
- Weighted formula (example):
  - penalize critical risk, SLA below target, over-execution, and governance backlog.
- Output bands:
  - `Healthy` (>=80)
  - `Warning` (60-79)
  - `Critical` (<60)

5. `Publish Snapshot`
- Store daily snapshot in `Executive_Portfolio_Snapshots`.

6. `Escalate Critical Vertical`
- Notify PMO/executive channel when an industry is `Critical`.
- Include action URL to `https://admin.jssolutions.co/portafolio`.

## 5) Alert Payload Contract

```json
{
  "eventType": "PORTFOLIO_HEALTH_CRITICAL",
  "industry": "Media Production",
  "healthScore": 54,
  "activeProjects": 5,
  "criticalProjects": 1,
  "pendingBillingAmount": 27100,
  "owner": "Sara Alvarez",
  "actionUrl": "https://admin.jssolutions.co/portafolio"
}
```

## 6) Recommended Source Schema

Table: `Executive_Portfolio_Industry`

- `id`
- `industry`
- `activeProjects`
- `onTrackProjects`
- `atRiskProjects`
- `criticalProjects`
- `avgSLACompliancePct`
- `avgExecutionPct`
- `pendingBillingAmount`
- `openApprovals`
- `openRaidItems`
- `owner`
- `updatedAt`
- `externalUrl`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with impacted industry values
