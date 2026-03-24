# Politica de Testing Frontend

## Objetivo

Garantizar estabilidad funcional, performance y contratos internos en `landing` y `admin` mediante una suite automatizada reproducible en local y CI.

## Stack estandar

- Runner: `vitest`
- DOM tests: `jsdom`
- Testing library: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- Cobertura: `@vitest/coverage-v8`

## Piramide de pruebas requerida

1. Unitarias de FSM/XState
- Cobertura de estados validos e invalidos.
- Validacion de guards, retries, cancelaciones y errores.

2. Unitarias de reducers invertidos
- Tabla `estado + evento -> resultado`.
- Bloqueo explicito de acciones no permitidas segun contexto.

3. Contratos internos de eventos
- Validacion de payload tipado.
- Compatibilidad entre adaptadores (`CustomEvent` y Pub/Sub).
- Versionado de evento y campos de deprecacion.

4. Workers
- Correctitud de calculo.
- Manejo de errores.
- Cancelacion y cleanup (`worker.terminate()`).

5. Integracion de modulos criticos
- `admin`: `cotizaciones`, `aprobaciones`, `cambios` y modulos operativos.
- `landing`: `contact_form_machine` y `quote_estimator_machine`.

6. E2E criticos (gate de release)
- Lead intake.
- Cotizador (preview -> correccion -> envio/aprobacion).
- Aprobaciones y cambios sin regresion UX.

## Criterios de calidad

- Toda FSM nueva debe incluir test de estados invalidos bloqueados.
- Todo bug fix debe incluir test de regresion.
- Ninguna ruta critica se publica sin tests de integracion asociados.

## Comandos estandar

### `admin`

```bash
npm run test
npm run test:coverage
```

### `landing`

```bash
npm run test
npm run test:coverage
```

## Gate minimo de merge

- Tests unitarios/integracion en verde.
- Build en verde.
- Sin errores de tipado.
- Sin cambios breaking no documentados.
