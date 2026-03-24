# Instalacion del Kit de Agents

## Opcion A: Exportar y reutilizar

1. Ejecuta desde la raiz: `scripts/export-agents-kit.sh 0.1.0`
2. Se generan artefactos en `.artifacts/`:
- `agents-kit-v0.1.0.tar.gz`
- `agents-kit-v0.1.0.zip`
3. Copia el artefacto al repo destino.
4. Extrae en la raiz del repo destino.

## Opcion B: Copia directa

1. Copia la carpeta `agents/` completa.
2. Verifica que existan `_templates/`, `_schemas/` y `_shared/`.

## Actualizacion semver

- `MAJOR`: cambio incompatible del contrato.
- `MINOR`: nuevos campos, secciones o agentes compatibles.
- `PATCH`: correcciones de texto, ejemplos o claridad.

## Checklist de upgrade

- Comparar `agents/_schemas/agent.schema.json`.
- Validar archivos con la plantilla `agents/_templates/agent-template.md`.
- Comunicar cambios de `MAJOR` antes de fusionar.
