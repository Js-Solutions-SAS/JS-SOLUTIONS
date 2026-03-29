import type { SectorKey } from "@/lib/whatsapp";

export interface IntegrationBadge {
  name: string;
  href: string;
  logo: string;
}

export interface AuthoritySignal {
  title: string;
  description: string;
}

export interface DemoStep {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  customerLabel: string;
  customerMessage: string;
  assistantLabel: string;
  assistantMessage: string;
  automationLabel: string;
  automationDetail: string;
  businessValue: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TechnicalPillar {
  title: string;
  description: string;
}

export interface SectorContent {
  key: SectorKey;
  route: `/${string}`;
  navLabel: string;
  homeLabel: string;
  selectorAudience: string;
  selectorSummary: string;
  selectorOutcomes: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroHighlights: string[];
  heroCtaLabel: string;
  heroWhatsappMessage: string;
  heroSecondaryLabel: string;
  demoName: string;
  demoTitle: string;
  demoDescription: string;
  demoCtaLabel: string;
  demoCtaMessage: string;
  demoSteps: DemoStep[];
  packageEyebrow: string;
  packageName: string;
  packageSummary: string;
  packageIncluded: string[];
  addOns: string[];
  methodology: AuthoritySignal[];
  proofPoints: AuthoritySignal[];
  technicalEyebrow: string;
  technicalTitle: string;
  technicalDescription: string;
  technicalPillars: TechnicalPillar[];
  faqs: FAQItem[];
  authoritySignals: AuthoritySignal[];
  finalCtaTitle: string;
  finalCtaBody: string;
  finalCtaLabel: string;
}

export const integrationBadges: IntegrationBadge[] = [
  {
    name: "WhatsApp Business",
    href: "https://business.whatsapp.com",
    logo: "/whatsapp-business-bg.svg",
  },
  {
    name: "HubSpot CRM",
    href: "https://www.hubspot.com/products/crm",
    logo: "/hubspot-1.svg",
  },
  {
    name: "n8n",
    href: "https://n8n.io",
    logo: "/n8n-color.svg",
  },
  {
    name: "OpenAI",
    href: "https://openai.com",
    logo: "/openai-2.svg",
  },
  {
    name: "Google Cloud",
    href: "https://cloud.google.com",
    logo: "/google-cloud-1.svg",
  },
  {
    name: "ElevenLabs",
    href: "https://elevenlabs.io",
    logo: "/elevenlabs-logo-white.svg",
  },
  {
    name: "Claude",
    href: "https://claude.ai",
    logo: "/claude-color.svg",
  },
];

export const homeAuthoritySignals: AuthoritySignal[] = [
  {
    title: "Dos rutas claras",
    description:
      "Una entrada editorial para la marca y dos landings hechas para intenciones de compra distintas.",
  },
  {
    title: "Demo antes que jerga",
    description:
      "Primero muestras el flujo real; despues explicas RAG, automatizacion, voz e integraciones.",
  },
  {
    title: "SEO + Ads mas coherentes",
    description:
      "Cada anuncio puede aterrizar en una promesa, keywords y CTA mucho mas especificos.",
  },
];

export const sectorConfigs: Record<SectorKey, SectorContent> = {
  pymes: {
    key: "pymes",
    route: "/pymes",
    navLabel: "PyMES",
    homeLabel: "Sistema Comercial por WhatsApp",
    selectorAudience: "Para empresas que venden y hacen seguimiento comercial",
    selectorSummary:
      "Una landing enfocada en automatizacion de ventas por WhatsApp, seguimiento automatico de leads y operacion comercial conectada con CRM.",
    selectorOutcomes: [
      "Responde en segundos y sin perseguir el celular",
      "Califica oportunidades antes de que llegue el equipo",
      "Activa seguimiento, agenda y cotizacion sin friccion",
    ],
    seoTitle:
      "Automatizacion de Ventas por WhatsApp | Sistema Comercial con IA - JS Solutions",
    seoDescription:
      "Automatizacion de ventas por WhatsApp para PyMES. Responde, califica y hace seguimiento automatico de leads con CRM, IA y automatizacion operativa.",
    seoKeywords:
      "automatizacion de ventas por WhatsApp, agente de WhatsApp para ventas, seguimiento automatico de leads, CRM WhatsApp automatizacion, IA para ventas",
    heroEyebrow: "PyMES Comerciales",
    heroTitle: "Automatizacion de ventas por WhatsApp que responde y hace seguimiento sin dejar morir oportunidades.",
    heroDescription:
      "Disenas una operacion comercial que responde en segundos, entiende el contexto del negocio y empuja cada lead al siguiente paso sin depender de hojas sueltas ni persecucion manual.",
    heroHighlights: [
      "WhatsApp como primer canal comercial",
      "Seguimiento automatico con CRM y automatizacion",
      "Cotizacion, agenda y trazabilidad desde el primer contacto",
    ],
    heroCtaLabel: "Quiero esta demo en mi empresa",
    heroWhatsappMessage:
      "Hola JS Solutions, quiero ver el sistema comercial por WhatsApp aplicado a mi proceso de ventas.",
    heroSecondaryLabel: "Ver flujo completo",
    demoName: "Demo PyMES",
    demoTitle: "Asi se mueve un lead desde WhatsApp hasta el CRM.",
    demoDescription:
      "La demo simula un lead real: entra por WhatsApp, recibe respuestas utiles, se califica y se empuja a agenda o cotizacion sin perder continuidad.",
    demoCtaLabel: "Quiero este flujo en mi negocio",
    demoCtaMessage:
      "Hola JS Solutions, vi la demo de PyMES y quiero implementar un sistema comercial por WhatsApp.",
    demoSteps: [
      {
        id: "lead-in",
        label: "Lead",
        eyebrow: "Entrada del lead",
        title: "El primer mensaje no cae en un limbo.",
        customerLabel: "Lead",
        customerMessage:
          "Hola, quiero saber precios y tiempos para automatizar el seguimiento de mis clientes.",
        assistantLabel: "Agente Comercial",
        assistantMessage:
          "Claro. Te ayudo a orientarte y a llevar tu caso a la ruta correcta. Para afinar la recomendacion, dime cuantas conversaciones comerciales reciben por semana.",
        automationLabel: "Operacion",
        automationDetail:
          "Se crea el lead, se captura la fuente y se abre una ficha de seguimiento sin tocar una hoja manual.",
        businessValue: "Responde en segundos y evita que el lead se enfrie.",
      },
      {
        id: "context",
        label: "Contexto",
        eyebrow: "Memoria operativa",
        title: "La respuesta usa informacion real del negocio.",
        customerLabel: "Lead",
        customerMessage:
          "Hoy nos llegan entre 120 y 150 conversaciones por semana y tenemos dos vendedores.",
        assistantLabel: "Agente Comercial",
        assistantMessage:
          "Con ese volumen, la prioridad es calificar rapido, agendar solo lo viable y dejar seguimiento automatico para el resto. Eso evita que el equipo responda tarde o repita informacion.",
        automationLabel: "IA + base de conocimiento",
        automationDetail:
          "El flujo consulta documentos, preguntas frecuentes, catalogos y reglas comerciales para no improvisar respuestas.",
        businessValue: "No inventa: responde con criterio y lenguaje comercial consistente.",
      },
      {
        id: "qualification",
        label: "Calificacion",
        eyebrow: "Decision comercial",
        title: "El agente detecta intencion y urgencia.",
        customerLabel: "Lead",
        customerMessage:
          "Necesito resolver esto rapido porque ya estamos perdiendo oportunidades por demora.",
        assistantLabel: "Agente Comercial",
        assistantMessage:
          "Entendido. Te marco como prioridad alta y te propongo una llamada corta para revisar volumen, equipo y objetivo comercial. Tengo espacios hoy a las 4:30 p. m. o manana a las 9:00 a. m.",
        automationLabel: "Scoring",
        automationDetail:
          "El lead sube de prioridad, se asigna score comercial y se dispara una tarea al responsable correcto.",
        businessValue: "Tu equipo entra en el momento justo, no al principio de todo.",
      },
      {
        id: "crm",
        label: "CRM",
        eyebrow: "Sincronizacion",
        title: "Cada interaccion queda ordenada y trazable.",
        customerLabel: "Sistema",
        customerMessage:
          "Lead registrado en CRM con fuente, resumen de la conversacion y prioridad comercial.",
        assistantLabel: "Automatizacion",
        assistantMessage:
          "Tambien se activa un seguimiento si el lead no agenda hoy y se prepara una cotizacion base si cumple criterio.",
        automationLabel: "CRM + seguimiento",
        automationDetail:
          "La automatizacion empuja datos, crea notas, programa recordatorios y deja el pipeline al dia.",
        businessValue: "La operacion deja de depender de memoria humana.",
      },
      {
        id: "conversion",
        label: "Cierre",
        eyebrow: "Siguiente paso",
        title: "El flujo no termina en la conversacion.",
        customerLabel: "Lead",
        customerMessage: "Agendemos manana a las 9:00 a. m.",
        assistantLabel: "Agente Comercial",
        assistantMessage:
          "Perfecto. Ya te comparto confirmacion y el equipo recibira todo el contexto antes de la llamada.",
        automationLabel: "Agenda + handoff",
        automationDetail:
          "Se reserva espacio, se confirma por WhatsApp y el vendedor recibe el resumen para entrar mejor preparado.",
        businessValue: "No solo respondes: conviertes con continuidad.",
      },
    ],
    packageEyebrow: "Oferta principal",
    packageName: "Sistema Comercial por WhatsApp",
    packageSummary:
      "Una solucion empaquetada para empresas que necesitan responder, calificar y empujar leads sin que cada paso dependa del equipo operativo.",
    packageIncluded: [
      "Agente de WhatsApp orientado a ventas y pre-calificacion",
      "Memoria operativa con documentos, catalogos y FAQs del negocio",
      "Integracion con CRM para trazabilidad y seguimiento",
      "Secuencias automaticas para agenda, cotizacion o recontacto",
      "Tablero base para medir tiempos, volumen y conversion",
    ],
    addOns: [
      "CRM completo",
      "Pasarela de pagos",
      "Cotizacion automatica",
      "Remarketing",
      "Dashboards ejecutivos",
    ],
    methodology: [
      {
        title: "Diagnostico",
        description:
          "Mapeamos tu embudo, puntos de fuga y preguntas repetidas antes de tocar tecnologia.",
      },
      {
        title: "Diseno del flujo",
        description:
          "Definimos mensajes, reglas comerciales, memoria operativa y rutas de handoff.",
      },
      {
        title: "Implementacion",
        description:
          "Conectamos WhatsApp, automatizacion, CRM y activos del negocio sin rehacer todo desde cero.",
      },
      {
        title: "Pruebas",
        description:
          "Validamos respuestas, scoring, agenda y seguimiento con casos reales del equipo.",
      },
      {
        title: "Ajuste",
        description:
          "Corregimos friccion operativa, afinamos mensajes y dejamos medicion para iterar.",
      },
    ],
    proofPoints: [
      {
        title: "Salida inicial en 2-4 semanas",
        description:
          "La primera version se piensa como un sistema operable, no como una consultoria eterna.",
      },
      {
        title: "Menos tareas repetidas",
        description:
          "Respuestas, filtro comercial y seguimiento dejan de vivir en chats dispersos y memoria humana.",
      },
      {
        title: "Integracion real",
        description:
          "WhatsApp, CRM, agenda, documentos y automatizacion trabajan como una sola operacion.",
      },
    ],
    technicalEyebrow: "Que hay detras",
    technicalTitle: "La tecnologia aparece despues de que el valor ya se entendio.",
    technicalDescription:
      "Aqui si tiene sentido hablar de RAG, orquestacion y canales: no como buzzwords, sino como piezas de una operacion comercial mas fiable.",
    technicalPillars: [
      {
        title: "Memoria operativa (RAG)",
        description:
          "La respuesta se alimenta de documentos, catalogos, objeciones y reglas reales de tu negocio.",
      },
      {
        title: "Automatizacion comercial",
        description:
          "Cada decision del flujo puede empujar CRM, agenda, cotizacion y seguimiento sin duplicar trabajo.",
      },
      {
        title: "Canales listos para crecer",
        description:
          "El mismo motor puede extenderse a voz, formularios, email o canales internos cuando haga sentido.",
      },
    ],
    faqs: [
      {
        question: "Esto reemplaza a mi equipo comercial?",
        answer:
          "No. Quita friccion al principio del embudo y prepara mejor cada conversacion para que el equipo entre con contexto y prioridad.",
      },
      {
        question: "Necesito un CRM grande para arrancar?",
        answer:
          "No necesariamente. Se puede empezar con una estructura ligera y crecer a un CRM mas robusto cuando la operacion lo justifique.",
      },
      {
        question: "Si mi proceso cambia mucho, se rompe?",
        answer:
          "No. El flujo se disena para iterarse: mensajes, reglas y rutas de seguimiento se ajustan sobre operacion real.",
      },
    ],
    authoritySignals: [
      {
        title: "Compatibilidad con tu stack",
        description:
          "Trabajamos sobre WhatsApp, CRM, automatizacion, nube y activos existentes para salir rapido.",
      },
      {
        title: "Implementacion guiada por conversion",
        description:
          "No se trata de tener un bot; se trata de que el lead avance con mejor velocidad y mejor contexto.",
      },
      {
        title: "Trazabilidad desde el primer contacto",
        description:
          "Cada interaccion puede quedar registrada, medida y lista para el siguiente paso comercial.",
      },
    ],
    finalCtaTitle: "Si hoy se te enfria el lead, la operacion ya te esta costando crecimiento.",
    finalCtaBody:
      "Miremos tu embudo y te mostramos como se veria este flujo dentro de tu negocio, con tus preguntas, tus reglas y tus canales.",
    finalCtaLabel: "Hablemos por WhatsApp",
  },
  sector_publico: {
    key: "sector_publico",
    route: "/sector-publico",
    navLabel: "Sector Publico",
    homeLabel: "Sistema de Atencion Ciudadana Asistida",
    selectorAudience: "Para entidades que orientan ciudadanos y manejan alto volumen de consultas",
    selectorSummary:
      "Una landing enfocada en atencion ciudadana con IA, orientacion de tramites y automatizacion de interacciones institucionales sin saturar los canales del equipo.",
    selectorOutcomes: [
      "Responde consultas frecuentes con criterio institucional",
      "Guia tramites y deriva correctamente a cada area",
      "Registra interacciones para tener mas control y menos desgaste operativo",
    ],
    seoTitle:
      "Atencion Ciudadana con IA | Asistente Virtual para Entidades Publicas - JS Solutions",
    seoDescription:
      "Atencion ciudadana con IA para orientar tramites, reducir carga operativa y mejorar consistencia institucional. Asistente virtual para entidades publicas.",
    seoKeywords:
      "atencion ciudadana con IA, automatizacion de atencion al ciudadano, orientacion de tramites, asistente virtual para entidades publicas, IA sector publico",
    heroEyebrow: "Sector Publico",
    heroTitle: "Atencion ciudadana con IA para orientar tramites sin colapsar canales ni sobrecargar a tu equipo.",
    heroDescription:
      "Una operacion asistida que orienta al ciudadano, consulta base documental, deriva con criterio y deja trazabilidad desde la primera interaccion.",
    heroHighlights: [
      "Orientacion de tramites y requisitos con lenguaje claro",
      "Menos llamadas repetidas y menos presion sobre ventanillas",
      "Registro, derivacion y consistencia institucional por canal",
    ],
    heroCtaLabel: "Quiero revisar este flujo con mi entidad",
    heroWhatsappMessage:
      "Hola JS Solutions, quiero revisar el sistema de atencion ciudadana asistida para mi entidad.",
    heroSecondaryLabel: "Ver experiencia guiada",
    demoName: "Demo Sector Publico",
    demoTitle: "Asi se orienta un ciudadano sin improvisar y sin rebotarlo entre areas.",
    demoDescription:
      "La demo simula una consulta ciudadana real: el sistema orienta, valida contexto documental, deriva con criterio y registra la interaccion.",
    demoCtaLabel: "Quiero esta experiencia en mi entidad",
    demoCtaMessage:
      "Hola JS Solutions, vi la demo de atencion ciudadana y quiero entender como aplicarla en mi entidad.",
    demoSteps: [
      {
        id: "consulta",
        label: "Consulta",
        eyebrow: "Inicio de la atencion",
        title: "La consulta entra y recibe una primera orientacion util.",
        customerLabel: "Ciudadano",
        customerMessage:
          "Buenos dias. Necesito saber que documentos debo llevar para renovar un permiso y donde puedo radicar la solicitud.",
        assistantLabel: "Asistente Ciudadano",
        assistantMessage:
          "Te ayudo. Primero confirmemos el tramite para darte requisitos y canal correcto. Dime si la solicitud es nueva, renovacion o ajuste.",
        automationLabel: "Canal institucional",
        automationDetail:
          "La interaccion se registra con tema, canal y area probable para no perder contexto si debe escalarse.",
        businessValue: "Bajas la presion inicial sobre lineas y ventanillas.",
      },
      {
        id: "documental",
        label: "Documentos",
        eyebrow: "Contexto normativo",
        title: "La orientacion sale de la base documental, no de memoria suelta.",
        customerLabel: "Ciudadano",
        customerMessage: "Es una renovacion.",
        assistantLabel: "Asistente Ciudadano",
        assistantMessage:
          "Para renovacion necesitas documento de identidad, soporte del permiso actual y formato actualizado de solicitud. Tambien puedo indicarte si tu tramite aplica en linea o presencial.",
        automationLabel: "RAG institucional",
        automationDetail:
          "El sistema consulta manuales, requisitos, resoluciones y FAQs internas para reducir respuestas ambiguas.",
        businessValue: "La informacion mantiene criterio institucional y menos contradicciones.",
      },
      {
        id: "derivacion",
        label: "Derivacion",
        eyebrow: "Ruta correcta",
        title: "Se deriva a la ruta correcta solo cuando hace falta.",
        customerLabel: "Ciudadano",
        customerMessage:
          "Prefiero hacerlo en linea. Quiero saber si debo pedir cita o puedo radicar directo.",
        assistantLabel: "Asistente Ciudadano",
        assistantMessage:
          "En este caso puedes iniciar radicacion digital sin cita. Te comparto el enlace correcto y, si quieres, dejo tu caso marcado para seguimiento por el area responsable.",
        automationLabel: "Derivacion asistida",
        automationDetail:
          "Se determina si la consulta se resuelve en autoservicio o si debe escalarse a un equipo humano.",
        businessValue: "El equipo solo recibe los casos que realmente requieren intervencion.",
      },
      {
        id: "trazabilidad",
        label: "Registro",
        eyebrow: "Memoria de la interaccion",
        title: "Cada paso queda trazable para la entidad.",
        customerLabel: "Sistema",
        customerMessage:
          "Consulta registrada: tramite, estado, canal, resumen y enlace compartido.",
        assistantLabel: "Automatizacion",
        assistantMessage:
          "Si el ciudadano no completa el proceso, la entidad puede revisar donde se freno y que informacion ya recibio.",
        automationLabel: "Analitica operativa",
        automationDetail:
          "La interaccion alimenta reportes de volumen, temas repetidos y puntos de confusion del servicio.",
        businessValue: "No es solo atencion: es control operativo y aprendizaje institucional.",
      },
      {
        id: "cierre",
        label: "Cierre",
        eyebrow: "Experiencia final",
        title: "El ciudadano sale orientado y la entidad gana orden.",
        customerLabel: "Ciudadano",
        customerMessage: "Perfecto, ya tengo claro por donde iniciar.",
        assistantLabel: "Asistente Ciudadano",
        assistantMessage:
          "Listo. Si cambian tus condiciones o necesitas validar un requisito adicional, puedes volver con este mismo hilo y retomar desde aqui.",
        automationLabel: "Continuidad",
        automationDetail:
          "El historial queda listo para retomar la conversacion sin reiniciar todo desde cero.",
        businessValue: "Mejor servicio percibido, menos friccion y menos desgaste para los equipos.",
      },
    ],
    packageEyebrow: "Oferta principal",
    packageName: "Sistema de Atencion Ciudadana Asistida",
    packageSummary:
      "Una solucion empaquetada para entidades que necesitan orientar, derivar y registrar interacciones con mas consistencia y menos carga operativa.",
    packageIncluded: [
      "Asistente ciudadano para consultas frecuentes y orientacion inicial",
      "Base documental conectada para requisitos, tramites y FAQs",
      "Rutas de derivacion por area, complejidad o tipo de solicitud",
      "Registro de interacciones para trazabilidad y analitica",
      "Base de medicion para volumen, temas y friccion del servicio",
    ],
    addOns: [
      "Gestion documental",
      "Turnos y citas",
      "Analitica avanzada",
      "Integraciones internas",
      "Canales de voz",
    ],
    methodology: [
      {
        title: "Diagnostico",
        description:
          "Identificamos canales saturados, consultas repetidas y rutas que hoy dependen demasiado del equipo.",
      },
      {
        title: "Diseno del servicio",
        description:
          "Definimos lenguaje institucional, rutas de orientacion, derivacion y fuentes documentales.",
      },
      {
        title: "Implementacion",
        description:
          "Conectamos la base documental, los canales y las reglas operativas con foco en un piloto util.",
      },
      {
        title: "Pruebas",
        description:
          "Probamos casos reales de ciudadanos y ajustamos respuestas, handoffs y registros.",
      },
      {
        title: "Ajuste",
        description:
          "Refinamos segun volumen, politicas internas y aprendizaje del servicio.",
      },
    ],
    proofPoints: [
      {
        title: "Piloto controlado en 3-6 semanas",
        description:
          "La primera salida prioriza una ruta clara de servicio con trazabilidad antes de escalar canales.",
      },
      {
        title: "Menos desgaste operativo",
        description:
          "Las preguntas repetidas, la orientacion inicial y la derivacion se vuelven mas consistentes.",
      },
      {
        title: "Lectura institucional de la demanda",
        description:
          "Las interacciones dejan evidencia sobre tramites confusos, cuellos de botella y necesidades de ajuste.",
      },
    ],
    technicalEyebrow: "Que hay detras",
    technicalTitle: "La tecnologia se pone al servicio de la experiencia y del control operativo.",
    technicalDescription:
      "RAG, automatizacion, voz e integraciones importan porque mejoran la atencion, no porque suenen innovadoras por si solas.",
    technicalPillars: [
      {
        title: "Base normativa y documental",
        description:
          "El asistente consulta requisitos, protocolos y contenidos institucionales para reducir contradicciones.",
      },
      {
        title: "Derivacion con criterio",
        description:
          "Las reglas del flujo ayudan a decidir cuando orientar, cuando registrar y cuando escalar a un humano.",
      },
      {
        title: "Canales adicionales",
        description:
          "La misma logica puede extenderse a voz, web, formularios o canales internos cuando el servicio lo necesite.",
      },
    ],
    faqs: [
      {
        question: "Esto reemplaza la atencion humana?",
        answer:
          "No. Reduce saturacion en la orientacion inicial y mejora la consistencia para que el equipo humano se enfoque en casos mas sensibles o complejos.",
      },
      {
        question: "Sirve aunque la entidad tenga informacion dispersa?",
        answer:
          "Si. Parte del trabajo es ordenar fuentes, documentos y criterios para que la respuesta salga de una base operable y no de archivos sueltos.",
      },
      {
        question: "Se puede empezar con un solo tramite o canal?",
        answer:
          "Si. La mejor ruta inicial suele ser acotar un volumen alto y repetitivo para lanzar un piloto controlado y luego escalar.",
      },
    ],
    authoritySignals: [
      {
        title: "Compatibilidad institucional",
        description:
          "Podemos trabajar sobre documentos, canales y reglas existentes sin plantear un cambio traumatico.",
      },
      {
        title: "Atencion mas consistente",
        description:
          "La experiencia mejora cuando la orientacion deja de depender solo de quien este respondiendo ese dia.",
      },
      {
        title: "Mas control de la operacion",
        description:
          "Las interacciones se vuelven medibles, trazables y utiles para ajustar el servicio.",
      },
    ],
    finalCtaTitle: "Si hoy tu equipo responde lo mismo una y otra vez, ya tienes una oportunidad clara de automatizacion.",
    finalCtaBody:
      "Revisemos un tramite, un canal o un flujo ciudadano real y te mostramos como se veria una primera version util para tu entidad.",
    finalCtaLabel: "Hablar por WhatsApp",
  },
};
