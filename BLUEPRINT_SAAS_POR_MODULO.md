# Blueprint SaaS Por Modulo

## Objetivo

Este documento aterriza la arquitectura del SaaS de JS Solutions por secciones del repo:

- `api`
- `admin`
- `portal`
- `landing`

La idea no es disenar el sistema alrededor de WhatsApp ni de un agente unico. La idea es construir una plataforma robusta donde cada modulo tenga un rol claro y donde `api` sea el nucleo del negocio.

## Principio rector

La arquitectura objetivo debe seguir esta regla:

- `landing` captura demanda
- `portal` opera la experiencia del cliente
- `admin` opera el negocio
- `api` gobierna el modelo canonico
- `n8n` automatiza y orquesta

## 1. API

### Rol

`api` debe ser el `Core Business API` del SaaS.

No debe ser solo un puente hacia n8n. Debe ser el sistema que define:

- entidades canonicas
- reglas de negocio
- estados oficiales
- permisos
- auditoria
- contratos entre modulos

### Lo que ya tiene

- NestJS
- Postgres
- auth interna por token
- persistencia para:
  - `leads`
  - `brief_submissions`
  - `quotes`
  - `contracts`
  - `workflow_events`
- endpoints internos para cotizaciones, briefs y contratos

### Lo que debe llegar a ser

Un monolito modular con dominios claros:

```text
api/src/modules
  iam/
  organizations/
  crm/
  briefs/
  quotes/
  contracts/
  onboarding/
  projects/
  milestones/
  approvals/
  change-requests/
  tickets/
  finance/
  documents/
  notifications/
  workflows/
  audit/
```

### Entidades canonicas recomendadas

- `Organization`
- `User`
- `Client`
- `Lead`
- `Brief`
- `Quote`
- `Contract`
- `Project`
- `Milestone`
- `Approval`
- `ChangeRequest`
- `Ticket`
- `Invoice`
- `PaymentIntent`
- `Document`
- `WorkflowRun`
- `AuditEvent`

### Capas recomendadas

Cada modulo debe separar:

- `controllers`
- `application`
- `domain`
- `infrastructure`
- `dto`
- `entities`

### Responsabilidades concretas

- exponer APIs publicas, client, admin e internas
- persistir todo estado de negocio
- emitir eventos de dominio
- validar permisos y reglas
- registrar auditoria
- exponer contratos estables para frontend y n8n

### Estructura de endpoints recomendada

```text
/api/v1/public/*
/api/v1/client/*
/api/v1/admin/*
/api/v1/internal/*
```

Ejemplos:

```text
/api/v1/public/leads
/api/v1/public/briefs
/api/v1/client/projects/:projectId/dashboard
/api/v1/client/documents
/api/v1/client/tickets
/api/v1/client/approvals
/api/v1/admin/projects
/api/v1/admin/milestones
/api/v1/admin/approvals
/api/v1/admin/change-requests
/api/v1/admin/tickets
/api/v1/admin/finance
/api/v1/internal/workflows/events
/api/v1/internal/webhooks/docusign
/api/v1/internal/webhooks/payments
```

### Criterios de robustez

- DTOs con validacion fuerte
- `correlationId` en toda transaccion
- `idempotencyKey` en mutaciones sensibles
- paginacion, filtros y ordenamiento
- RBAC por rol
- logs estructurados
- auditoria de cambios
- OpenAPI
- colas para procesos largos
- Sentry / observabilidad

### Roadmap de `api`

#### Fase 1

- endurecer el modulo actual de cotizaciones
- crear dominios `projects`, `approvals`, `change-requests`, `tickets`, `finance`
- mover callbacks de firma y pagos a endpoints internos canonicos

#### Fase 2

- publicar contratos `public`, `client` y `admin`
- agregar RBAC real
- agregar Redis + BullMQ para jobs

#### Fase 3

