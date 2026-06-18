# Cold Outreach Playbook

## Principio

No contactar como "hacemos paginas web". Contactar como auditoria concreta del flujo comercial: lead, respuesta, cotizacion, aprobacion y seguimiento.

## Fuente de leads sin tarjeta

Usar `prospecting/osm-leads.mjs` con Overpass/OpenStreetMap. Priorizar leads con telefono y sin website porque tienen friccion clara y contacto disponible.

Comando inicial:

```bash
node prospecting/osm-leads.mjs --cities Bogota --verticals odontologias --limit 25
```

## Mensaje base por WhatsApp

Hola, vi que su negocio aparece en mapas/directorios y queria hacerles una observacion corta: muchos negocios reciben contactos por WhatsApp pero no tienen un flujo claro para responder, cotizar y hacer seguimiento.

En JS Solutions estamos armando un sistema para PyMES que conecta landing, WhatsApp, cotizacion y seguimiento para que cada lead tenga una siguiente accion.

No quiero venderte algo a ciegas. Te puedo hacer una revision rapida de tu presencia digital y decirte donde se pueden estar perdiendo oportunidades. Tarda 15-20 minutos.

## Odontologias

**Dolor:** pacientes preguntan por precios, horarios o tratamientos y quedan en chat sin agenda.

**Oferta:** Web/landing + WhatsApp + agenda + cotizacion orientativa.

**CTA:** "Te reviso si hoy tus pacientes tienen una ruta clara para pasar de pregunta a cita."

## Centros de estetica

**Dolor:** servicios visuales, promociones y agenda dependen de Instagram/WhatsApp sin seguimiento.

**Oferta:** Landing de servicios + WhatsApp + agenda + recordatorios.

**CTA:** "Te muestro como convertir consultas de tratamientos en una ruta de reserva mas clara."

## Restaurantes y cafes

**Dolor:** carta, reservas, domicilios y WhatsApp estan repartidos.

**Oferta:** Web local + reservas/pedidos + WhatsApp + analitica basica.

**CTA:** "Te reviso si tu cliente encuentra rapido carta, ubicacion, reserva y contacto."

## Inmobiliarias

**Dolor:** interesados preguntan por propiedades y se pierden por falta de seguimiento.

**Oferta:** Landing de captacion + WhatsApp + CRM de oportunidades.

**CTA:** "Te muestro como ordenar interesados por propiedad, presupuesto y siguiente accion."

## Servicios tecnicos

**Dolor:** solicitudes urgentes llegan por telefono/WhatsApp sin formulario, fotos ni seguimiento.

**Oferta:** Web local + solicitud guiada + WhatsApp + estado del servicio.

**CTA:** "Te reviso si hoy un cliente puede pedir servicio tecnico sin explicar todo desde cero por chat."

## Cadencia

1. Dia 1: mensaje corto con observacion especifica.
2. Dia 3: seguimiento con ejemplo visual o mini auditoria.
3. Dia 7: cierre suave: "Si no es prioridad ahora, lo dejo por aqui."

## Reglas

- No enviar mensajes masivos sin personalizacion.
- No prometer ventas garantizadas.
- Registrar opt-out y no volver a contactar si piden no recibir mensajes.
- Usar datos publicos de OSM/web del negocio, sin datos personales privados.
