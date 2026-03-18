# JS Solutions Workspace

Repositorio monorepo con 4 aplicaciones:

- `landing`: sitio comercial y cotizador (Astro + React)
- `portal`: portal de cliente para seguimiento de proyectos (Next.js)
- `admin`: panel interno operativo (Next.js)
- `api`: backend interno/orquestador de cotizaciones (NestJS + Postgres + n8n)

## Estructura del repositorio

```text
.
├── landing/
├── portal/
├── admin/
├── api/
├── n8n/
└── BLUEPRINT_SAAS_POR_MODULO.md
```

## Requisitos

- Node.js 18+
- npm 9+

## Ejecucion local

### 1) Landing (`landing`)

```bash
cd landing
npm install
npm run dev
```

Servidor local: `http://localhost:4321`

Variables recomendadas (`landing/.env`):

```env
PUBLIC_API_BASE_URL=http://localhost:3003
PUBLIC_GTM_ID=GTM-XXXXXXX
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_META_PIXEL_ID=123456789012345
PUBLIC_CLARITY_PROJECT_ID=abcd1234
```

### 2) Portal (`portal`)

```bash
cd portal
npm install
npm run dev
```

Servidor local: `http://localhost:3001` (si usas `start.sh`) o `http://localhost:3000` (si corres solo portal).

Variables recomendadas (`portal/.env.local`):

```env
API_BASE_URL=http://localhost:3003
API_REQUEST_TIMEOUT_MS=15000
N8N_SOPS_WEBHOOK_URL=https://tu-n8n/webhook/sops
N8N_REQUEST_TIMEOUT_MS=15000
```

### 3) Admin (`admin`)

`/cotizaciones` ya no consume n8n directamente: ahora usa `api` para listado, intake, solicitud de brief, generacion de cotizacion y contrato.

```bash
cd admin
npm install
npm run dev
```

Servidor local: `http://localhost:3002` (si usas `start.sh`) o `http://localhost:3000` (si corres solo admin).

Variables recomendadas (`admin/.env.local`):

```env
API_BASE_URL=http://localhost:3003
API_INTERNAL_TOKEN=token_compartido_admin_api
API_REQUEST_TIMEOUT_MS=15000

N8N_SOPS_WEBHOOK_URL=https://tu-n8n/webhook/sops
N8N_CAPACITY_WEBHOOK_URL=https://tu-n8n/webhook/admin-capacidad
N8N_EXECUTIVE_PORTFOLIO_WEBHOOK_URL=https://tu-n8n/webhook/admin-portafolio
N8N_RAID_WEBHOOK_URL=https://tu-n8n/webhook/admin-raid
N8N_SECRET_TOKEN=tu_token_bearer_opcional
N8N_REQUEST_TIMEOUT_MS=15000
```

### 4) API (`api`)

Backend NestJS con base path interno `/api/v1`.

```bash
cd api
npm install
npm run start:dev
```

Servidor local: `http://localhost:3003` (si usas `start.sh`) o `http://localhost:3000` (si corres solo api).

Variables recomendadas (`api/.env`):

```env
PORT=3000
API_INTERNAL_TOKEN=token_compartido_admin_api
DATABASE_URL=postgres://postgres:password@agencia_js-solutions:5432/agencia?sslmode=disable
DB_SSL=false
PORTAL_BASE_URL=https://portal.jssolutions.com.co
N8N_REQUEST_TIMEOUT_MS=15000
N8N_REQUEST_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/request-brief
N8N_GENERATE_QUOTE_URL=https://tu-n8n/webhook/cotizador_js_solutions
N8N_GENERATE_CONTRACT_URL=https://tu-n8n/webhook/js-solutions/generate-contract
N8N_PAYMENTS_CREATE_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/payments/create
N8N_SECRET_TOKEN=
HEALTH_DB_PROTECTED=false
INTERNAL_HMAC_SECRET=CHANGE_ME
INTERNAL_REQUIRE_HMAC_FOR_INTERNAL=true
```

## Arranque conjunto

`start.sh` levanta los 4 servicios:

- Landing: `http://localhost:4321`
- Portal: `http://localhost:3001`
- Admin: `http://localhost:3002`
- API: `http://localhost:3003`

```bash
./start.sh
```

## Build de produccion

En cada app:

```bash
npm run build
npm run start
```

## Archivos de apoyo n8n / SQL

- `n8n/workflows/`: workflows de briefs, cotizacion, aprobacion portal, firma y pagos.
- `n8n/sql/js_solutions_postgres_schema.sql`: esquema base operativo para Postgres VPS.
- `n8n/README.md`: guia de importacion y mapeo de variables.
