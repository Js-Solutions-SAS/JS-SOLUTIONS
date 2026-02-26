import "server-only";

import type {
  DashboardMetrics,
  DeliveryMetrics,
  Milestone,
  Quote,
  SOP,
} from "@/lib/types";
import { normalizeQuote, statusTone } from "@/lib/quote-utils";
import {
  daysUntil,
  isMilestoneBlocked,
  isMilestoneDone,
  milestoneRiskLevel,
  normalizeMilestone,
} from "@/lib/milestone-utils";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const MOCK_QUOTES: Quote[] = [
  {
    id: "L-001",
    nombre: "Camilo Rodriguez",
    empresa: "TechGroup Latam",
    servicio: "Consultoria y Arquitectura",
    monto: "$4,500 USD",
    estado: "Pendiente",
    industria: "General",
  },
  {
    id: "L-002",
    nombre: "Laura Medina",
    empresa: "Retail Horizon",
    servicio: "Automatizacion de ventas e-commerce",
    monto: "$2,800 USD",
    estado: "En Proceso",
    industria: "Retail / E-commerce",
  },
  {
    id: "L-003",
    nombre: "Andres Pardo",
    empresa: "Secretaria de Movilidad",
    servicio: "Plataforma de atencion ciudadana",
    monto: "$7,200 USD",
    estado: "Firmado",
    industria: "Sector Publico",
  },
];

const MOCK_SOPS: SOP[] = [
  {
    id: "sop-1",
    title: "Onboarding de nuevo cliente",
    category: "Operaciones",
    description:
      "Checklist de alta de cliente, creacion de tablero y entrega de accesos.",
    resourceType: "Documento",
    url: "#",
  },
  {
    id: "sop-2",
    title: "Flujo de aprobacion de contrato",
    category: "Legal",
    description:
      "Secuencia de validacion, firma y activacion de automatizaciones en n8n.",
    resourceType: "Video",
    url: "#",
  },
];

const MOCK_MILESTONES: Milestone[] = [
  {
    id: "hito-1",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldia Metropolitana",
    industry: "Sector Publico",
    owner: "Maria Torres",
    phase: "QA",
    title: "Aprobacion funcional modulo de reportes",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "Pendiente",
    priority: "Alta",
    externalUrl: "#",
  },
  {
    id: "hito-2",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    industry: "Retail / E-commerce",
    owner: "Luis Mejia",
    phase: "Desarrollo",
    title: "Integracion checkout + pasarela",
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "En Progreso",
    priority: "Alta",
    externalUrl: "#",
  },
  {
    id: "hito-3",
    projectId: "P-003",
    projectName: "Produccion automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Produccion de Medios",
    owner: "Sara Alvarez",
    phase: "Planificacion",
    title: "Definicion de prompts y pipeline editorial",
    dueDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: "Bloqueado",
    priority: "Media",
    externalUrl: "#",
  },
];

export async function getQuotes(): Promise<Quote[]> {
  const webhookUrl = process.env.N8N_GET_QUOTES_URL;

  if (!webhookUrl) {
    return MOCK_QUOTES;
  }

  const response = await fetch(webhookUrl, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible obtener cotizaciones desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.quotes || [];

  return items.map((item: Partial<Quote>, index: number) => normalizeQuote(item, index));
}

export async function getSops(): Promise<SOP[]> {
  const webhookUrl = process.env.N8N_SOPS_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_SOPS;
  }

  const response = await fetch(webhookUrl, {
    method: "GET",
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible sincronizar los SOPs desde n8n.");
  }

  const raw = await response.json();
  return Array.isArray(raw) ? raw : raw.data || [];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [quotes, sops] = await Promise.all([getQuotes(), getSops()]);

  return {
    proyectosActivos: quotes.filter((quote) => statusTone(quote.estado) === "progress").length,
    cotizacionesPendientes: quotes.filter((quote) => statusTone(quote.estado) === "pending").length,
    contratosGenerados: quotes.filter((quote) => statusTone(quote.estado) === "success").length,
    totalSops: sops.length,
  };
}

export async function getMilestones(): Promise<Milestone[]> {
  const webhookUrl = process.env.N8N_MILESTONES_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_MILESTONES;
  }

  const response = await fetch(webhookUrl, {
    method: "GET",
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible obtener hitos desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.milestones || raw.data || [];

  return items.map((item: Partial<Milestone>, index: number) =>
    normalizeMilestone(item, index),
  );
}

export function getDeliveryMetrics(milestones: Milestone[]): DeliveryMetrics {
  const relevant = milestones.filter((milestone) => !isMilestoneDone(milestone));
  const overdue = relevant.filter(
    (milestone) => milestoneRiskLevel(milestone) === "high",
  );

  const dueIn7Days = relevant.filter((milestone) => {
    const days = daysUntil(milestone.dueDate);
    return days >= 0 && days <= 7;
  });

  const blocked = relevant.filter((milestone) => isMilestoneBlocked(milestone));

  return {
    total: milestones.length,
    overdue: overdue.length,
    dueIn7Days: dueIn7Days.length,
    blocked: blocked.length,
  };
}
