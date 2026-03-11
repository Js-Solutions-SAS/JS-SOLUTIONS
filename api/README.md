# API (NestJS)

Backend operativo para centralizar estados de leads/brief/cotizaciones/contratos sobre Postgres y dejar n8n como orquestador.

## Endpoints

Públicos:

- `GET /health`
- `GET /health/db` (protegible con `HEALTH_DB_PROTECTED=true`)

Internos (`Authorization: Bearer API_INTERNAL_TOKEN`):

- `GET /api/v1/quotes`
- `POST /api/v1/leads/intake`
- `POST /api/v1/brief/request`
- `POST /api/v1/quotes/generate`
- `POST /api/v1/contracts/generate`
- `GET /api/v1/leads/:leadId`
- `POST /api/v1/workflow-events`
- `GET /api/v1/workflow-events?limit=50`
- `POST /api/v1/internal/channels/whatsapp/inbound-events`
- `POST /api/v1/internal/workflows/events`
- `POST /api/v1/internal/webhooks/payments`
- `POST /api/v1/internal/webhooks/signatures`

Públicos:

- `POST /api/v1/public/leads/intake`
- `POST /api/v1/public/briefs/:briefToken/submissions`
- `POST /api/v1/public/quotes/estimate`

Cliente:

- `GET /api/v1/client/projects/:projectId/dashboard`
- `GET /api/v1/client/projects/dashboard?clientToken=...`
- `POST /api/v1/client/approvals`
- `POST /api/v1/client/payments/intents`

Admin:

- `GET /api/v1/admin/milestones`
- `GET /api/v1/admin/approvals`
- `PATCH /api/v1/admin/approvals/:approvalId/decision`
- `GET /api/v1/admin/change-requests`
- `PATCH /api/v1/admin/change-requests/:id/decision`
- `GET /api/v1/admin/tickets`
- `GET /api/v1/admin/finance`
- `GET /api/v1/admin/raid`

## Variables de entorno

Usa `.env.example` como referencia.

Mínimas para operar:

- `PORT=3000`
- `API_INTERNAL_TOKEN=<token_compartido_admin_api>`
- `DATABASE_URL=postgres://postgres:***@agencia_js-solutions:5432/agencia?sslmode=disable`
- `N8N_REQUEST_BRIEF_WEBHOOK_URL=...`
- `N8N_GENERATE_QUOTE_URL=...`
- `N8N_GENERATE_CONTRACT_URL=...`
- `N8N_PAYMENTS_CREATE_WEBHOOK_URL=...`
- `PORTAL_BASE_URL=https://portal.jssolutions.com.co`

## Desarrollo local

```bash
npm ci
npm run start:dev
```

## Build local

```bash
npm run build
npm run start:prod
```

## Deploy en EasyPanel

### 1) Crear servicio App (Node)

- Tipo: `App`
- Source: tu repositorio Git
- Root Path: `api`
- Build Method: Dockerfile

### 2) Configurar runtime

- Internal Port: `3000`
- Health check path: `/health`

### 3) Variables en EasyPanel

- `NODE_ENV=production`
- `PORT=3000`
- `API_INTERNAL_TOKEN=...`
- `DATABASE_URL=postgres://postgres:***@agencia_js-solutions:5432/agencia?sslmode=disable`
- `N8N_REQUEST_TIMEOUT_MS=15000`
- `N8N_REQUEST_BRIEF_WEBHOOK_URL=...`
- `N8N_GENERATE_QUOTE_URL=...`
- `N8N_GENERATE_CONTRACT_URL=...`
- `N8N_SECRET_TOKEN=...` (si aplica)
- `PORTAL_BASE_URL=https://portal.jssolutions.com.co`

### 4) Exponer públicamente

1. Entra al servicio `api`.
2. Abre `Domains`.
3. `Add Domain`.
4. Usa `api.jssolutions.com.co`.
5. Activa HTTPS (Let's Encrypt).
6. EasyPanel enruta ese dominio al puerto interno `3000`.

### 5) Verificación post-deploy

- `GET https://api.jssolutions.com.co/health`
- `GET https://api.jssolutions.com.co/health/db`

Si `/health/db` falla y `/health` responde, revisa conectividad/credenciales de Postgres.
