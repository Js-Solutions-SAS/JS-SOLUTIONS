# JS Solutions Workspace

Repositorio con tres aplicaciones del ecosistema JS Solutions:

- `landing`: sitio comercial y cotizador (Astro + React)
- `portal`: portal de cliente para seguimiento de proyectos (Next.js)
- `admin`: panel interno para SOPs, cotizaciones y contratos (Next.js)

## Estructura del repositorio

```text
.
├── landing/
├── portal/
├── admin/
├── Estructura_Google_Sheets.md
├── n8n_sheets_project_status.json
└── n8n_sheets_onboarding.json
```

## Requisitos

- Node.js 18+
- npm 9+

## Ejecución local

Cada aplicación se ejecuta por separado desde su carpeta.

### 1) Landing (`landing`)

Sitio público con página principal y cotizador.

- Stack: Astro 5 + React + Tailwind
- Rutas principales:
  - `/` (home)
  - `/cotizador` (formulario que envía a n8n)
- Comandos:

```bash
cd landing
npm install
npm run dev
```

Servidor local por defecto: `http://localhost:4321`

Variables recomendadas (`landing/.env`):

```env
PUBLIC_N8N_WEBHOOK_URL=https://tu-n8n/webhook/cotizador_js_solutions
```

Si no se define, usa el fallback que aparece en `landing/src/pages/cotizador.astro`.

### 2) Portal (`portal`)

Portal de clientes para consultar estado de proyecto mediante magic link/token.

- Stack: Next.js 14 + React + Tailwind
- Rutas principales:
  - `/` redirige a `/dashboard`
  - `/dashboard?token=...` carga estado de proyecto
  - `POST /api/project-status` consulta n8n
  - `GET /api/admin/sops` obtiene SOPs desde n8n
- Comandos:

```bash
cd portal
npm install
npm run dev
```

Servidor local por defecto: `http://localhost:3000`

Variables recomendadas (`portal/.env.local`):

```env
N8N_WEBHOOK_URL=https://tu-n8n/webhook/project-status
N8N_SECRET_TOKEN=tu_token_bearer_opcional
N8N_SOPS_WEBHOOK_URL=https://tu-n8n/webhook/sops
N8N_SUBMIT_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/submit-brief
```

### 3) Admin (`admin`)

Panel interno para operación: dashboard, entregas, capacidad, aprobaciones, control de cambios, SLA de tickets, portafolio ejecutivo, finanzas operativas, RAID log, SOPs y cotizaciones/contratos.

- Stack: Next.js 14 + React + Tailwind
- Rutas principales:
  - `/` (dashboard interno)
  - `/entregas` (calendario operativo y asignación)
  - `/capacidad` (carga por persona/rol)
  - `/aprobaciones` (checkpoints por etapa)
  - `/cambios` (control de change requests costo/fecha)
  - `/sla` (cumplimiento SLA de tickets por tipo de cliente)
  - `/portafolio` (salud ejecutiva por industria)
  - `/finanzas` (presupuesto vs ejecutado vs pendiente de facturar)
  - `/raid` (riesgos, supuestos, issues, dependencias)
  - `/sops` (consulta SOPs)
  - `/cotizaciones` (lista leads y genera contratos)
  - `GET /api/admin/entregas`
  - `GET /api/admin/capacidad`
  - `GET /api/admin/aprobaciones`
  - `GET /api/admin/cambios`
  - `GET /api/admin/sla`
  - `GET /api/admin/portafolio`
  - `GET /api/admin/finanzas`
  - `GET /api/admin/raid`
  - `GET /api/admin/sops`
  - `GET /api/admin/cotizaciones`
  - `POST /api/admin/cotizaciones`
- Comandos:

```bash
cd admin
npm install
npm run dev
```

Servidor local por defecto: `http://localhost:3000`

Variables recomendadas (`admin/.env.local`):

```env
N8N_SOPS_WEBHOOK_URL=https://tu-n8n/webhook/sops
N8N_GET_QUOTES_URL=https://tu-n8n/webhook/get-quotes
N8N_REQUEST_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/request-brief
N8N_GENERATE_CONTRACT_URL=https://tu-n8n/webhook/js-solutions/generate-contract
N8N_MILESTONES_WEBHOOK_URL=https://tu-n8n/webhook/admin-entregas
N8N_CAPACITY_WEBHOOK_URL=https://tu-n8n/webhook/admin-capacidad
N8N_APPROVALS_WEBHOOK_URL=https://tu-n8n/webhook/admin-aprobaciones
N8N_APPROVALS_ACTION_WEBHOOK_URL=https://tu-n8n/webhook/admin-aprobaciones-action
N8N_CHANGE_REQUESTS_WEBHOOK_URL=https://tu-n8n/webhook/admin-cambios
N8N_CHANGE_REQUESTS_ACTION_WEBHOOK_URL=https://tu-n8n/webhook/admin-cambios-action
N8N_TICKETS_SLA_WEBHOOK_URL=https://tu-n8n/webhook/admin-sla
N8N_EXECUTIVE_PORTFOLIO_WEBHOOK_URL=https://tu-n8n/webhook/admin-portafolio
N8N_OPERATIONAL_FINANCE_WEBHOOK_URL=https://tu-n8n/webhook/admin-finanzas
N8N_RAID_WEBHOOK_URL=https://tu-n8n/webhook/admin-raid
N8N_SECRET_TOKEN=tu_token_bearer_opcional
```

Notas:

- Si `N8N_GET_QUOTES_URL` no está configurada, el módulo de cotizaciones devuelve datos mock para no romper la UI.
- Si `N8N_REQUEST_BRIEF_WEBHOOK_URL` no está configurada, la solicitud de brief responde en modo simulado.
- Si `N8N_GENERATE_CONTRACT_URL` no está configurada, la generación responde en modo simulado.

## Build de producción

Ejecuta por aplicación:

```bash
npm run build
npm run start
```

## Archivos de apoyo n8n / Google Sheets

- `Estructura_Google_Sheets.md`: esquema de hojas y campos.
- `n8n_sheets_project_status.json`: flujo base para estado de proyectos.
- `n8n_sheets_onboarding.json`: flujo base para onboarding.
- `n8n/workflows/`: imports listos para request brief, submit brief y generate contract.
- `n8n/README.md`: guia de importacion y mapeo de `.env.local`.
