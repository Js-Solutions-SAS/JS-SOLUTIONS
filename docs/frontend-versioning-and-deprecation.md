# Politica de Versionado y Deprecacion Frontend

## Objetivo

Controlar evolucion de contratos internos de frontend sin romper compatibilidad entre dominios, bus de eventos y maquinas de estado.

## Alcance

- Contrato `DomainEvent<T>`.
- Nombres de evento versionados (`eventName.vN`).
- Metadata de contrato en eventos (`version`, `deprecatedSince`, `sunsetAt`, `replacedBy`, `contractId`).

## Reglas

1. Versionado semantico interno
- `MAJOR`: cambio incompatible de payload o semantica del evento.
- `MINOR`: campo nuevo opcional o comportamiento compatible.
- `PATCH`: correccion interna sin impacto de contrato.

2. Publicacion de eventos
- Todo evento nuevo debe incluir `version`.
- Todo handler debe validar version soportada.
- Los dominios consumidores no deben importar implementacion privada de otro dominio.

3. Deprecacion
- Marcar contrato con `deprecatedSince` en el release donde se depreca.
- Definir `replacedBy` y fecha de `sunsetAt`.
- Mantener periodo de compatibilidad minimo de 2 ciclos de release.

4. Retiro
- Solo remover versiones deprecadas despues de `sunsetAt`.
- Remocion requiere changelog tecnico y pruebas de regresion.

## Implementacion actual

- Helpers en `admin/domain/core/events/types.ts` y `landing/src/domain/core/events/types.ts`:
  - `toVersionedEventName`
  - `parseVersionedEventName`
  - `isSupportedVersion`
  - `isDeprecatedEvent`
- Bus dual con contrato unico y adaptadores DOM/PubSub.

## Checklist de cambio de contrato

- Actualizar tipos y helpers.
- Agregar tests de compatibilidad de version.
- Documentar deprecacion y reemplazo.
- Comunicar ventana de sunset a los equipos consumidores.
