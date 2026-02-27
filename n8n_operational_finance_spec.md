# WF_Operational_Finance_Control - Technical Contract (JS Solutions)

This document defines the integration contract for operational finance visibility between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_OPERATIONAL_FINANCE_WEBHOOK_URL=https://<your-n8n>/webhook/admin-operational-finance
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoint

- Next.js route: `GET /api/admin/finanzas`
- Behavior:
  - Reads financial entries by project.
  - Computes global metrics (`budget`, `executed`, `pending billing`, `invoiced`, `overBudget`).
  - Returns client-type summaries for portfolio view.

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ finances: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "fin-001",
    "projectId": "P-001",
    "projectName": "Portal de Licitaciones",
    "clientName": "Alcaldia Metropolitana",
    "clientType": "Public Sector",
    "industry": "Sector Publico",
    "owner": "Maria Torres",
    "currency": "COP",
    "budgetAmount": 82000,
    "executedAmount": 69400,
    "pendingBillingAmount": 17800,
    "invoicedAmount": 64200,
    "billingStatus": "Partially Invoiced",
    "updatedAt": "2026-03-01T12:00:00.000Z",
    "externalUrl": "https://erp.jssolutions.co/projects/P-001"
  }
]
```

## 4) WF_Operational_Finance_Control Workflow

### Trigger

- `Schedule Trigger`: every weekday at 07:45 (America/Bogota)

### Steps

1. `Read Finance Source`
- Source: Google Sheets / DB / ERP financial extract.

2. `Normalize Financial Schema` (Code node)
- Normalize `clientType` and `billingStatus`.
- Ensure numeric fields are finite and non-negative.

3. `Compute KPIs` (Code node)
- `executionPct = executedAmount / budgetAmount`
- `budgetVariance = budgetAmount - executedAmount`
- `billingPendingPct = pendingBillingAmount / budgetAmount`

4. `Flag Conditions`
- `OVER_BUDGET` when `executedAmount > budgetAmount`
- `BILLING_GAP` when high execution and low invoicing ratio

5. `Notify Stakeholders`
- Notify PM + Finance Ops with actionable summary.
- Deep link: `https://admin.jssolutions.co/finanzas`

6. `Persist Snapshot`
- Store daily portfolio snapshot for trend analysis and audits.

## 5) Alert Payload Contract

```json
{
  "eventType": "FINANCE_ALERT",
  "projectId": "P-001",
  "projectName": "Portal de Licitaciones",
  "clientType": "Public Sector",
  "budgetAmount": 82000,
  "executedAmount": 84500,
  "pendingBillingAmount": 17800,
  "invoicedAmount": 64200,
  "flags": ["OVER_BUDGET", "BILLING_GAP"],
  "owner": "Maria Torres",
  "actionUrl": "https://admin.jssolutions.co/finanzas"
}
```

## 6) Recommended Source Schema

Table: `Project_Operational_Finance`

- `id`
- `projectId`
- `projectName`
- `clientName`
- `clientType`
- `industry`
- `owner`
- `currency`
- `budgetAmount`
- `executedAmount`
- `pendingBillingAmount`
- `invoicedAmount`
- `billingStatus`
- `updatedAt`
- `externalUrl`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with impacted `projectId` list
