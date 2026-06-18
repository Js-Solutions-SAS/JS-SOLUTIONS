# JS Solutions Portfolio Map

## Oferta principal

**Sistema Comercial Web + WhatsApp + Cotizacion + Portal Cliente**

Para PyMES locales que pierden oportunidades porque sus leads entran por canales sueltos, se responden tarde o no quedan conectados con cotizacion, contrato, pago y entrega.

**Promesa comercial defendible:** convertir la presencia web en un flujo operativo trazable: captar demanda, calificarla, cotizar, aprobar, cobrar y dar visibilidad al cliente sin depender de hojas sueltas ni seguimiento manual.

## Inventario vendible

| Modulo | Estado actual | Demo disponible | Vertical aplicable | Valor de negocio |
| --- | --- | --- | --- | --- |
| Landing comercial | Implementada en `landing` con rutas publicas, CTA, contenido sectorial y cotizador | Si: home, `/pymes`, `/sector-publico`, `/cotizador` | Todas las PyMES | Convierte trafico frio en solicitudes calificadas |
| Demo PyMES WhatsApp | Contenido y flujo descrito en `landing/src/data/sector-content.ts` | Si: secuencia de lead, contexto, calificacion y automatizacion | Odontologias, esteticas, inmobiliarias, restaurantes, servicios tecnicos | Muestra respuesta rapida y seguimiento automatico sin prometer resultados no medidos |
| Cotizador interactivo | Implementado en landing con XState y preview/correccion/envio | Si: `/cotizador` | Servicios profesionales y proyectos a medida | Reduce friccion para pedir precio y alcance |
| Admin cockpit | Implementado en `admin` con modulos operativos visibles | Si: dashboard y modulos de cotizaciones, entregas, capacidad, aprobaciones, cambios, SLA, portafolio, finanzas, RAID, SOPs | Empresas con operacion recurrente | Permite operar ventas y entrega sin estado oculto |
| API de negocio | Implementado en `api` como core NestJS con dominios de leads, quotes, contracts, projects, approvals, tickets, finance, payments y webhooks | Demo tecnica via endpoints y Graphify | Clientes que requieren trazabilidad y automatizacion real | Convierte automatizaciones en sistema auditable |
| Portal cliente | Implementado en `portal` con dashboard, brief y endpoints de estado | Demo parcial; requiere materializar archivos iCloud para auditoria completa | Proyectos con entregables/aprobaciones | Reduce preguntas repetidas y centraliza estado |
| n8n workflows | Workflows presentes para cotizacion, contrato, pagos, aprobacion y estado de proyecto | Demo conceptual; archivos actuales estan iCloud dataless | Automatizacion comercial y operativa | Orquesta tareas alrededor del API sin ser la fuente de verdad |
| Agentes internos | Kit de agentes en `agents/` para engineering y marketing | Demo de proceso; archivos marketing estan iCloud dataless | Fabrica de software y contenido | Sistematiza produccion y mejora consistencia |

## Paquetes replicables

| Paquete | Para quien | Incluye | Resultado esperado |
| --- | --- | --- | --- |
| Presencia que vende | PyMES sin web clara o con web antigua | Landing, CTA WhatsApp, formulario, analitica basica, contenido por servicio | Que el negocio pueda recibir leads con una propuesta clara |
| Sistema comercial WhatsApp | PyMES que reciben conversaciones pero no hacen seguimiento | Landing, flujo WhatsApp, CRM/integracion, scoring basico, automatizaciones n8n | Que cada lead tenga siguiente accion y trazabilidad |
| Cotizacion y aprobacion | Servicios que cotizan manualmente | Cotizador, intake, generacion de propuesta, portal de aprobacion | Menos ida y vuelta antes de aprobar alcance |
| Portal cliente operativo | Empresas con proyectos recurrentes | Dashboard, documentos, aprobaciones, tickets, pagos y timeline | Mejor experiencia postventa y menos soporte repetitivo |
| Cockpit interno | Equipos que ya tienen varios clientes activos | Admin, modulos operativos, eventos, auditoria, reportes | Operacion menos fragil para ventas, entrega y finanzas |

## Oferta recomendada

**Nombre:** Acelerador Comercial PyME: de WhatsApp a Cotizacion en 30 dias.

**Stack de valor:**

- Diagnostico de presencia digital y flujo comercial.
- Landing o mejora web enfocada en conversion.
- CTA y captura de leads por WhatsApp/formulario.
- Cotizador o intake guiado segun el tipo de negocio.
- Automatizacion de seguimiento con n8n alrededor de un API.
- Vista interna para revisar oportunidades y estado.
- Portal o pagina de seguimiento para clientes cuando aplique.

**Garantia sugerida:** garantia de implementacion, no garantia de ingresos. Ejemplo: "Si al dia 30 no tienes el flujo publicado y probado con tus datos reales por causa nuestra, trabajamos sin costo hasta dejarlo operativo." Esto reduce riesgo sin prometer ventas no controladas.

**Escasez etica:** cupos por implementacion mensual. Solo usar si la capacidad real del equipo lo respalda.

## Score de oferta

Puntaje actual: **8/10**.

Fortalezas:

- Problema especifico: leads que se pierden y operacion desordenada.
- Demo visual real: landing, cotizador, admin, portal y arquitectura.
- Diferenciacion: no es solo web; conecta venta, cotizacion, aprobacion y operacion.

Para llegar a 10/10:

- Agregar 2-3 casos reales con antes/despues medible.
- Definir precios por paquete y alcance cerrado.
- Grabar el video de referencia y usarlo como prueba visual en prospeccion.
- Materializar archivos iCloud para que Graphify pruebe todo el flujo tecnicamente.
