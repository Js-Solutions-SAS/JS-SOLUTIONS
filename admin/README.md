This is the JS Solutions Admin microfrontend built with [Next.js](https://nextjs.org) + Tailwind CSS.

## Key Modules

- `/` Dashboard Operativo
- `/entregas` Calendario y asignación de tareas
- `/capacidad` Gestión de carga por persona/rol
- `/aprobaciones` Flujo de checkpoints (Brief, Scope, QA, UAT, Contract, Scope Change)
- `/cambios` Control de change requests con impacto costo/fecha
- `/sla` Cumplimiento SLA de tickets por tipo de cliente
- `/raid` RAID log por proyecto
- `/cotizaciones` Cotizaciones y contratos
- `/sops` SOPs operativos

## n8n Environment Variables

Create `admin/.env.local`:

```env
N8N_SOPS_WEBHOOK_URL=https://<your-n8n>/webhook/sops
N8N_GET_QUOTES_URL=https://<your-n8n>/webhook/get-quotes
N8N_GENERATE_CONTRACT_URL=https://<your-n8n>/webhook/generate-contract
N8N_MILESTONES_WEBHOOK_URL=https://<your-n8n>/webhook/admin-entregas
N8N_CAPACITY_WEBHOOK_URL=https://<your-n8n>/webhook/admin-capacity
N8N_APPROVALS_WEBHOOK_URL=https://<your-n8n>/webhook/admin-approvals
N8N_APPROVALS_ACTION_WEBHOOK_URL=https://<your-n8n>/webhook/admin-approvals-action
N8N_CHANGE_REQUESTS_WEBHOOK_URL=https://<your-n8n>/webhook/admin-change-requests
N8N_CHANGE_REQUESTS_ACTION_WEBHOOK_URL=https://<your-n8n>/webhook/admin-change-requests-action
N8N_TICKETS_SLA_WEBHOOK_URL=https://<your-n8n>/webhook/admin-tickets-sla
N8N_RAID_WEBHOOK_URL=https://<your-n8n>/webhook/admin-raid-log
N8N_SECRET_TOKEN=<optional_bearer_token>
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tailwind Stability (Important)

This project had intermittent cache corruption that could make styles look uncompiled.

- `npm run dev` uses a dedicated development build directory: `.next-dev`
- `npm run build` uses a dedicated production build directory: `.next-build`
- This prevents collisions between dev server artifacts and production builds.

If you need a hard reset:

```bash
npm run clean:cache
```

Then start dev again:

```bash
npm run dev
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
