# README - Base para `context.md` y Super Agente n8n

## Objetivo

Este documento sirve como base de trabajo para construir un `context.md` util, ejecutable y alineado con el SaaS actual de JS Solutions.

La recomendacion no es construir un unico agente opaco en n8n. La estructura correcta para este repo es:

- `1` workflow supervisor que enruta
- `N` sub-workflows deterministas por dominio
- contratos canonicos de datos
- trazabilidad con `correlationId` e `idempotencyKey`
- una fuente de verdad operacional clara

## Alcance revisado

Se revisaron estas carpetas y artefactos:

- `landing`
- `portal` 
- `admin`
- `api`
- `n8n`
- `README.md`
- `context.md`
- `n8n_context.md`
- `n8n_*_spec.md`

## Resumen ejecutivo

El repo ya tiene una base SaaS coherente, pero hoy esta partido en dos niveles de madurez:

- El flujo comercial principal ya existe de forma utilizable: lead -> brief -> cotizacion -> aprobacion -> contrato -> pagos.
- El flujo operativo expandido ya tiene UI, contratos y specs, pero todavia no tiene los workflows de n8n implementados en JSON ni una base de datos canonica completa para esos modulos.

La mejor pieza actual para ser el backbone del super agente es `api`, porque ya tiene:

- Postgres
- entidades persistentes
- autenticacion interna
- llamadas seguras a n8n
- logging de eventos de workflow

La parte mas debil hoy es `landing`, porque llama a n8n directamente desde el navegador en formularios publicos, lo cual rompe el patron BFF documentado en `n8n_context.md`.

## Estado actual del SaaS

| Modulo | Rol | Estado real | Observacion |
| --- | --- | --- | --- |
| `landing` | Captacion publica | Parcialmente operativo | Tiene cotizador y formulario, pero ambos pegan directo a webhooks publicos |
| `portal` | Experiencia de cliente | Parcialmente operativo | Tiene dashboard por token, brief tecnico, aprobaciones y pagos |
| `admin` | Operacion interna | Mixto | `cotizaciones` esta conectada a `api`; el resto depende de n8n o mocks |
| `api` | Backend interno / capa orquestadora | Operativo | Es la base mas madura del repo |
| `n8n` | Automatizacion | Parcial | Hay workflows comerciales; faltan los workflows operativos avanzados |

## Capacidades reales por modulo

### `api`

Capacidades ya implementadas:

- `GET /health`
- `GET /health/db`
- `GET /api/v1/quotes`
- `POST /api/v1/leads/intake`
- `POST /api/v1/brief/request`
- `POST /api/v1/quotes/generate`
- `POST /api/v1/contracts/generate`
- `GET /api/v1/leads/:leadId`
- `POST /api/v1/workflow-events`
- `GET /api/v1/workflow-events`

Fuente de verdad actual en Postgres:

- `leads`
- `brief_submissions`
- `quotes`
- `contracts`
- `workflow_events`

Fortalezas:

- Protege endpoints internos con `API_INTERNAL_TOKEN`
- Normaliza `correlationId` e `idempotencyKey`
- Persiste estados minimos del funnel comercial
- Registra eventos de exito y error de workflows
- Encapsula llamadas a n8n con timeout y headers consistentes

Huecos:

- No cubre todavia entidades operativas del SaaS completo: proyectos, hitos, tickets, aprobaciones, cambios, capacidad, RAID, finanzas
- No es aun el BFF completo de `portal`
- No consume directamente callbacks de firma y pagos; esa parte sigue viviendo en n8n
- Solo hay pruebas propias en `api/test/app.e2e-spec.ts`

### `landing`

Capacidades ya implementadas:

- Sitio comercial en Astro
- Cotizador interactivo con rangos de precio
- Formulario de contacto

Fortalezas:

- Mensaje comercial claro
- Experiencia visual ya construida
- Cotizador enfocado en servicios reales de la oferta

Huecos:

