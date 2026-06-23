# JS Solutions Admin

Panel interno (Next.js 14 + Tailwind) para operacion de JS Solutions.

## Modulos principales

- `/` Dashboard operativo
- `/entregas` Entregables e hitos
- `/capacidad` Carga por persona/rol
- `/aprobaciones` Checkpoints por etapa
- `/cambios` Control de cambios
- `/sla` SLA de tickets
- `/portafolio` Salud ejecutiva
- `/finanzas` Finanzas operativas
- `/raid` RAID log
- `/sops` SOPs
- `/cotizaciones` Flujo operativo de briefs, cotizaciones y contratos

## Arquitectura

- Componentes en Atomic Design (`atoms`, `molecules`, `organisms`, `templates`, `features`).
- Dominios con estructura uniforme: `domain/<modulo>/{model,machine,services,events,ui,hooks}`.
- Estado de dominio en XState v5 + patrones de contexto dividido (`StateContext` / `DispatchContext`).
- Bus de eventos dual (CustomEvent + Pub/Sub) con contrato tipado y versionado.

## Integracion de cotizaciones

`/cotizaciones` consume API interna (`api`) en vez de llamar n8n directamente.

Operaciones conectadas a API:

- listado: `GET /api/v1/quotes`
- intake: `POST /api/v1/leads/intake`
- solicitud/reenvio brief: `POST /api/v1/brief/request`
- previsualizar/enviar cotizacion: `POST /api/v1/quotes/generate`
- generar contrato: `POST /api/v1/contracts/generate`

## Prospeccion

`/prospectos` usa la API interna como fuente de verdad para busquedas nuevas y persistencia en Postgres.

Operaciones conectadas a API:

- listado con filtros: `GET /api/v1/admin/prospects`
- opciones de ciudad/rubro/filtros: `GET /api/v1/admin/prospects/options`
- busqueda real Overpass + guardado: `POST /api/v1/admin/prospects/search-osm`
- estado/notas: `PATCH /api/v1/admin/prospects/:id`

El JSON local queda solo como respaldo operativo/importacion inicial cuando el admin no tiene `API_BASE_URL` configurado; no reemplaza la base real.

## Performance budgets y alertas

- Presupuestos por ruta: `admin/lib/performance/budgets.ts`.
- Watcher runtime: `admin/components/features/performance-budget-watcher.tsx`.
- Ingest endpoint: `POST /api/admin/performance-alerts`.

Variable opcional:

```env
PERFORMANCE_ALERT_WEBHOOK_URL=https://tu-observabilidad/webhook/frontend-performance
```

## Seguridad frontend

- Headers de seguridad y CSP en `next.config.mjs`.
- Honeypot en login (`website`) validado server-side en `app/login/actions.ts`.
- Sin bloqueos de UX por telemetria/fallos no criticos.

## Testing automatizado

```bash
npm run test
npm run test:watch
npm run test:coverage
```

Cobertura minima recomendada:

- FSM de modulos criticos
- Event bus tipado
- Reducers invertidos
- Worker logic

## Variables de entorno (`admin/.env.local`)

```env
# Integracion interna admin -> api
# Local con ./start.sh:
# API_BASE_URL=http://localhost:3003
# Produccion/Vercel:
# API_BASE_URL=https://api.jssolutions.com.co
API_BASE_URL=https://api.jssolutions.com.co
API_INTERNAL_TOKEN=<shared_secret>
API_REQUEST_TIMEOUT_MS=15000
PERFORMANCE_ALERT_WEBHOOK_URL=

# Integraciones n8n para modulos operativos
N8N_SOPS_WEBHOOK_URL=https://<your-n8n>/webhook/sops
N8N_MILESTONES_WEBHOOK_URL=https://<your-n8n>/webhook/admin-entregas
N8N_CAPACITY_WEBHOOK_URL=https://<your-n8n>/webhook/admin-capacity
N8N_APPROVALS_WEBHOOK_URL=https://<your-n8n>/webhook/admin-approvals
N8N_APPROVALS_ACTION_WEBHOOK_URL=https://<your-n8n>/webhook/admin-approvals-action
N8N_CHANGE_REQUESTS_WEBHOOK_URL=https://<your-n8n>/webhook/admin-change-requests
N8N_CHANGE_REQUESTS_ACTION_WEBHOOK_URL=https://<your-n8n>/webhook/admin-change-requests-action
N8N_TICKETS_SLA_WEBHOOK_URL=https://<your-n8n>/webhook/admin-tickets-sla
N8N_EXECUTIVE_PORTFOLIO_WEBHOOK_URL=https://<your-n8n>/webhook/admin-executive-portfolio
N8N_OPERATIONAL_FINANCE_WEBHOOK_URL=https://<your-n8n>/webhook/admin-operational-finance
N8N_RAID_WEBHOOK_URL=https://<your-n8n>/webhook/admin-raid-log
N8N_SECRET_TOKEN=<optional_bearer_token>
N8N_REQUEST_TIMEOUT_MS=15000
```

## Auth local (requerido)

```env
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_PASSWORD_HASH=<scrypt_hash>
AUTH_ADMIN_PASSWORD_HASH_ALT=<optional_second_scrypt_hash>
AUTH_SESSION_SECRET=<32+_char_random_secret>
AUTH_CSRF_SECRET=<32+_char_random_secret>
```

Generar hash (en `admin/`):

```bash
node scripts/generate-hash.js <strong-password>
```

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

Si necesitas limpiar cache:

```bash
npm run clean:cache
```
