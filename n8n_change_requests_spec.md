# WF_Change_Requests_Control - Technical Contract (JS Solutions)

This document defines the integration contract for change request governance between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_CHANGE_REQUESTS_WEBHOOK_URL=https://<your-n8n>/webhook/admin-change-requests
N8N_CHANGE_REQUESTS_ACTION_WEBHOOK_URL=https://<your-n8n>/webhook/admin-change-requests-action
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin Endpoints

- Next.js route: `GET /api/admin/cambios`
  - Reads change requests and computes KPI metrics (`pendingReview`, `totalCostImpact`, `totalDelayDays`).
- Next.js Server Action: `reviewChangeRequestAction`
  - Sends decision mutation (`approve` / `reject`) to n8n.

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ changeRequests: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "cr-001",
    "projectId": "P-001",
    "projectName": "Portal de Licitaciones",
    "clientName": "Alcaldia Metropolitana",
    "industry": "Sector Publico",
    "owner": "Maria Torres",
    "type": "Compliance",
    "status": "Pending Review",
    "title": "Ajuste de modulo de trazabilidad legal",
    "description": "Se solicita auditoria extendida de eventos para cumplir nueva circular.",
    "requestedAt": "2026-03-01T00:00:00.000Z",
    "baselineCost": 7200,
    "proposedCost": 8700,
    "baselineDueDate": "2026-03-11T00:00:00.000Z",
    "proposedDueDate": "2026-03-16T00:00:00.000Z",
    "justification": "Requisito regulatorio obligatorio para salida a produccion.",
    "externalUrl": "https://notion.so/change-requests/P-001"
  }
]
```

## 4) Mutation Payload Contract (Admin -> n8n)

```json
{
  "action": "approve",
  "changeRequestId": "cr-001",
  "projectId": "P-001"
}
```

Allowed `action` values: `approve`, `reject`.

## 5) WF_Change_Requests_Control Workflow

### Trigger

- `Schedule Trigger`: every weekday at 08:30 (America/Bogota)
- `Webhook Trigger`: on decision mutation (`approve` / `reject`)

### Steps

1. `Read Change Requests Source`
- Source: Google Sheets / DB table `Project_Change_Requests`.

2. `Normalize Taxonomy` (Code node)
- Type: `Scope | Technical | Design | Compliance`
- Status: `Pending Review | Approved | Rejected | In Progress | Implemented`

3. `Compute Impact` (Code node)
- `costDelta = proposedCost - baselineCost`
- `scheduleDeltaDays = proposedDueDate - baselineDueDate`

4. `Priority Rules`
- Mark as high-priority review when:
  - `costDelta > projectThreshold`, or
  - `scheduleDeltaDays > 0`.

5. `Decision Handler`
- On `approve`:
  - Update status to `Approved`
  - Persist audit event in `Change_Requests_Audit`
- On `reject`:
  - Update status to `Rejected`
  - Persist rejection reason if available

6. `Escalation Notifications`
- Notify PM/Operations for high-impact pending requests.
- Include deep link to `https://admin.jssolutions.co/cambios`.

## 6) Recommended Source Schema

Table: `Project_Change_Requests`

- `id`
- `projectId`
- `projectName`
- `clientName`
- `industry`
- `owner`
- `type`
- `status`
- `title`
- `description`
- `requestedAt`
- `baselineCost`
- `proposedCost`
- `baselineDueDate`
- `proposedDueDate`
- `justification`
- `externalUrl`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with impacted `changeRequestId` list
