# Landing Context

## Mision

`landing` es el motor de demanda de JS Solutions. Debe capturar demanda calificada, convertirla en intake confiable y empujarla por rutas server-side seguras hacia contratos canonicos.

## Stack y arquitectura objetivo

- Astro + React.
- Render estrategico: contenido de marca estatico y rutas publicas dinamicas con cache (`s-maxage` + `stale-while-revalidate`) cuando aplique.
- Islas de hidratacion solo para interacciones necesarias.
- Estado de formularios/cotizador con XState v5 (FSM explicitas).
- Eventos tipados con bus dual (`CustomEvent` + Pub/Sub).

## Reglas no negociables

- No browser -> webhook n8n directo para flujos criticos.
- Todo submission pasa por rutas backend confiables.
- Anti-spam y rate limiting obligatorios.
- Datos de contacto y cotizacion con trazabilidad (`correlationId`).

## Flujos core

- Contacto comercial (`contact_form_machine`).
- Cotizador interactivo (`quote_estimator_machine`) con preview/correccion/envio.
- Tracking de eventos de marketing y conversion.

## Governance agregado (Senior+)

1. Testing automatizado
- Tests de FSM, reducers, bus de eventos y seguridad utilitaria.

2. Performance budgets por ruta
- Monitoreo de web-vitals con alertamiento hacia `POST /api/public/performance-alerts`.

3. Versionado y deprecacion
- Eventos internos con versionado y metadata de deprecacion.

4. Seguridad frontend
- Middleware con CSP y headers.
- Sanitizacion de payloads, honeypot y rate limiting en rutas publicas.

## Documentacion de referencia

- `../docs/testing-policy.md`
- `../docs/performance-budgets-and-alerts.md`
- `../docs/frontend-versioning-and-deprecation.md`
- `../docs/frontend-security-policy.md`