- convertir `api` en la unica fuente de verdad operacional
- dejar Google Sheets solo como staging o migracion

## 2. Admin

### Rol

`admin` debe ser el `Operations Cockpit` del SaaS.

No debe ser un frontend que inventa logica ni que dependa de mocks para operar. Debe ser la interfaz donde el equipo administra el negocio real.

### Lo que ya tiene

- login local
- dashboard
- modulos operativos visibles:
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
- `cotizaciones` ya integrado con `api`
- el resto ya tiene BFF y contratos de vista

### Problema actual

La UI ya existe, pero gran parte de la operacion depende de:

- n8n directo
- mocks
- specs todavia no convertidos en backend real

### Lo que debe llegar a ser

Un cliente interno consumiendo solamente:

- `api` para lectura y escritura de negocio
- `n8n` solo via `api` o via eventos internos para automatizaciones

### Modulos objetivo

#### `cotizaciones`

Debe manejar:

- intake comercial
- brief recibido
- cotizacion en revision
- aprobacion comercial
- contrato
- pago inicial

#### `entregas`

Debe manejar:

- proyectos activos
- hitos
- responsables
- riesgo por fecha
- alertas de vencimiento

#### `capacidad`

Debe manejar:

- carga por persona
- carga por rol
- capacidad semanal
- sobreasignacion
- sugerencias de rebalanceo

#### `aprobaciones`

Debe manejar:

- checkpoints por etapa
- fechas objetivo
- aprobadores
- trazabilidad

#### `cambios`

Debe manejar:

- solicitudes de cambio
- impacto en costo
- impacto en fecha
- decision
- auditoria

#### `sla`

Debe manejar:

- tickets abiertos
- respuesta inicial
- resolucion
- breach de SLA

#### `raid`

Debe manejar:

- riesgos
- supuestos
- issues
- dependencias
- criticidad

#### `finanzas`

Debe manejar:

- presupuesto
- ejecutado
- facturado
- por facturar
- margen estimado

#### `portafolio`

Debe manejar:

- salud del portafolio
- resumen por vertical
- proyectos en riesgo
- presion operativa

### Criterios de calidad para `admin`

- cero mocks en modulos criticos
- filtros y tablas soportados por contratos canonicos
- acciones con feedback y auditoria
- permisos por rol
- vistas pensadas para operacion, no solo para demo

### Roadmap de `admin`

#### Fase 1

- reemplazar mocks por `api` en modulos criticos
- mantener BFF en Next solo para sesion y seguridad

#### Fase 2

- homologar todos los modulos a contratos estables
- agregar estados vacios, errores y observabilidad UI

#### Fase 3

- sumar dashboards operativos y ejecutivos reales

## 3. Portal

### Rol

`portal` debe ser el `Client Workspace` del SaaS.

No solo un dashboard por token. Debe ser el lugar donde el cliente ve, aprueba, carga y solicita cosas.

### Lo que ya tiene

- dashboard con token
- visualizacion de estado
- brief tecnico
- aprobacion de entregables, cotizacion y contrato
- inicio de pago

### Problema actual

Todavia esta muy centrado en el funnel comercial y no tanto en la vida completa del cliente.

### Lo que debe llegar a ser

Un portal de cliente con estas capacidades:

- dashboard del proyecto
- documentos y contratos
- entregables
- aprobaciones
- tickets y solicitudes
- timeline del proyecto
- pagos y facturas
- centro de mensajes/updates

### Modulos objetivo

#### Dashboard

Debe mostrar:

- estado actual
- fase
- progreso
- hitos
- proximas acciones

#### Brief y onboarding

Debe permitir:

- completar brief
- responder preguntas adicionales
- subir anexos
- validar alcance

#### Documentos

Debe permitir:

- ver cotizacion
- ver contrato
- ver entregables
- descargar documentos

#### Aprobaciones

Debe permitir:

- aprobar cotizacion
- aprobar contrato
- aprobar entregables
- ver historial de aprobaciones

