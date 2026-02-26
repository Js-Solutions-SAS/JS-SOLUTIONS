# WF_Raid_Log_Governance - Technical Contract (JS Solutions)

This document defines the integration contract for project RAID governance between Admin (`/admin`) and n8n.

## 1) Environment Variables (Admin)

```env
N8N_RAID_WEBHOOK_URL=https://<your-n8n>/webhook/admin-raid-log
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## 2) Admin BFF Endpoint

- Next.js route: `GET /api/admin/raid`
- Behavior:
  - Reads RAID records from n8n.
  - Computes aggregate metrics (`open`, `criticalOpen`, category totals).
  - Builds `summaries` grouped by `projectId`.

## 3) n8n Response Contract (required)

n8n may return either an array directly, `{ raid: [...] }`, or `{ data: [...] }`.

```json
[
  {
    "id": "raid-001",
    "projectId": "P-001",
    "projectName": "Portal de Licitaciones",
    "clientName": "Alcaldia Metropolitana",
    "industry": "Sector Publico",
    "owner": "Maria Torres",
    "type": "Risk",
    "status": "Open",
    "priority": "Critical",
    "title": "Cambios regulatorios sin confirmacion final",
    "detail": "Riesgo de reproceso funcional por nueva circular.",
    "dueDate": "2026-03-05T00:00:00.000Z",
    "mitigation": "Mesa legal semanal + congelacion de alcance",
    "dependencyOn": "",
    "externalUrl": "https://notion.so/raid/P-001"
  }
]
```

## 4) WF_Raid_Log_Governance Workflow

### Trigger

- `Schedule Trigger`: every weekday at 08:00 (America/Bogota)

### Steps

1. `Read RAID Source`
- Source: Google Sheets / DB table `RAID_Log`
- Fetch active and recent closed records.

2. `Normalize Data` (Code node)
- Normalize `type` to `Risk | Assumption | Issue | Dependency`.
- Normalize `status` to `Open | Mitigated | Blocked | Closed`.
- Normalize `priority` to `Low | Medium | High | Critical`.

3. `Detect Critical Open Entries`
- Critical condition:
  - status in `Open/Blocked`
  - priority in `High/Critical`

4. `Notify Owners`
- Send actionable alerts for `Critical Open` entries to PM and owner.
- Include deep link to `/raid` view in admin.

5. `Persist Snapshot`
- Store audit snapshot in `RAID_Snapshots`:
  - `projectId`, `entryId`, `type`, `status`, `priority`, `captured_at`

## 5) Alert Payload Contract

```json
{
  "eventType": "RAID_CRITICAL_OPEN",
  "projectId": "P-001",
  "projectName": "Portal de Licitaciones",
  "entryId": "raid-001",
  "type": "Risk",
  "status": "Open",
  "priority": "Critical",
  "title": "Cambios regulatorios sin confirmacion final",
  "owner": "Maria Torres",
  "dueDate": "2026-03-05T00:00:00.000Z",
  "actionUrl": "https://admin.jssolutions.co/raid"
}
```

## 6) Recommended Source Schema

Table: `RAID_Log`

- `id`
- `projectId`
- `projectName`
- `clientName`
- `industry`
- `owner`
- `type`
- `status`
- `priority`
- `title`
- `detail`
- `dueDate`
- `mitigation`
- `dependencyOn`
- `externalUrl`

## 7) Reliability Targets

- Max workflow runtime: 2 min
- Retry policy: 3 attempts with exponential backoff
- Failure path: alert `#ops-alerts` with `entryId` list
