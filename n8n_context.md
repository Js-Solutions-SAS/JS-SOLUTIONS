# Arquitectura de Integración JS Solutions ↔ n8n

Este documento detalla la estructura y el flujo de la información entre los diferentes microfrontends de la aplicación (Landing, Portal, Admin) basados en Next.js y **n8n** (que actúa como motor central de orquestación, automatizaciones y lógica de backend).

## Principio General: Patrón "Backend for Frontend" (BFF)

Para garantizar la **seguridad** de los datos y las credenciales (evitando exponer las URLs de tus Webhooks de n8n en el navegador público), la comunicación **NUNCA** debe realizarse directamente desde el cliente web (navegador) hacia n8n. El flujo obligatorio a seguir es:

1. **Frontend (Navegador):** El usuario ejecuta una acción (ej. un clic de "Enviar" o cargar una vista de tabla).
2. **Next.js API Routes (BFF):** El frontend realiza una petición HTTP a una ruta de servidor de su propio módulo (ej. `/api/submit-lead` o `/api/admin/quotes`).
3. **Orquestación y Petición a n8n:** La ruta de API del servidor de Next.js se encarga de:
   - Validar/Autenticar la sesión.
   - Formatear la petición.
   - Realizar la llamada HTTP segura (usualmente un `POST` o `GET`) al **Webhook correspondiente en n8n**.
4. **Ejecución en n8n:** n8n recibe los datos de entrada y ejecuta su _workflow_. Esto incluye consultar PostgreSQL, escribir en Google Sheets, interactuar con otros servicios o generar PDFs.
5. **Respuesta:** n8n retorna un JSON de respuesta al servidor Next.js, el cual devuelve esa respuesta transformada o limpia al frontend.

---

## 1. Módulo Landing (Público)

**Contexto:** Aplicación orientada a Marketing, adquisición de clientes y visibilidad (SEO). No requiere inicio de sesión.

### Funcionalidad Orquestada por n8n:

- **Gestión de Formularios / Captación de Leads:** Entrada de contactos e intenciones de compra del público en general.

### Flujo de Operación:

- **Evento:** Un visitante llena un formulario de contacto.
- **Ruta Intermedia:** Envío a una ruta en el servidor de la landing (ej. `POST /api/contact`).
- **Webhook de n8n:** La API envía a n8n un payload con nombre, correo, teléfono y el motivo.
- **Acciones del Workflow en n8n:**
  1. Guardar el nuevo contacto en Google Sheets o en una tabla de Prospects en base de datos.
  2. Enviar notificaciones internas: Disparar un mensaje a un canal de Slack/Teams del equipo de ventas avisando sobre el nuevo Lead.
  3. Enviar correo transaccional: Responderle inmediatamente al visitante un correo de "Hemos recibido tu mensaje".

---

## 2. Módulo Portal (Privado / Suscriptores)

**Contexto:** Dashboard de los clientes activos (requiere Autenticación). Aquí los clientes revisan el estado de sus proyectos contratados o consumen suscripciones.

### Funcionalidad Orquestada por n8n:

- **Obtención de Datos de Avance:** Consulta dinámica y en tiempo real del estatus contractual y operativo para cada usuario.
- **Peticiones/Tickets de los Usuarios:** Interacción bidireccional entre el cliente y el área operativa.

### Flujo de Operación:

- **Carga de Datos Inicial (Lectura):**
  - Al ingresar al Portal, la aplicación necesita renderizar información, por lo cual llama a `/api/user-summary`.
  - La API transfiere el ID asociado al usuario local hacia un Webhook (Ej: Webhook _Gets Client Data_).
  - n8n compila la información de diferentes fuentes (Google Sheets para tiempos, Base de datos para credenciales) y la retorna en una estructura consolidada para ser procesada por Next.js y visualizada en las gráficas o tablas correspondientes en el Portal.
- **Acción del Usuario (Escritura):**
  - Si el cliente requiere subir un documento o abrir un ticket, ingresa a `POST /api/tickets/create`.
  - El workflow en n8n recibe esta información, sube el adjunto a una carpeta de Google Drive / S3, crea una solicitud en un CRM interno administrativo, y retorna la etiqueta o ID del ticket al Portal del usuario.

