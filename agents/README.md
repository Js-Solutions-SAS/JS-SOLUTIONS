# Agents Kit

Kit reutilizable de agentes con contrato estandar en frontmatter y secciones fijas.

## Objetivo

- Reusar los mismos agentes en multiples repositorios.
- Garantizar consistencia de rol, entradas, salidas y calidad.

## Estructura

- `engineering/`, `product/`, `marketing/`, `design/`, `project-management/`, `studio-operations/`, `testing/`.
- `_templates/`: plantilla base para nuevos agentes.
- `_schemas/`: validacion del frontmatter.
- `_shared/`: glosario y convenciones comunes.

## Contrato de archivo

Cada agente debe mantener:

- Frontmatter: `id`, `domain`, `role`, `mission`.
- Secciones: `inputs`, `outputs`, `workflow`, `quality_gates`, `dos`, `donts`, `handoff`, `kpis`, `escalation`, `prompt_starters`.

## Versionado sugerido

- `MAJOR`: cambios incompatibles del contrato.
- `MINOR`: nuevos campos/secciones compatibles o nuevos agentes.
- `PATCH`: correcciones de redaccion o claridad.

## Exportacion del kit

Desde la raiz del repo:

```bash
scripts/export-agents-kit.sh 0.1.0
```

Salidas en `.artifacts/`:

- `agents-kit-v0.1.0.tar.gz`
- `agents-kit-v0.1.0.zip`

## Reutilizacion en otro repo

1. Exportar desde este repo.
2. Copiar el artefacto al repo destino.
3. Extraer en la raiz del repo destino.
4. Verificar schema (`agents/_schemas/agent.schema.json`) y plantilla (`agents/_templates/agent-template.md`).
