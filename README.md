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
```

### 3) Admin (`admin`)

Panel interno para operación: SOPs, gestión de cotizaciones y generación de contratos.

- Stack: Next.js 14 + React + Tailwind
- Rutas principales:
  - `/` (dashboard interno)
  - `/sops` (consulta SOPs)
  - `/cotizaciones` (lista leads y genera contratos)
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
N8N_GENERATE_CONTRACT_URL=https://tu-n8n/webhook/generate-contract
N8N_SECRET_TOKEN=tu_token_bearer_opcional
```

Notas:

- Si `N8N_GET_QUOTES_URL` no está configurada, el módulo de cotizaciones devuelve datos mock para no romper la UI.
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