- El cotizador envia al webhook `cotizador_js_solutions` directo desde el cliente
- El formulario de contacto envia a `contact-form` directo desde el cliente
- No hay BFF propio para validar, rate-limitar, filtrar spam ni centralizar logs
- No hay persistencia propia en `api`
- No hay test coverage

Conclusion:

`landing` sirve para captar demanda, pero no deberia seguir pegando a n8n desde el navegador si esto va a escalar.

### `portal`

Capacidades ya implementadas:

- Dashboard de cliente basado en `token`
- Lectura de estado del proyecto desde n8n
- Wizard de brief tecnico
- Acciones de aprobacion para:
  - entregables
  - cotizacion
  - contrato
- Inicio de flujo de pago

Fortalezas:

- Ya existe un contrato de dashboard razonable
- El brief tecnico tiene payload estructurado
- Las aprobaciones y pagos ya tienen server actions

Huecos:

- No hay autenticacion multiusuario; el acceso depende del `token`
- No hay modulo real de tickets, mensajes, carga de archivos o centro documental avanzado
- No hay validacion previa del token en la pagina del brief
- No hay fuente de verdad propia para estados del cliente; depende de lo que n8n responda
- No hay pruebas propias

Conclusion:

`portal` ya funciona como experiencia cliente para el funnel comercial extendido, pero no como portal SaaS completo de postventa/operacion.

### `admin`

Capacidades ya implementadas:

- Login local con sesion
- Dashboard operativo
- Modulos visibles para:
  - `cotizaciones`
  - `entregas`
  - `capacidad`
  - `aprobaciones`
  - `cambios`
  - `sla`
  - `portafolio`
  - `finanzas`
  - `raid`
  - `sops`

Fortalezas:

- `cotizaciones` ya trabaja contra `api`
- Existen rutas BFF para la mayoria de modulos operativos
- Existen server actions para mutaciones de `aprobaciones` y `cambios`
- La UI ya expresa los contratos que n8n debe cumplir

Huecos:

- Fuera de `cotizaciones`, la mayoria de modulos leen desde n8n o caen en mock data si falta configuracion
- No hay workflows JSON importables en `n8n/workflows` para la mayoria de estos modulos
- Hay specs tecnicos, pero no backend canonico operativo
- No hay cobertura de pruebas del frontend admin

Conclusion:

`admin` ya define el SaaS operativo que quieren vender y usar internamente, pero hoy es mas una shell de operacion que un sistema totalmente conectado.

### `n8n`

Workflows JSON ya presentes:

- `JS Solutions - Create Quote Intake`
- `JS Solutions - Request Technical Brief`
- `JS Solutions - Submit Technical Brief`
- `JS Solutions - Get Quotes`
- `JS Solutions - Generate Quote`
- `JS Solutions - Portal Approval Router`
- `JS Solutions - Generate Contract`
- `JS Solutions - Project Status`
- `JS Solutions - Signature Callback DocuSign`
- `JS Solutions - Payments Create`
- `JS Solutions - Payments Callback Bancolombia`

Fortalezas:

- Ya existe el pipeline comercial completo en formato importable
- Existe esquema SQL base para Postgres operativo
- Ya hay espacio para callbacks de firma y pagos

Huecos:

- No existen workflows JSON para:
  - `sops`
  - `entregas`
  - `capacidad`
  - `aprobaciones`
  - `cambios`
  - `sla`
  - `raid`
  - `finanzas`
  - `portafolio`
- No existe workflow supervisor del super agente
- No existe laboratorio/sandbox para probar herramientas por dominio
- No existe registro canonico de herramientas, decisiones del agente y replay de ejecuciones

## Lo que ya tenemos

- Una separacion SaaS valida entre captacion, portal cliente, operacion interna y backend
- Un backend real en NestJS con Postgres
- Un funnel comercial funcional soportado por n8n
- Un esquema SQL que ya sugiere evolucion hacia fuente de verdad propia
- Un `admin` con modulos que ya definen contratos de negocio
- Un `portal` que ya prueba el loop cliente -> brief -> aprobacion -> pago
- Specs tecnicos para workflows operativos avanzados

