export type LocalBusinessVerticalKey =
  | "restaurantes"
  | "veterinarias-oftalmologia"
  | "tiendas-celulares"
  | "marmolerias";

export interface PackageTier {
  id: "web-simple" | "web-whatsapp" | "web-automatizacion";
  name: string;
  range: string;
  originalRange?: string;
  summary: string;
  bestFor: string;
  included: string[];
}

export interface LocalBusinessVertical {
  key: LocalBusinessVerticalKey;
  route: `/webs/${string}`;
  navLabel: string;
  businessType: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  heroTitle: string;
  heroDescription: string;
  painPoints: string[];
  primaryCtaLabel: string;
  whatsappMessage: string;
  offerTitle: string;
  offerSummary: string;
  visibleOutcomes: string[];
  flowTitle: string;
  flowSteps: Array<{
    title: string;
    description: string;
  }>;
  proofTitle: string;
  proofBody: string;
}

export const webPackages: PackageTier[] = [
  {
    id: "web-simple",
    name: "Web simple / landing rapida",
    originalRange: "Desde COP 900k a 1.8M",
    range: "Desde COP 540k a 1.08M",
    summary:
      "Pagina enfocada en explicar tu negocio, mostrar servicios, generar confianza y llevar al cliente a WhatsApp.",
    bestFor: "Negocios que necesitan presencia clara y conversion rapida.",
    included: [
      "Landing responsive",
      "Copy comercial base",
      "SEO tecnico inicial",
      "CTA a WhatsApp",
    ],
  },
  {
    id: "web-whatsapp",
    name: "Web + captura por WhatsApp",
    originalRange: "COP 1.8M a 3.5M",
    range: "COP 1.08M a 2.1M",
    summary:
      "Landing por rubro con mensajes prellenados, medicion de campañas y estructura para responder leads mejor.",
    bestFor: "Negocios que pagaran pauta o reciben consultas repetidas.",
    included: [
      "Landing por servicio o rubro",
      "WhatsApp por intencion",
      "Eventos GA/GTM",
      "Formulario alternativo",
    ],
  },
  {
    id: "web-automatizacion",
    name: "Web + automatizacion ligera",
    originalRange: "COP 3.5M a 7M+",
    range: "COP 2.1M a 4.2M+",
    summary:
      "Web comercial conectada con seguimiento, CRM ligero o automatizacion para que los leads no se pierdan.",
    bestFor: "Equipos que ya pierden oportunidades por demora o desorden.",
    included: [
      "Pipeline inicial",
      "Seguimiento asistido",
      "Base de datos de leads",
      "Dashboard operativo base",
    ],
  },
];

export const localBusinessVerticals: Record<
  LocalBusinessVerticalKey,
  LocalBusinessVertical
