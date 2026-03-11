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

## Arquitectura de componentes

`admin/components` fue migrado a Atomic Design:

- `atoms/`
- `molecules/`
- `organisms/`
- `templates/`
- `features/`

Las vistas de dominio (incluyendo `cotizaciones`) viven bajo `organisms/`.

## Integracion de cotizaciones

`/cotizaciones` consume API interna (`api`) en vez de llamar n8n directamente.

Operaciones conectadas a API:

- listado: `GET /api/v1/quotes`
- intake: `POST /api/v1/leads/intake`
- solicitud/reenvio brief: `POST /api/v1/brief/request`
- previsualizar/enviar cotizacion: `POST /api/v1/quotes/generate`
- generar contrato: `POST /api/v1/contracts/generate`

## Variables de entorno (`admin/.env.local`)

```env
# Integracion interna admin -> api
API_BASE_URL=https://api.jssolutions.com.co
API_INTERNAL_TOKEN=<shared_secret>
API_REQUEST_TIMEOUT_MS=15000

# Integraciones n8n para otros modulos operativos
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