## Lo que falta

### Faltantes estructurales

- Definir una sola fuente de verdad operacional
- Unificar estados canonicos del negocio
- Mover `landing` a patron BFF
- Convertir specs de operaciones en workflows reales
- Eliminar dependencia en mocks para modulos criticos
- Aumentar cobertura de pruebas

### Faltantes para el super agente

- Workflow supervisor
- Registro de herramientas disponibles por dominio
- Catalogo de sub-workflows con entradas/salidas canonicas
- Politicas de decision y escalamiento
- Persistencia de memoria operativa
- Observabilidad por ejecucion
- Modo sandbox para pruebas sin impacto productivo

### Faltantes para el SaaS completo

- Onboarding automatico de proyecto
- Provision de SOPs por tipo de servicio
- Tickets y soporte
- Centro documental y carga de archivos
- Gobierno de aprobaciones end-to-end
- Planeacion de capacidad real
- Control financiero operativo real
- Vista ejecutiva consolidada por vertical/industria

## Decision de arquitectura recomendada

No construyan un "super agente" como una sola cadena gigante de prompts y tools.

Construyan esto:

- `WF_Super_Agent_Router`
- sub-workflows especializados
- fuentes de datos canonicas
- nodos de IA acotados para clasificar, resumir y redactar
- nodos deterministas para escribir estados, crear tareas, emitir documentos y disparar notificaciones

Regla practica:

- IA para interpretar y decidir dentro de limites
- codigo y BD para persistir y gobernar
- n8n para orquestar y conectar

## Arquitectura objetivo del super agente

### 1. Workflow supervisor

`WF_Super_Agent_Router`

Responsabilidades:

- recibir evento o solicitud
- identificar dominio
- validar credenciales/contexto
- asignar `correlationId`
- asignar `idempotencyKey`
- enrutar a un sub-workflow
- registrar auditoria
- responder en formato canonico

Entrada canonica sugerida:

```json
{
  "source": "landing|portal|admin|scheduler|webhook",
  "eventType": "lead.created",
  "tenantId": "js-solutions",
  "leadId": "lead-123",
  "projectId": "proj-123",
  "clientToken": "token-123",
  "actor": {
    "type": "client|admin|system"
  },
  "payload": {},
  "correlationId": "corr-123",
  "idempotencyKey": "idem-123"
}
```

### 2. Sub-workflows recomendados

#### Funnel comercial y pre-venta

- `WF_Lead_Intake_And_Triage`
- `WF_Brief_Request_And_Delivery`
- `WF_Brief_Submission_And_Enrichment`
- `WF_Quote_Generation_And_Revision`
- `WF_Quote_Approval_And_Contracting`
- `WF_Payments_And_Collections`
- `WF_Signature_Callbacks`

#### Onboarding y provision

- `WF_Project_Onboarding`
- `WF_SOP_Template_Provisioning`
- `WF_Drive_And_Docs_Provisioning`
- `WF_Client_Portal_Provisioning`

#### Operacion y gobernanza

- `WF_Milestone_Reminders`
- `WF_Capacity_Monitor`
- `WF_Raid_Log_Governance`
- `WF_Approvals_Governance`
- `WF_Change_Requests_Control`
- `WF_Tickets_SLA_Control`
- `WF_Operational_Finance_Control`
- `WF_Executive_Portfolio_Health`

#### Capa transversal

- `WF_Notification_Center`
- `WF_Audit_And_Observability`
- `WF_Knowledge_And_SOP_Sync`
- `WF_Tool_Sandbox`

## Catalogo inicial de herramientas a probar con n8n

La idea correcta es probar herramientas por dominio, no mezclar todo de una.

### Ya presentes o insinuadas en el repo

