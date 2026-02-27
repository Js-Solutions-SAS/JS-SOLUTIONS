# WF_Tickets_SLA_Control - Technical Contract (JS Solutions)

This document defines the integration contract for ticket SLA governance between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_TICKETS_SLA_WEBHOOK_URL=https://<your-n8n>/webhook/admin-tickets-sla
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoint

- Next.js route: `GET /api/admin/sla`
- Behavior:
  - Reads SLA ticket records.
  - Computes global metrics (`breachedResponse`, `breachedResolution`, `withinSLA`).
  - Computes compliance summaries grouped by `clientType`.

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ tickets: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "sla-001",
    "ticketId": "TK-1032",
    "projectId": "P-001",
    "projectName": "Portal de Licitaciones",
    "clientName": "Alcaldia Metropolitana",
    "clientType": "Public Sector",
    "industry": "Sector Publico",
    "owner": "Maria Torres",
    "priority": "High",
    "channel": "Email",
    "status": "In Progress",
    "summary": "Ajuste de permisos en modulo de reportes ciudadanos.",
    "createdAt": "2026-03-01T09:00:00.000Z",
    "firstResponseAt": "2026-03-01T11:30:00.000Z",
    "resolvedAt": null,
    "targetResponseHours": 4,
    "targetResolutionHours": 24,
    "externalUrl": "https://helpdesk.jssolutions.co/tickets/TK-1032"
  }
]
```

## 4) WF_Tickets_SLA_Control Workflow

### Trigger

- `Schedule Trigger`: every business hour (Mon-Fri, 07:00-19:00, America/Bogota)
- Optional: additional daily summary trigger at 18:30

### Steps

1. `Read Ticket Source`
- Source: Google Sheets / DB / Helpdesk API.
- Include active tickets and recently closed tickets.

2. `Normalize SLA Fields` (Code node)
- Normalize `clientType`: `Public Sector | Retail / E-commerce | Luxury | Media Production | Technology`
- Normalize `status`: `Open | In Progress | Pending Customer | Resolved | Closed`
- Normalize `priority`: `Low | Medium | High | Critical`

3. `Compute SLA Deltas` (Code node)
- `responseHours = firstResponseAt - createdAt`
- `resolutionHours = resolvedAt - createdAt`
- Determine breach flags:
  - `responseBreached = responseHours > targetResponseHours`
  - `resolutionBreached = resolutionHours > targetResolutionHours`

4. `Escalation Rules`
- Escalate immediately when:
  - `priority in (Critical, High)` and SLA is breached.
- Escalate to PM + operations when:
  - repeated breaches for same account in rolling 7 days.

5. `Persist Snapshot`
- Store periodic snapshots in `Ticket_SLA_Snapshots` for trend analysis.

6. `Notify Owners`
- Send actionable alert with deep link:
  - `https://admin.jssolutions.co/sla`

## 5) Alert Payload Contract

```json
{
  "eventType": "TICKET_SLA_BREACH",
  "ticketId": "TK-1032",
  "projectId": "P-001",
  "projectName": "Portal de Licitaciones",
  "clientType": "Public Sector",
  "priority": "High",
  "responseBreached": true,
  "resolutionBreached": false,
  "owner": "Maria Torres",
  "actionUrl": "https://admin.jssolutions.co/sla"
}
```

## 6) Recommended Source Schema

Table: `Project_Tickets_SLA`

- `id`
- `ticketId`
- `projectId`
- `projectName`
- `clientName`
- `clientType`
- `industry`
- `owner`
- `priority`
- `channel`
- `status`
- `summary`
- `createdAt`
- `firstResponseAt`
- `resolvedAt`
- `targetResponseHours`
- `targetResolutionHours`
- `externalUrl`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with impacted ticket IDs
