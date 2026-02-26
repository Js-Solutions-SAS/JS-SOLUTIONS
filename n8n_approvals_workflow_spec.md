# WF_Approvals_Governance - Technical Contract (JS Solutions)

This document defines the integration contract for project approval checkpoints between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_APPROVALS_WEBHOOK_URL=https://<your-n8n>/webhook/admin-approvals
N8N_APPROVALS_ACTION_WEBHOOK_URL=https://<your-n8n>/webhook/admin-approvals-action
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoints

- Next.js route: `GET /api/admin/aprobaciones`
  - Reads approval items and computes KPI metrics + stage coverage.
- Next.js Server Action: `approveCheckpointAction`
  - Sends approval mutation to n8n through `N8N_APPROVALS_ACTION_WEBHOOK_URL`.

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ approvals: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "apr-001",
    "projectId": "P-001",
    "projectName": "Portal de Licitaciones",
    "clientName": "Alcaldia Metropolitana",
    "industry": "Sector Publico",
    "owner": "Maria Torres",
    "stage": "Scope",
    "status": "In Review",
    "requestedAt": "2026-03-01T00:00:00.000Z",
    "dueDate": "2026-03-04T00:00:00.000Z",
    "approvedAt": null,
    "title": "Validacion final de alcance",
    "notes": "Pendiente firma de comite legal",
    "externalUrl": "https://notion.so/approvals/P-001"
  }
]
```

## 4) Mutation Payload Contract (Admin -> n8n)

```json
{
  "action": "approve",
  "approvalId": "apr-001",
  "projectId": "P-001",
  "stage": "Scope"
}
```

## 5) WF_Approvals_Governance Workflow

### Trigger

- `Schedule Trigger`: every weekday at 08:15 (America/Bogota)
- `Webhook Trigger`: on approval mutation (`approve`)

### Steps

1. `Read Approval Source`
- Source: Google Sheets / DB table `Project_Approvals`.

2. `Normalize Approval Taxonomy` (Code node)
- Stages:
  - `Brief`, `Scope`, `QA`, `UAT`, `Contract`, `Scope Change`
- Status:
  - `Pending`, `In Review`, `Approved`, `Rejected`, `Blocked`

3. `Critical Detection`
- Flag as critical when:
  - status in `Pending/In Review/Blocked`
  - and `dueDate` is overdue.

4. `Approval Mutation Handler`
- On `approve` action:
  - Update row status to `Approved`
  - Set `approvedAt`
  - Persist audit event in `Approvals_Audit`.

5. `Escalation Notifications`
- Notify PM/Operations for overdue critical approvals.
- Include action URL to `https://admin.jssolutions.co/aprobaciones`.

## 6) Recommended Source Schema

Table: `Project_Approvals`

- `id`
- `projectId`
- `projectName`
- `clientName`
- `industry`
- `owner`
- `stage`
- `status`
- `requestedAt`
- `dueDate`
- `approvedAt`
- `title`
- `notes`
- `externalUrl`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with impacted `approvalId` values