---

## 3. Módulo Admin (Gestión Interna)

**Contexto:** Herramienta potente y restringida al equipo en donde gestionan operaciones de negocio críticas (SOPs, Cotizaciones, Generación de Contratos).

### Funcionalidad Orquestada por n8n:

- **Core Lógico Integral:** n8n hace el trabajo pesado manejando el listado, filtrado, lectura y escritura de Standard Operating Procedures (SOPs) y Cotizaciones. Realiza automatizaciones que quitan trabajo manual al equipo administrativo.

### Flujo de Operación:

- **Panel Informativo (Data Tables):**
  - El frontend del admin renderiza un componente `DataTable` complejo.
  - LLama a `/api/admin/sops` o `/api/admin/pending-quotes`.
  - El Webhook de n8n lee todos los registros y los entrega de vuelta.
- **Acciones Críticas - Flujo de Cotizaciones a Contratos:**
  1. El personal interno revisa y valida cierta información en la tabla y cliquea **"Generar Contrato"** para una cotización pendiente.
  2. El frontend ejecuta un request `POST /api/admin/process-quote` enviando elementos críticos (`quote_id`, información rectificada por el admin).
  3. **Workflow de Orquestación en n8n entra en acción:**
     - n8n toma el `quote_id` y obtiene los datos del cliente desde la base de datos maestra.
     - Localiza el template o plantilla de contrato correspondiente.
     - Incrusta o mapea los datos de la cotización dentro de la plantilla.
     - Genera (usurpando un servicio integrado para PDF/Word) el contrato final.
     - **Actualiza** de manera central el registro en Google Sheets con estatus: _"Contrato Generado"_.
  4. La API retorna un flag de HTTP 200 de regreso.
  5. Automáticamente, en el dashboard del Admin, el `DataTable` refresca sus datos reflejando que ese registro ya se ha completado.

---

## 4. Módulo Entregas (Calendario Operativo)

**Contexto:** Vista táctica para PM/Operaciones con hitos, fechas compromiso y alertas de riesgo por proyecto.

### Funcionalidad Orquestada por n8n:

- **Consolidación de Hitos:** Unifica entregables desde Google Sheets/DB para alimentar el calendario del Admin.
- **Recordatorios y Escalaciones Automáticas:** Ejecuta avisos T-7/T-3/T-1 y escalación de vencidos/bloqueados.

### Flujo de Operación:

- **Lectura de Entregas (BFF):**
  - El frontend del admin consulta `GET /api/admin/entregas`.
  - La API de Next.js llama al webhook `N8N_MILESTONES_WEBHOOK_URL`.
  - n8n responde hitos en JSON (array directo o `data/milestones`), incluyendo `dueDate`, `owner`, `status`, `industry` y `externalUrl`.

- **Workflow `WF_Milestone_Reminders`:**
  1. Trigger programado diario (08:00, Mon-Fri).
  2. Lectura de hitos no completados.
  3. Cálculo de ventana de riesgo (`days_to_due`) y estado (`HIGH/MEDIUM/LOW`).
  4. Notificaciones por Slack/Email según reglas:
     - `T-7`, `T-3`, `T-1`
     - `OVERDUE_ESCALATION` para vencidos o bloqueados prolongados.
  5. Registro de trazabilidad en tabla de logs.

> Especificación técnica completa: `n8n_milestone_reminders_spec.md`.

---

## 5. Módulo Capacidad (Carga por Persona/Rol)

**Contexto:** Vista táctica para evitar sobreasignación de equipo y proteger compromisos de entrega.

### Funcionalidad Orquestada por n8n:

- **Consolidación de Capacidad Semanal:** Unifica disponibilidad vs asignación por persona/rol.
- **Monitoreo Preventivo:** Clasifica utilización por banda (`HEALTHY`, `WARNING`, `OVER`) y dispara alertas.

### Flujo de Operación:

