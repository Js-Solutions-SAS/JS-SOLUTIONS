# Presupuestos y Alertas de Performance por Ruta

## Objetivo

Evitar degradacion silenciosa en experiencia de usuario mediante presupuestos de performance por ruta y alertas operativas automaticas.

## Metricas base

- `LCP` (Largest Contentful Paint)
- `INP` (Interaction to Next Paint)
- `CLS` (Cumulative Layout Shift)
- `FCP` (First Contentful Paint)
- `TTFB` (Time to First Byte)

## Implementacion actual

### `landing`

- Presupuestos definidos en `landing/src/lib/performance/budgets.ts`.
- Captura runtime via `web-vitals` en `landing/src/components/PerformanceBudgetWatcher.tsx`.
- Ingest de alertas en `POST /api/public/performance-alerts`.

### `admin`

- Presupuestos definidos en `admin/lib/performance/budgets.ts`.
- Captura runtime via `web-vitals` en `admin/components/features/performance-budget-watcher.tsx`.
- Ingest de alertas en `POST /api/admin/performance-alerts`.

## Flujo de alertamiento

1. Se mide una metrica en cliente.
2. Se compara contra presupuesto de la ruta actual.
3. Si excede limite, se emite alerta (deduplicada por `route + metric + metric.id`).
4. La alerta se registra en servidor y puede reenviarse a `PERFORMANCE_ALERT_WEBHOOK_URL`.

## Variables de entorno

- `PERFORMANCE_ALERT_WEBHOOK_URL` (opcional): endpoint para centralizar alertas en observabilidad externa.

## SLO recomendado

- 95% de sesiones sin breach en rutas core.
- 0 congelamientos de UI en tablas densas de `admin`.
- Tendencia semanal de breaches a la baja.

## Operacion

- Ajustar presupuestos por ruta cuando haya cambios de UI significativos.
- No subir limites para ocultar regresiones; primero corregir causa raiz.
- Tratar breaches repetidos como incidente de performance.
