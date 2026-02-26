# WF_Milestone_Reminders - Technical Contract (JS Solutions)

This document defines the integration contract between Admin (`/admin`) and n8n for delivery milestones.

## 1) Environment Variables (Admin)

```env
N8N_MILESTONES_WEBHOOK_URL=https://<your-n8n>/webhook/admin-milestones
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoint

- Next.js route: `GET /api/admin/entregas`
- Internal behavior:
  - Calls `N8N_MILESTONES_WEBHOOK_URL`
  - Maps response into `Milestone[]`
  - Returns aggregate metrics (`overdue`, `dueIn7Days`, `blocked`)

## 3) n8n Response Contract (required)

n8n can return either an array directly or `{ milestones: [...] }` / `{ data: [...] }`.

```json
[
  {
    "id": "hito-123",
    "projectId": "P-2026-001",
    "projectName": "Portal de Licitaciones",
    "clientName": "Alcaldia Metropolitana",
    "industry": "Sector Publico",
    "owner": "Maria Torres",
    "phase": "QA",
    "title": "Aprobacion funcional modulo de reportes",
    "dueDate": "2026-03-05T00:00:00.000Z",
    "status": "Pendiente",
    "priority": "Alta",
    "externalUrl": "https://n8n.example.com/execution/abc"
  }
]
```

## 4) WF_Milestone_Reminders Workflow

### Trigger

- `Schedule Trigger`:
  - Frequency: daily (Mon-Fri)
  - Time: 08:00 (timezone America/Bogota)

### Steps

1. `Read Milestones`
- Source: Google Sheets / DB table `Hitos_Entregables`
- Filter: `status != Completado`

2. `Compute Risk Window` (Code node)
- Compute `days_to_due = dueDate - today`
- Rules:
  - `days_to_due < 0` => `risk = HIGH` (overdue)
  - `0 <= days_to_due <= 3` => `risk = MEDIUM`
  - `status == Bloqueado` => force `risk = HIGH`

3. `Branch by Reminder Window` (IF/Switch)
- `days_to_due = 7` => reminder `T-7`
- `days_to_due = 3` => reminder `T-3`
- `days_to_due = 1` => reminder `T-1`
- `days_to_due < 0` => `OVERDUE_ESCALATION`

4. `Notify`
- Slack/Teams to owner + delivery channel
- Optional email to PM + account lead

5. `Persist Reminder Log`
- Write to `Reminder_Log` sheet/table:
  - `milestone_id`, `event_type`, `sent_at`, `recipient`, `status`

6. `Optional Escalation`
- If overdue > 2 days or blocked > 3 days, notify management channel.

## 5) Notification Payload Contract

```json
{
  "eventType": "T-3",
  "milestoneId": "hito-123",
  "projectId": "P-2026-001",
  "projectName": "Portal de Licitaciones",
  "clientName": "Alcaldia Metropolitana",
  "industry": "Sector Publico",
  "owner": "Maria Torres",
  "dueDate": "2026-03-05T00:00:00.000Z",
  "daysToDue": 3,
  "risk": "MEDIUM",
  "status": "Pendiente",
  "actionUrl": "https://admin.jssolutions.co/entregas"
}
```

## 6) Delivery Status Vocabulary (recommended)

- `Pendiente`
- `En Progreso`
- `QA`
- `Bloqueado`
- `Completado`

## 7) SLA for workflow reliability

- Max end-to-end runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Dead-letter handling: send failure alert to `#ops-alerts`