- **Lectura de Capacidad (BFF):**
  - El frontend del admin consulta `GET /api/admin/capacidad`.
  - La API de Next.js llama al webhook `N8N_CAPACITY_WEBHOOK_URL`.
  - n8n responde registros por persona con `capacityHours`, `assignedHours`, `projectCount`, `role` y `weekLabel`.

- **Workflow `WF_Capacity_Monitor`:**
  1. Trigger programado diario (07:30, Mon-Fri).
  2. Lectura de capacidad semanal desde Google Sheets/DB.
  3. Cálculo de utilización por recurso.
  4. Clasificación:
     - `OVER` > 100%
     - `WARNING` 85%-100%
     - `HEALTHY` < 85%
  5. Notificaciones:
     - `OVER`: alerta inmediata a PM/Operaciones.
     - `WARNING`: aviso preventivo al owner.
  6. Registro de snapshot en tabla histórica.

> Especificación técnica completa: `n8n_capacity_management_spec.md`.

---

## 6. Módulo RAID Log (Riesgos, Supuestos, Issues, Dependencias)

**Contexto:** Gobernanza operativa por proyecto para anticipar bloqueos, validar supuestos críticos y gestionar dependencias externas.

### Funcionalidad Orquestada por n8n:

- **Consolidación RAID por Proyecto:** Unifica registros de riesgos, supuestos, issues y dependencias desde Google Sheets/DB.
- **Priorización y Escalamiento:** Detecta elementos críticos abiertos y notifica responsables.

### Flujo de Operación:

- **Lectura de RAID (BFF):**
  - El frontend del admin consulta `GET /api/admin/raid`.
  - La API de Next.js llama al webhook `N8N_RAID_WEBHOOK_URL`.
  - n8n responde registros RAID por proyecto con `type`, `status`, `priority`, `owner`, `dueDate` y `externalUrl`.

- **Workflow `WF_Raid_Log_Governance`:**
  1. Trigger programado diario (08:00, Mon-Fri).
  2. Lectura de `RAID_Log` (activos y cerrados recientes).
  3. Normalización de categorías y estados:
     - `Risk | Assumption | Issue | Dependency`
     - `Open | Mitigated | Blocked | Closed`
  4. Detección de `Critical Open` (Open/Blocked + High/Critical).
  5. Notificación a PM/owner con enlace de acción al admin.
  6. Registro de snapshot histórico para auditoría.

> Especificación técnica completa: `n8n_raid_management_spec.md`.

---

## 7. Módulo Aprobaciones (Brief, Alcance, QA, UAT, Contrato, Cambio de Alcance)

**Contexto:** Gobierno operativo de checkpoints formales para asegurar trazabilidad de decisiones y evitar entregas sin validación.

### Funcionalidad Orquestada por n8n:

- **Matriz de Aprobaciones por Proyecto:** Centraliza estado de aprobaciones por etapa y responsable.
- **Escalación de Aprobaciones Vencidas:** Detecta vencimientos y notifica a PM/Operaciones.
- **Mutaciones de Aprobación:** Procesa acciones de aprobar desde Admin y registra auditoría.

### Flujo de Operación:

- **Lectura de Aprobaciones (BFF):**
  - El frontend del admin consulta `GET /api/admin/aprobaciones`.
  - La API de Next.js llama al webhook `N8N_APPROVALS_WEBHOOK_URL`.
  - n8n responde checkpoints con `stage`, `status`, `owner`, `requestedAt`, `dueDate` y `approvedAt`.

- **Aprobación de Checkpoint (Server Action):**
  1. El usuario aprueba un checkpoint en `/aprobaciones`.
  2. `approveCheckpointAction` envía mutación a `N8N_APPROVALS_ACTION_WEBHOOK_URL`.
  3. n8n actualiza estado a `Approved`, registra `approvedAt` y crea evento de auditoría.
  4. Next.js revalida la vista y refleja el cambio.

- **Workflow `WF_Approvals_Governance`:**
  1. Trigger programado diario (08:15, Mon-Fri).
  2. Lectura de tabla de aprobaciones.
  3. Normalización de etapas y estados.
  4. Detección de aprobaciones vencidas y pendientes críticas.
  5. Notificaciones y escalaciones automáticas.