| Herramienta / Integracion | Estado | Comentario |
| --- | --- | --- |
| Postgres | Parcialmente real | Ya lo usa `api` y existe SQL base en `n8n/sql` |
| Google Sheets | Parcial | Los workflows/specs lo asumen como fuente transicional |
| Gmail / email transaccional | Parcial | Referenciado en docs de importacion |
| DocuSign | Parcial | Existe callback, pero falta cierre completo en backend canonico |
| Bancolombia Button | Parcial | Existen create/callback workflows |
| OpenAI / LLM | Implicito | No hay un contrato unico en repo, pero el cotizador lo presupone |
| Google Drive / Docs | Parcial | Hay referencias en portal y specs, pero no capa canonica completa |

### Herramientas que faltan para la vision completa

| Herramienta / Integracion | Prioridad | Uso esperado |
| --- | --- | --- |
| Slack o Teams | Alta | Alertas operativas y escalaciones |
| Notion o Airtable | Media | Base colaborativa o staging operacional |
| CRM formal | Alta | Seguimiento comercial y lifecycle |
| Helpdesk | Alta | Tickets SLA reales |
| WhatsApp / canales conversacionales | Media | Notificaciones y soporte cliente |
| Almacenamiento de archivos serio | Alta | S3, Drive gobernado o equivalente |
| OCR / parser documental | Media | Contratos, soportes, anexos |
| BI / dashboards | Media | Vista ejecutiva y tendencias |
| Vector store / knowledge base | Media | SOPs, contexto por proyecto y memoria del agente |

## Herramientas concretas que el super agente deberia poder ejecutar

Estas no son solo integraciones. Son herramientas operativas con valor directo para el SaaS.

### Herramientas comerciales

- `tool_lead_qualifier`: clasifica leads por servicio, ticket esperado y urgencia
- `tool_brief_parser`: convierte un brief en requerimientos estructurados
- `tool_scope_classifier`: decide si la venta es automatizacion, software, soporte o paquete mixto
- `tool_quote_drafter`: arma la propuesta inicial
- `tool_quote_reviewer`: compara feedback vs propuesta y propone ajustes
- `tool_contract_assembler`: prepara contrato desde plantilla y datos canonicos

### Herramientas de onboarding

- `tool_project_bootstrapper`: crea proyecto, IDs, carpetas, accesos y plantillas base
- `tool_sop_instantiator`: provisiona SOPs segun tipo de servicio vendido
- `tool_portal_provisioner`: activa assets del cliente en portal
- `tool_kickoff_pack_builder`: prepara correo, docs y checklist de arranque

### Herramientas de operacion

- `tool_milestone_watchdog`: detecta hitos vencidos o en riesgo
- `tool_capacity_balancer`: detecta sobrecarga y propone redistribucion
- `tool_approval_chaser`: identifica checkpoints vencidos y dispara seguimiento
- `tool_change_impact_analyzer`: estima impacto en costo/fecha
- `tool_raid_detector`: resume riesgos criticos abiertos por proyecto
- `tool_sla_watchtower`: monitorea tickets fuera de SLA
- `tool_finance_guard`: detecta desvio de presupuesto y facturacion pendiente
- `tool_portfolio_summarizer`: produce resumen ejecutivo por vertical

### Herramientas de conocimiento y soporte

- `tool_sop_retriever`: busca SOPs relevantes para una tarea
- `tool_context_builder`: compone contexto de proyecto para otros workflows
- `tool_client_update_writer`: redacta update para cliente desde eventos del proyecto
- `tool_internal_handoff_writer`: redacta handoff entre ventas, PM y operaciones
- `tool_incident_triage`: clasifica incidentes y decide flujo de escalamiento

### Herramientas transversales

- `tool_audit_logger`: registra decision, payload, source y resultado
- `tool_notification_dispatcher`: envia notificaciones a Slack, email, WhatsApp o Teams
- `tool_replay_execution`: reintenta una corrida con el mismo contexto
- `tool_sandbox_runner`: ejecuta pruebas contra datos de staging o fixtures
- `tool_schema_validator`: valida contratos antes de tocar sistemas externos

