import type { ClientConfig } from "../lib/types";

export const client = {
  "business": {
    "name": "Clinica Sonrisa",
    "legalName": "Clinica Sonrisa SAS",
    "type": "Odontologia",
    "city": "Cali",
    "region": "Valle del Cauca",
    "country": "CO",
    "zone": "Oeste",
    "address": "Avenida 6 Oeste 21B-45, Cali",
    "phone": "+57 310 662 7622",
    "whatsapp": "+57 310 662 7622",
    "email": "agenda@clinicasonrisa.co",
    "hours": "Lunes a sabado de 8:00 a.m. a 6:00 p.m.",
    "priceRange": "$$"
  },
  "brand": {
    "logoText": "CS",
    "logoAlt": "Logo de Clinica Sonrisa",
    "colors": {
      "primary": "#0EA5A5",
      "secondary": "#0F172A",
      "accent": "#F59E0B",
      "background": "#F8FAFC",
      "text": "#0F172A"
    }
  },
  "seo": {
    "siteUrl": "https://clinica-sonrisa.vercel.app",
    "title": "Clinica Sonrisa | Odontologia en Cali con agenda por WhatsApp",
    "description": "Agenda tu valoracion odontologica en Cali. Tratamientos claros, atencion cercana y cita directa por WhatsApp con Clinica Sonrisa.",
    "keywords": [
      "odontologia en Cali",
      "clinica dental Cali",
      "valoracion odontologica Cali",
      "ortodoncia Cali",
      "agenda odontologica WhatsApp"
    ],
    "schemaType": "Dentist",
    "locale": "es_CO"
  },
  "content": {
    "hero": {
      "headline": "Odontologia clara y cercana para cuidar tu sonrisa en Cali",
      "subheadline": "Agenda tu valoracion por WhatsApp y recibe orientacion sobre el tratamiento que necesitas sin llamadas innecesarias.",
      "primaryCta": "Agendar por WhatsApp",
      "secondaryCta": "Ver servicios"
    },
    "painPoints": [
      "No sabes que tratamiento necesitas y quieres orientacion antes de agendar.",
      "Buscas una clinica dental con informacion clara, horarios visibles y atencion rapida.",
      "Quieres resolver dudas por WhatsApp antes de desplazarte."
    ],
    "services": [
      {
        "name": "Valoracion odontologica",
        "description": "Revision inicial, diagnostico y ruta de tratamiento explicada con claridad."
      },
      {
        "name": "Ortodoncia",
        "description": "Acompanamiento para alinear tu sonrisa con seguimiento profesional."
      },
      {
        "name": "Limpieza y prevencion",
        "description": "Controles preventivos para mantener salud oral y evitar complicaciones."
      }
    ],
    "trust": {
      "title": "Atencion profesional con agenda simple",
      "items": [
        "Respuesta por WhatsApp con contexto",
        "Ubicacion y horarios visibles",
        "Servicios explicados sin tecnicismos"
      ]
    },
    "faq": [
      {
        "question": "Como agendo una cita?",
        "answer": "Presiona el boton de WhatsApp y envia el mensaje prellenado. El equipo confirma disponibilidad y siguientes pasos."
      },
      {
        "question": "Atienden urgencias odontologicas?",
        "answer": "Puedes escribir por WhatsApp para validar disponibilidad y recibir orientacion inicial."
      },
      {
        "question": "Donde estan ubicados?",
        "answer": "Estamos en Cali, sector Oeste. La direccion y horarios estan visibles en esta pagina."
      }
    ],
    "finalCta": {
      "title": "Da el primer paso para resolver tu consulta dental",
      "body": "Escribenos por WhatsApp y agenda una valoracion con informacion clara desde el inicio.",
      "button": "Hablar por WhatsApp"
    },
    "whatsappMessage": "Hola, quiero agendar una valoracion odontologica con Clinica Sonrisa. Vengo desde la pagina web."
  }
} satisfies ClientConfig;

export default client;