> Especificación técnica completa: `n8n_approvals_workflow_spec.md`.

---

## 8. Módulo Control de Cambios (Impacto en Costo/Fecha)

**Contexto:** Gestión formal de `change requests` para evaluar impacto sobre margen, fecha compromiso y gobernanza de alcance.

### Funcionalidad Orquestada por n8n:

- **Consolidación de Solicitudes de Cambio:** Unifica solicitudes por proyecto con baseline de costo/fecha y propuesta.
- **Decisiones de Aprobación/Rechazo:** Procesa mutaciones desde Admin y registra trazabilidad de decisión.
- **Escalación Preventiva:** Detecta solicitudes de alto impacto (costo o retraso) para revisión prioritaria.

### Flujo de Operación:

- **Lectura de Solicitudes (BFF):**
  - El frontend del admin consulta `GET /api/admin/cambios`.
  - La API de Next.js llama al webhook `N8N_CHANGE_REQUESTS_WEBHOOK_URL`.
  - n8n responde solicitudes con `type`, `status`, `baselineCost`, `proposedCost`, `baselineDueDate` y `proposedDueDate`.

- **Decisión de Solicitud (Server Action):**
  1. El usuario aprueba/rechaza desde `/cambios`.
  2. `reviewChangeRequestAction` envía mutación a `N8N_CHANGE_REQUESTS_ACTION_WEBHOOK_URL`.
  3. n8n actualiza estado (`Approved` o `Rejected`) y registra evento de auditoría.
  4. Next.js revalida `/cambios` y refresca la vista.

- **Workflow `WF_Change_Requests_Control`:**
  1. Trigger programado diario (08:30, Mon-Fri) + trigger webhook de mutaciones.
  2. Lectura de solicitudes activas desde Google Sheets/DB.
  3. Cálculo de impactos:
     - `costDelta = proposedCost - baselineCost`
     - `scheduleDeltaDays = proposedDueDate - baselineDueDate`
  4. Priorización de revisión cuando:
     - `costDelta` supera umbral definido por proyecto, o
     - `scheduleDeltaDays > 0`
  5. Notificaciones y escalación a PM/Operaciones para cambios de alto impacto.

> Especificación técnica completa: `n8n_change_requests_spec.md`.

---

## 9. Módulo SLA de Tickets (Respuesta y Resolución por Tipo de Cliente)

**Contexto:** Monitoreo operativo de cumplimiento SLA para tickets de soporte/incidentes con foco en experiencia y priorización por tipo de cliente.

### Funcionalidad Orquestada por n8n:

- **Consolidación de Tickets SLA:** Unifica tickets activos y cerrados recientes por proyecto/cliente.
- **Cálculo de Cumplimiento:** Evalúa tiempos reales de primera respuesta y resolución frente a objetivos SLA.
- **Escalación Automática:** Notifica incumplimientos de SLA a PM/Operaciones según prioridad y tipo de cliente.

### Flujo de Operación:

- **Lectura de SLA (BFF):**
  - El frontend del admin consulta `GET /api/admin/sla`.
  - La API de Next.js llama al webhook `N8N_TICKETS_SLA_WEBHOOK_URL`.
  - n8n responde tickets con `createdAt`, `firstResponseAt`, `resolvedAt`, `targetResponseHours`, `targetResolutionHours` y metadatos de cliente/proyecto.

- **Workflow `WF_Tickets_SLA_Control`:**
  1. Trigger programado cada hora laboral (Mon-Fri) + consolidación diaria.
  2. Lectura de tickets desde Google Sheets/DB/helpdesk.
  3. Cálculo de estados SLA:
     - `responseDeltaHours`
     - `resolutionDeltaHours`
     - `IN_SLA` vs `BREACHED`
  4. Priorización de escalación:
     - Mayor severidad para `Critical/High`.
     - Mayor peso para cuentas estratégicas o sector público.
  5. Notificaciones a owner/PM con enlace directo a `/sla`.

> Especificación técnica completa: `n8n_tickets_sla_spec.md`.