## Backlog recomendado

### Fase 0 - Poner orden antes del agente

- Definir entidad canonica para `lead`, `project`, `approval`, `changeRequest`, `ticket`, `milestone`, `payment`, `document`
- Definir vocabulario de estados unico para todo el SaaS
- Elegir fuente de verdad: `Postgres primero`, `Google Sheets solo como transicion`
- Mover `landing` a rutas server-side propias
- Consolidar contratos de entrada/salida por workflow

### Fase 1 - Cerrar el funnel comercial actual

- Consolidar en `api` todo lo que hoy esta disperso entre `portal` y n8n
- Persistir callbacks de firma y pagos contra tablas canonicas
- Alinear `project-status` con un modelo de proyecto real y no solo con respuesta ad hoc
- Agregar pruebas del flujo `lead -> brief -> quote -> approval -> contract -> payment`

### Fase 2 - Crear el super agente en serio

- Implementar `WF_Super_Agent_Router`
- Implementar `WF_Notification_Center`
- Implementar `WF_Audit_And_Observability`
- Implementar `WF_Tool_Sandbox`
- Publicar catalogo de tools disponibles por sub-workflow

### Fase 3 - Encender modulos operativos del admin

- `WF_Milestone_Reminders`
- `WF_Capacity_Monitor`
- `WF_Raid_Log_Governance`
- `WF_Approvals_Governance`
- `WF_Change_Requests_Control`
- `WF_Tickets_SLA_Control`
- `WF_Operational_Finance_Control`
- `WF_Executive_Portfolio_Health`
- `WF_SOP_Template_Provisioning`

### Fase 4 - Completar la propuesta SaaS

- Onboarding automatico del proyecto despues de aprobacion/pago
- Creacion automatica de carpeta, docs, accesos y SOPs base
- Tickets cliente desde portal
- Centro documental de cliente
- Panel ejecutivo con tendencias y alertas

## Contenido minimo que debe tener el futuro `context.md`

El `context.md` no debe ser filosofico. Debe ser operativo.

Debe incluir:

- identidad del negocio
- lineas de servicio
- mapa de modulos del SaaS
- entidades canonicas
- estados canonicos
- catalogo de workflows
- catalogo de herramientas por workflow
- contratos de payload
- reglas de negocio
- reglas de seguridad
- reglas de escalamiento
- reglas de idempotencia
- reglas de trazabilidad
- variables de entorno por modulo
- matriz de ownership
- matriz de cosas construidas vs faltantes

## Propuesta de secciones para ese `context.md`

```md
# Context

## Business Identity
## SaaS Modules
## Canonical Entities
## Canonical States
## Workflow Catalog
## Tool Catalog
## Integration Contracts
## Security Rules
## Escalation Rules
## Observability Rules
## Environment Matrix
## Current Gaps
## Build Priorities
```

## Hallazgos criticos de esta revision

- La carpeta correcta es `portal`, no `portals`
- `landing` no sigue el patron BFF y expone dependencia directa a n8n
- `admin` ya tiene muy buena definicion funcional, pero la mayoria de modulos aun no tienen workflows importables reales
- `api` ya es la mejor base para ser el sistema nervioso central
- El repo ya contiene la vision del SaaS, pero todavia no el sistema unificado
- Si intentan meter toda la inteligencia en un solo workflow, van a perder control, trazabilidad y mantenibilidad

## Recomendacion final

El camino correcto es:

1. usar `api` + Postgres como capa canonica
2. dejar n8n como orquestador y router de sub-workflows
3. cerrar el funnel comercial existente
4. convertir los specs operativos en workflows reales
5. construir despues el `context.md` con contratos, estados y tools reales

Este README ya puede usarse como documento semilla para reescribir `context.md` en una version mucho mas ejecutable.