> = {
  restaurantes: {
    key: "restaurantes",
    route: "/webs/restaurantes",
    navLabel: "Restaurantes",
    businessType: "Restaurante",
    seoTitle:
      "Paginas Web para Restaurantes | 40% OFF | Menus y WhatsApp - JS Solutions",
    seoDescription:
      "Aprovecha 40% de descuento en paginas web para restaurantes con menu, reservas y WhatsApp. Convierte visitas en pedidos por tiempo limitado.",
    seoKeywords:
      "pagina web para restaurante, landing restaurante, menu digital, reservas por WhatsApp, web restaurante Colombia",
    heroTitle: "Una web para restaurante debe vender mesas, pedidos y confianza.",
    heroDescription:
      "Mostramos menu, horarios, ubicacion, fotos, reservas y WhatsApp sin hacer que el cliente pregunte lo obvio o abandone por falta de informacion.",
    painPoints: [
      "Clientes preguntan menu, horarios and ubicacion una y otra vez",
      "Las reservas o pedidos quedan dispersos en chats",
      "La pauta manda trafico a redes que no cierran la venta",
    ],
    primaryCtaLabel: "Cotizar web para restaurante",
    whatsappMessage:
      "Hola JS Solutions, quiero cotizar una web para restaurante con menu, WhatsApp y reservas.",
    offerTitle: "Web comercial para restaurante local",
    offerSummary:
      "Una pagina rapida, clara y lista para pauta, pensada para que el cliente vea la oferta y escriba por WhatsApp con contexto.",
    visibleOutcomes: [
      "Menu y servicios visibles sin PDF pesado",
      "Reservas o pedidos con mensaje prellenado",
      "Secciones para fotos, ubicacion, horarios y promociones",
    ],
    flowTitle: "Del anuncio al WhatsApp con menos friccion",
    flowSteps: [
      {
        title: "Cliente entra desde Google o Instagram",
        description:
          "Aterriza en una pagina que muestra comida, ubicacion, horarios y CTA directo.",
      },
      {
        title: "Elige reserva, pedido o consulta",
        description:
          "Cada boton abre WhatsApp con un mensaje distinto para acelerar respuesta.",
      },
      {
        title: "El negocio responde con contexto",
        description:
          "El equipo recibe una conversacion mas clara y puede medir desde que campaña llego.",
      },
    ],
    proofTitle: "No necesitas una app para empezar a vender mejor.",
    proofBody:
      "Para muchos restaurantes, una landing rapida y bien medida resuelve mas que una plataforma compleja que nadie mantiene.",
  },
  "veterinarias-oftalmologia": {
    key: "veterinarias-oftalmologia",
    route: "/webs/veterinarias-oftalmologia",
    navLabel: "Veterinarias y oftalmologia",
    businessType: "Clinica local",
    seoTitle:
      "Paginas Web para Veterinarias | 40% OFF | Citas por WhatsApp - JS Solutions",
    seoDescription:
      "Digitaliza tu veterinaria o clinica con 40% de descuento en landings profesionales. Agenda de citas por WhatsApp y medicion de leads.",
    seoKeywords:
      "pagina web veterinaria, landing clinica oftalmologica, citas por WhatsApp, web para clinicas locales",
    heroTitle: "Tu clinica necesita transmitir confianza antes de la primera cita.",
    heroDescription:
      "Organizamos servicios, senales de confianza, ubicacion, agenda y preguntas frecuentes para que el paciente o acudiente escriba con menos miedo.",
    painPoints: [
      "Los pacientes comparan opciones antes de escribir",
      "Las preguntas repetidas consumen tiempo del equipo",
      "Una web generica no transmite especialidad ni confianza",
    ],
    primaryCtaLabel: "Cotizar landing para clinica",
    whatsappMessage:
      "Hola JS Solutions, quiero cotizar una landing para veterinaria, oftalmologia o clinica local con agenda por WhatsApp.",
    offerTitle: "Landing de confianza para servicios de salud local",
    offerSummary:
      "Una pagina sobria y clara que explica servicios, ayuda a elegir el siguiente paso y lleva a agenda o WhatsApp.",
    visibleOutcomes: [
      "Servicios y especialidades ordenadas",
      "CTA por cita, urgencia o pregunta frecuente",
      "Confianza visual sin promesas medicas exageradas",
    ],
    flowTitle: "De la busqueda a una cita mejor calificada",
    flowSteps: [
      {
        title: "El paciente busca una solucion local",
        description:
          "La landing responde dudas basicas y muestra por que escribir ahora.",
      },
      {
        title: "El CTA separa cita, urgencia o informacion",
        description:
          "WhatsApp abre con contexto para que recepcion no empiece desde cero.",
      },
      {
        title: "El seguimiento queda medible",
        description:
          "UTM y origen ayudan a entender que campañas generan citas reales.",
      },
    ],
    proofTitle: "La innovacion no debe asustar al paciente ni al equipo.",
    proofBody:
      "La tecnologia aparece como una agenda mas clara y una respuesta mas rapida, no como una barrera nueva.",
  },
  "tiendas-celulares": {
    key: "tiendas-celulares",
    route: "/webs/tiendas-celulares",
    navLabel: "Tiendas de celulares",
    businessType: "Tienda de celulares",
    seoTitle:
      "Paginas Web para Tiendas de Celulares | 40% OFF | Catalogo - JS Solutions",
    seoDescription:
      "Tu tienda de celulares online con catalogo y WhatsApp. Obten tu web comercial con 40% de descuento por tiempo limitado.",
    seoKeywords:
      "pagina web tienda celulares, catalogo celulares WhatsApp, web reparacion celulares, landing tienda tecnologia",
    heroTitle: "Tu tienda de celulares puede vender sin depender solo del mostrador.",
    heroDescription:
      "Creamos una vitrina clara para equipos, accesorios, reparaciones y promociones, conectada a WhatsApp para cerrar rapido.",
    painPoints: [
      "Los clientes preguntan precio y disponibilidad por varios canales",
      "Promociones y servicios tecnicos no se encuentran facil",
      "La tienda compite con marketplaces sin mostrar cercania local",
    ],
    primaryCtaLabel: "Cotizar web para tienda",
    whatsappMessage:
      "Hola JS Solutions, quiero cotizar una web para tienda de celulares con catalogo, servicios y WhatsApp.",
    offerTitle: "Vitrina web para celulares, accesorios y reparaciones",
    offerSummary:
      "Una landing o catalogo ligero que ordena oferta, servicios y contacto para convertir busquedas locales en conversaciones.",
    visibleOutcomes: [
      "Catalogo base o secciones por categoria",
      "CTA para disponibilidad, reparacion y garantia",
      "Campanas medibles por producto o servicio",
    ],
    flowTitle: "De busqueda local a conversacion de compra",
    flowSteps: [
      {
        title: "El cliente encuentra oferta y confianza",
        description:
          "La web muestra categorias, servicios, ubicacion y beneficios sin saturar.",
      },
      {
        title: "WhatsApp llega con intencion",
        description:
          "El mensaje prellenado indica si pregunta por equipo, accesorio o reparacion.",
      },
      {
        title: "El equipo prioriza mejor",
        description:
          "Las consultas quedan separadas por interes y fuente de campaña.",
      },
    ],
    proofTitle: "Una vitrina simple puede producir caja antes de montar ecommerce.",
    proofBody:
      "Para una tienda local, primero conviene medir demanda y cerrar por WhatsApp; el ecommerce puede venir cuando el flujo lo justifique.",
  },
  marmolerias: {
    key: "marmolerias",
    route: "/webs/marmolerias",
    navLabel: "Marmolerias",
    businessType: "Marmoleria",
    seoTitle:
      "Paginas Web para Marmolerias | 40% OFF | Portafolio y Cotizacion - JS Solutions",
    seoDescription:
      "Muestra tus acabados y capta obras con 40% de descuento en paginas web para marmolerias. Cotizacion por WhatsApp y portafolio interactivo.",
    seoKeywords:
      "pagina web marmoleria, landing marmoles, web para mesones cocina, cotizacion marmol WhatsApp",
    heroTitle: "Una marmoleria vende mejor cuando muestra acabados, confianza y proceso.",
    heroDescription:
      "Convertimos materiales, proyectos y cotizaciones en una landing que ayuda al cliente a pedir una propuesta con medidas y contexto.",
    painPoints: [
      "El cliente no entiende diferencias entre materiales y acabados",
      "Las cotizaciones llegan incompletas y hacen perder tiempo",
      "El portafolio vive disperso en fotos, chats o redes sociales",
    ],
    primaryCtaLabel: "Cotizar web para marmoleria",
    whatsappMessage:
      "Hola JS Solutions, quiero cotizar una web para marmoleria con portafolio, materiales y solicitud por WhatsApp.",
    offerTitle: "Landing con portafolio y solicitud de cotizacion",
    offerSummary:
      "Una web enfocada en mostrar calidad, tipos de proyecto y un primer brief para cotizar sin perseguir datos basicos.",
    visibleOutcomes: [
      "Galeria de proyectos y materiales",
      "CTA por cocina, banos, barras o proyectos especiales",
      "Solicitud inicial con medidas, ubicacion y tipo de material",
    ],
    flowTitle: "De inspiracion a solicitud de cotizacion",
    flowSteps: [
      {
        title: "El cliente ve proyectos similares",
        description:
          "La pagina ordena acabados y casos por tipo de necesidad.",
      },
      {
        title: "Pide cotizacion con datos utiles",
        description:
          "WhatsApp inicia con una guia para medidas, material y ubicacion.",
      },
      {
        title: "La venta arranca mejor preparada",
        description:
          "El equipo responde con mas criterio y menos ida y vuelta.",
      },
    ],
    proofTitle: "El portafolio no puede vivir solo en el celular del vendedor.",
    proofBody:
      "Una web clara convierte fotos y experiencia en confianza comercial reputible.",
  },
};

export const localBusinessVerticalList = Object.values(localBusinessVerticals);

export function getLocalBusinessVerticalByRoute(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return localBusinessVerticalList.find((vertical) => vertical.route === normalizedPath) || null;
}
