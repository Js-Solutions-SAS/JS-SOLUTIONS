# WF_Capacity_Monitor - Technical Contract (JS Solutions)

This document defines the integration contract for team capacity management between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_CAPACITY_WEBHOOK_URL=https://<your-n8n>/webhook/admin-capacity
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoint

- Next.js route: `GET /api/admin/capacidad`
- Behavior:
  - Reads team capacity entries from n8n.
  - Computes aggregated metrics (`overallocated`, `atRisk`, `healthy`, `avgUtilization`).

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ capacity: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "cap-001",
    "personName": "Luis Mejia",
    "role": "Automation Engineer",
    "weekLabel": "2026-W09",
    "capacityHours": 40,
    "assignedHours": 46,
    "projectCount": 4,
    "focusArea": "n8n",
    "ownerEmail": "luis@jssolutions.co"
  }
]
```

## 4) WF_Capacity_Monitor Workflow

### Trigger

- `Schedule Trigger`: every weekday at 07:30 (America/Bogota)

### Steps

1. `Read Team Capacity Source`
- Source: Google Sheets / DB table `Capacidad_Equipo`
- Current week entries only.

2. `Compute Utilization` (Code node)
- Formula: `utilization = (assignedHours / capacityHours) * 100`
- Classification:
  - `OVER` > 100%
  - `WARNING` 85% to 100%
  - `HEALTHY` < 85%

3. `Branch Alerts` (IF/Switch)
- `OVER`: immediate alert to PM + operations lead.
- `WARNING`: notify role owner with preventive recommendation.

4. `Persist Snapshot`
- Write to `Capacity_Snapshots` table:
  - `person`, `role`, `week`, `utilization`, `classification`, `created_at`

5. `Escalation Rule`
- If the same person remains in `OVER` for 2 consecutive runs, escalate to management channel.

## 5) Alert Payload Contract

```json
{
  "eventType": "CAPACITY_OVER",
  "weekLabel": "2026-W09",
  "personName": "Luis Mejia",
  "role": "Automation Engineer",
  "capacityHours": 40,
  "assignedHours": 46,
  "utilization": 115,
  "projectCount": 4,
  "focusArea": "n8n",
  "actionUrl": "https://admin.jssolutions.co/capacidad"
}
```

## 6) Recommended Source Schema

Table: `Capacidad_Equipo`

- `id`
- `personName`
- `role`
- `weekLabel`
- `capacityHours`
- `assignedHours`
- `projectCount`
- `focusArea`
- `ownerEmail`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with failed record IDs
