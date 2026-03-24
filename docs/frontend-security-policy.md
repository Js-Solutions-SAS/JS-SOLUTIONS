# Politica de Seguridad Frontend

## Objetivo

Reducir superficie de ataque en `landing` y `admin` con controles preventivos en cliente, middleware y rutas server.

## Controles obligatorios

1. CSP y headers
- `Content-Security-Policy` en `admin/next.config.mjs` y `landing/src/middleware.ts`.
- Headers obligatorios: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP`.
- `Strict-Transport-Security` en produccion.

2. Sanitizacion de entradas
- Toda entrada publica debe pasar por sanitizacion (`landing/src/lib/security/sanitize.ts`).
- Normalizacion de email y payload antes de mutaciones.

3. Anti-automation
- Honeypot en formularios de `landing` y login `admin`.
- Bloqueo de requests cuando honeypot contiene valor.

4. Rate limiting
- Rate limit por IP/ruta para endpoints publicos y alertas de performance.
- Respuesta `429` con `Retry-After`.

5. Contratos seguros
- Validacion de esquema minima en payloads de API route.
- Rechazo temprano (`400`) ante payload invalido.

## Endpoints sensibles cubiertos

- `landing/src/pages/api/public/leads/intake.ts`
- `landing/src/pages/api/public/quotes/estimate.ts`
- `landing/src/pages/api/public/marketing/events.ts`
- `landing/src/pages/api/public/performance-alerts.ts`
- `admin/app/login/actions.ts`

## Reglas de operacion

- No exponer secretos en cliente.
- No aceptar HTML embebido en campos de texto libre.
- No remover honeypot/rate-limit para “destrabar” demos.
- Toda excepcion de seguridad debe quedar documentada y con fecha de retiro.

## Auditoria continua

- Revisar CSP cuando se agregan nuevos proveedores third-party.
- Monitorear 429 y patrones de abuso.
- Ejecutar pruebas de regresion de formularios ante cambios de seguridad.
