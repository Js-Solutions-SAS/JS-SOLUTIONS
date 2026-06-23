import type { ClientConfig } from "../lib/types";

export const client = {
  business: {
    name: "Negocio Local",
    legalName: "Negocio Local",
    type: "Servicio local",
    city: "Cali",
    region: "Valle del Cauca",
    country: "CO",
    zone: "Centro",
    address: "Direccion del negocio",
    phone: "+57 300 000 0000",
    whatsapp: "+57 300 000 0000",
    email: "contacto@negocio.co",
    hours: "Lunes a sabado",
    priceRange: "$$",
  },
  brand: {
    logoText: "NL",
    logoAlt: "Logo de Negocio Local",
    colors: {
      primary: "#0EA5A5",
      secondary: "#0F172A",
      accent: "#F59E0B",
      background: "#F8FAFC",
      text: "#0F172A",
    },
  },
  seo: {
    siteUrl: "https://example.com",
    title: "Negocio Local | Servicio local en Cali",
    description: "Landing local optimizada para SEO y contacto por WhatsApp.",
    keywords: ["servicio local", "Cali", "WhatsApp"],
    schemaType: "LocalBusiness",
    locale: "es_CO",
  },
  content: {
    hero: {
      headline: "Servicio local claro, rapido y facil de contactar",
      subheadline: "Informacion esencial, confianza y WhatsApp directo para resolver dudas.",
      primaryCta: "Hablar por WhatsApp",
      secondaryCta: "Ver servicios",
    },
    painPoints: [
      "Clientes necesitan informacion clara antes de contactar.",
      "WhatsApp debe iniciar con contexto.",
      "La presencia digital debe cargar rapido en movil.",
    ],
    services: [
      { name: "Servicio principal", description: "Descripcion del servicio principal." },
      { name: "Servicio complementario", description: "Descripcion del servicio complementario." },
      { name: "Atencion local", description: "Descripcion de la atencion local." },
    ],
    trust: {
      title: "Confianza antes del primer mensaje",
      items: ["Horarios visibles", "Direccion clara", "CTA directo a WhatsApp"],
    },
    faq: [
      { question: "Como contacto?", answer: "Presiona el boton de WhatsApp para iniciar la conversacion." },
      { question: "Donde estan?", answer: "La ubicacion del negocio esta visible en la pagina." },
      { question: "Que servicios ofrecen?", answer: "Los servicios principales estan listados en esta landing." },
    ],
    finalCta: {
      title: "Listo para dar el siguiente paso",
      body: "Escribe por WhatsApp y recibe orientacion del equipo.",
      button: "Contactar ahora",
    },
    whatsappMessage: "Hola, quiero mas informacion. Vengo desde la pagina web.",
  },
} satisfies ClientConfig;

export default client;
