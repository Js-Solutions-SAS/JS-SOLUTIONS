export type LocalBusinessVerticalKey =
  | "restaurantes"
  | "veterinarias"
  | "oftalmologia"
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
  imagePath: string;
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
    imagePath: "/images/rubros/restaurantes.png",
  },
  veterinarias: {
    key: "veterinarias",
    route: "/webs/veterinarias",
    navLabel: "Veterinarias",
    businessType: "Veterinaria",
    seoTitle:
      "Paginas Web para Veterinarias | 40% OFF | Citas por WhatsApp - JS Solutions",
    seoDescription:
      "Digitaliza tu veterinaria con 40% de descuento en landings profesionales. Agenda de citas por WhatsApp y recordatorios.",
    seoKeywords:
      "pagina web veterinaria, landing veterinaria, citas por WhatsApp, web para clinicas veterinarias",
    heroTitle: "Tu veterinaria necesita transmitir confianza antes de la primera cita.",
    heroDescription:
      "Organizamos servicios, senales de confianza, ubicacion, agenda y preguntas frecuentes para que el paciente escriba con menos miedo.",
    painPoints: [
      "Los acudientes comparan opciones antes de escribir",
      "Las preguntas repetidas de horarios consumen tiempo del equipo",
      "Una web generica no transmite especialidad ni amor por las mascotas",
    ],
    primaryCtaLabel: "Cotizar landing para veterinaria",
    whatsappMessage:
      "Hola JS Solutions, quiero cotizar una landing para veterinaria con agenda por WhatsApp.",
    offerTitle: "Landing de confianza para servicios veterinarios locales",
    offerSummary:
      "Una pagina calida y clara que explica servicios, ayuda a elegir el siguiente paso y lleva a agenda o WhatsApp.",
    visibleOutcomes: [
      "Servicios y especialidades veterinarias ordenadas",
      "CTA por cita, urgencia o consulta de vacunas",
      "Confianza visual con secciones de testimonios y equipo",
    ],
    flowTitle: "De la busqueda a una consulta mejor calificada",
    flowSteps: [
      {
        title: "El acudiente busca una veterinaria local",
        description:
          "La landing responde dudas basicas y muestra por que agendar ahora.",
      },
      {
        title: "El CTA abre conversacion directa",
        description:
          "WhatsApp inicia con contexto para que recepcion agende mas rapido.",
      },
      {
        title: "El seguimiento queda medible",
        description:
          "Sabes de inmediato que campañas trajeron mas citas efectivas.",
      },
    ],
    proofTitle: "La atencion medica empieza en la primera pantalla.",
    proofBody:
      "Facilitar el agendamiento y mostrar profesionalismo reduce el abandono del cliente.",
    imagePath: "/images/rubros/veterinarias.png",
  },
  oftalmologia: {
    key: "oftalmologia",
    route: "/webs/oftalmologia",
    navLabel: "Oftalmologia",
    businessType: "Clinica local",
    seoTitle:
      "Paginas Web para Oftalmologia | 40% OFF | Citas y Examenes - JS Solutions",
    seoDescription:
      "Landings de alta conversion para oftalmologos y clinicas de ojos con 40% de descuento. Agenda de examenes y citas en linea.",
    seoKeywords:
      "landing clinica oftalmologica, web para oftalmologos, citas por WhatsApp, examenes de ojos Colombia",
    heroTitle: "Tu consultorio necesita transmitir precision y confianza.",
    heroDescription:
      "Organizamos tratamientos, examenes diagnosticos, ubicacion, agenda y preguntas para que el paciente agende con total seguridad.",
    painPoints: [
      "Los pacientes buscan especialistas pero no encuentran informacion clara",
      "Llamadas constantes para consultar costos de examenes basicos",
      "Falta de claridad sobre convenios y especialidades del centro",
    ],
    primaryCtaLabel: "Cotizar landing para oftalmologia",
    whatsappMessage:
      "Hola JS Solutions, quiero cotizar una landing para oftalmologia con agenda y citas por WhatsApp.",
    offerTitle: "Landing de confianza para especialidades visuales",
    offerSummary:
      "Una pagina sobria y de nivel medico que explica tratamientos, diagnosticos y facilita el agendamiento rapido.",
    visibleOutcomes: [
      "Tratamientos y examenes oftalmologicos explicados",
      "Boton de agendamiento directo por intencion de examen",
      "Estetica limpia, profesional y altamente confiable",
    ],
    flowTitle: "De la necesidad de examen a la cita confirmada",
    flowSteps: [
      {
        title: "El paciente busca especialista oftalmologo",
        description:
          "Aterriza en una web que detalla examenes, medicos y beneficios.",
      },
      {
        title: "Selecciona el examen o cita",
        description:
          "El mensaje prellenado en WhatsApp indica el tipo de cita solicitado.",
      },
      {
        title: "Recepcion confirma sin rodeos",
        description:
          "El equipo recibe los datos necesarios reduciendo el tiempo de llamada.",
      },
    ],
    proofTitle: "La precision medica requiere una web de alto nivel.",
    proofBody:
      "Una landing limpia y bien estructurada refleja el rigor y cuidado de tus tratamientos visuales.",
    imagePath: "/images/rubros/oftalmologia.png",
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
    imagePath: "/images/rubros/tiendas-celulares.png",
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
    imagePath: "/images/rubros/marmolerias.png",
  },
};

export const localBusinessVerticalList = Object.values(localBusinessVerticals);

export function getLocalBusinessVerticalByRoute(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return localBusinessVerticalList.find((vertical) => vertical.route === normalizedPath) || null;
}
