# Admin Context

## Mision

`admin` es el cockpit operativo interno de JS Solutions. Debe permitir operar ventas, entrega, aprobaciones, cambios, SLA y finanzas para 50+ clientes sin estado oculto ni flujos fragüiles.

## Stack y arquitectura objetivo

- Next.js 14.
- Dominios desacoplados con estructura uniforme: `domain/<modulo>/{model,machine,services,events,ui,hooks}`.
- Estado con XState v5 y transiciones explicitas por evento.
- Context splitting (`StateContext` y `DispatchContext`) para reducir re-renders.
- Bus de eventos dual (`CustomEvent` + Pub/Sub) con contrato tipado y versionado.

## Reglas no negociables

- Ningun modulo critico puede depender de mocks en produccion.
- Toda mutacion debe reflejar estado operativo y feedback accionable.
- Todas las acciones deben ser trazables (`correlationId`).
- Ninguna ruta critica se despliega sin tests y build en verde.

## Modulos core

- `cotizaciones`
- `aprobaciones`
- `cambios`
- `entregas`
- `sla`
- `finanzas`
- `raid`
- `capacidad`
- `portafolio`
- `sops`

## Governance agregado (Senior+)

1. Testing automatizado
- Unit tests de FSM/reducers/event bus/workers.
- Integracion por modulo y E2E criticos.

2. Performance budgets por ruta
- Medicion web-vitals en cliente.
- Alertas server-side con endpoint `POST /api/admin/performance-alerts`.

3. Versionado y deprecacion
- Contratos internos de evento con version.
- Ventana de compatibilidad y sunset explicito.

4. Seguridad frontend
- CSP/headers duros.
- Honeypot en login + validacion server-side.

## Documentacion de referencia

- `../docs/testing-policy.md`
- `../docs/performance-budgets-and-alerts.md`
- `../docs/frontend-versioning-and-deprecation.md`
- `../docs/frontend-security-policy.md`
