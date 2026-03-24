# Frontend Governance Docs

Documentacion transversal de `landing` y `admin` para operar la refactorizacion FSM/XState con estandar Senior+.

## Documentos

- `testing-policy.md`: suite automatizada, piramide de pruebas y quality gates.
- `performance-budgets-and-alerts.md`: presupuestos por ruta, ingest de alertas y respuesta operativa.
- `frontend-versioning-and-deprecation.md`: versionado/deprecacion de contratos internos frontend.
- `frontend-security-policy.md`: baseline de seguridad de UI/API publica y privada.

## Alcance

- `landing` (Astro + React)
- `admin` (Next.js 14)

## Estado objetivo

- Cero rutas rotas
- Cero breaking changes en contratos externos
- Paridad funcional con mejoras de rendimiento, trazabilidad y seguridad