#### Tickets y soporte

Debe permitir:

- abrir ticket
- seguir ticket
- ver SLA
- responder requerimientos

#### Pagos

Debe permitir:

- pagar
- ver estado del pago
- ver comprobantes

### Criterios de calidad para `portal`

- autenticacion robusta a mediano plazo
- no depender solo de token magico
- UX sobria y premium
- contratos estables con `api`
- documentos consistentes con estados reales

### Roadmap de `portal`

#### Fase 1

- mover lectura principal de estado hacia `api`
- dejar n8n para enriquecimientos y automatizaciones

#### Fase 2

- agregar tickets, documentos y timeline real

#### Fase 3

- agregar cuentas multiusuario por cliente
- agregar centro de soporte y facturacion

## 4. Landing

### Rol

`landing` debe ser el `Demand Engine` del SaaS.

Su trabajo es:

- captar leads
- calificar demanda
- educar al prospecto
- convertir hacia brief/cotizacion

### Lo que ya tiene

- sitio comercial
- cotizador
- formulario de contacto

### Problema actual

Hoy llama a webhooks de n8n directamente desde el navegador. Eso no es una base profesional ni escalable.

### Lo que debe llegar a ser

Una capa publica elegante y segura, con BFF propio y contratos claros hacia `api`.

### Flujo correcto

#### Contacto

- `landing` envia a su route handler
- la route handler valida
- la route handler llama a `api /public/leads`
- `api` persiste
- `api` emite evento
- `n8n` automatiza follow-up

#### Cotizador

- `landing` calcula experiencia inicial en UI
- la submission va a `api`
- `api` guarda lead y brief comercial
- `api` dispara workflow de enrichment / propuesta

### Capacidades objetivo

- captacion con trazabilidad de canal
- scoring de lead
- brief inicial guiado
- contenido SEO
- formularios protegidos
- eventos de conversion bien instrumentados

### Criterios de calidad para `landing`

- cero webhooks directos desde browser
- rate limit
- validacion
- anti-spam / captcha
- analytics de conversion
- UX premium y rapida

### Roadmap de `landing`

#### Fase 1

- mover contacto y cotizador a BFF
- integrar con `api /public/*`

#### Fase 2

- agregar tracking de acquisition
- scoring y segmentacion de leads

#### Fase 3

- conectar contenido, campañas y conversión a reporting real

## Como se conectan los 4 modulos

### Regla operativa

- `landing` nunca habla directo con n8n
- `portal` idealmente lee y escribe contra `api`
- `admin` opera contra `api`
- `n8n` reacciona a eventos y procesa automatizaciones

### Flujo ideal

```text
landing -> api -> postgres
portal  -> api -> postgres
admin   -> api -> postgres
n8n     <-> api -> postgres
```

## Orden recomendado de implementacion

### Paso 1

Fortalecer `api` y definir entidades canonicas.

### Paso 2

Mover `landing` a BFF y cerrar el funnel comercial bien.

### Paso 3

Conectar `portal` a contratos canonicos del cliente.

### Paso 4

Sacar mocks del `admin` y encender operacion real.

### Paso 5

Dejar `n8n` como orquestador real de sub-workflows y no como backend improvisado.

## Resultado esperado

Si esta estructura se ejecuta bien, el resultado no sera solo "tener workflows".

El resultado sera:

- un SaaS con modelo de negocio consistente
- webs mas profesionales
- menos acoplamiento a herramientas externas
- mejor trazabilidad
- operacion mas escalable
- mejor experiencia para cliente y equipo interno

## Siguiente documento recomendado

El siguiente paso natural despues de este blueprint es crear:

- un `API_BLUEPRINT_DETALLADO.md`

Ese documento deberia incluir:

- tablas SQL
- entidades
- endpoints
- eventos
- permisos
- estrategia de migracion desde el estado actual del repo
