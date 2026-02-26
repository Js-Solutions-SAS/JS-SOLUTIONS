import "server-only";

import type {
  CapacityMetrics,
  DashboardMetrics,
  DeliveryMetrics,
  Milestone,
  RaidItem,
  RaidMetrics,
  RaidProjectSummary,
  Quote,
  SOP,
  TeamCapacityEntry,
} from "@/lib/types";
import {
  normalizeCapacityEntry,
  utilizationBand,
  utilizationPercent,
} from "@/lib/capacity-utils";
import {
  isCriticalOpen,
  isOpenStatus,
  normalizeRaidItem,
} from "@/lib/raid-utils";
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

const MOCK_TEAM_CAPACITY: TeamCapacityEntry[] = [
  {
    id: "cap-1",
    personName: "Laura Medina",
    role: "PM",
    weekLabel: "2026-W09",
    capacityHours: 40,
    assignedHours: 38,
    projectCount: 3,
    focusArea: "Delivery",
    ownerEmail: "laura@jssolutions.co",
  },
  {
    id: "cap-2",
    personName: "Luis Mejia",
    role: "Automation Engineer",
    weekLabel: "2026-W09",
    capacityHours: 40,
    assignedHours: 46,
    projectCount: 4,
    focusArea: "n8n",
    ownerEmail: "luis@jssolutions.co",
  },
  {
    id: "cap-3",
    personName: "Sara Alvarez",
    role: "Frontend Engineer",
    weekLabel: "2026-W09",
    capacityHours: 40,
    assignedHours: 33,
    projectCount: 2,
    focusArea: "UI",
    ownerEmail: "sara@jssolutions.co",
  },
  {
    id: "cap-4",
    personName: "Diego Pardo",
    role: "QA",
    weekLabel: "2026-W09",
    capacityHours: 35,
    assignedHours: 30,
    projectCount: 3,
    focusArea: "Testing",
    ownerEmail: "diego@jssolutions.co",
  },
];

const MOCK_RAID_ITEMS: RaidItem[] = [
  {
    id: "raid-1",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldia Metropolitana",
    industry: "Sector Publico",
    owner: "Maria Torres",
    type: "Risk",
    status: "Open",
    priority: "Critical",
    title: "Cambios regulatorios sin confirmacion final",
    detail: "Riesgo de reproceso funcional si no se valida decreto final.",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    mitigation: "Mesa legal semanal y congelacion de alcance en modulo QA.",
  },
  {
    id: "raid-2",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldia Metropolitana",
    industry: "Sector Publico",
    owner: "Camilo Vega",
    type: "Dependency",
    status: "Blocked",
    priority: "High",
    title: "Provision de certificados de infraestructura",
    detail: "El tercero de seguridad no ha liberado certificados SSL de produccion.",
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    dependencyOn: "Proveedor de infraestructura gubernamental",
  },
  {
    id: "raid-3",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    industry: "Retail / E-commerce",
    owner: "Luis Mejia",
    type: "Issue",
    status: "Open",
    priority: "High",
    title: "Mismatch de inventario entre OMS y checkout",
    detail: "Se detectaron diferencias de stock en 8 SKUs de alto volumen.",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    mitigation: "Runbook de reconciliacion diaria + validacion automatica n8n.",
  },
  {
    id: "raid-4",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    industry: "Retail / E-commerce",
    owner: "Laura Medina",
    type: "Assumption",
    status: "Mitigated",
    priority: "Medium",
    title: "Equipo del cliente entrega catalogo limpio",
    detail: "Se asumio catalogo sin duplicados. Data quality se corrigio parcialmente.",
    mitigation: "Checklist de calidad previo a cada import masiva.",
  },
  {
    id: "raid-5",
    projectId: "P-003",
    projectName: "Produccion automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Produccion de Medios",
    owner: "Sara Alvarez",
    type: "Risk",
    status: "Open",
    priority: "Medium",
    title: "Dependencia de aprobacion editorial nocturna",
    detail: "Sin validacion editorial antes de 22:00 se retrasa el pipeline de publicacion.",
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
  {
    id: "raid-6",
    projectId: "P-003",
    projectName: "Produccion automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Produccion de Medios",
    owner: "Diego Pardo",
    type: "Issue",
    status: "Closed",
    priority: "Low",
    title: "Latencia alta en render de miniaturas",
    detail: "Problema cerrado tras ajuste de colas y caché.",
    mitigation: "Monitor de performance activo en horario prime.",
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

export async function getTeamCapacity(): Promise<TeamCapacityEntry[]> {
  const webhookUrl = process.env.N8N_CAPACITY_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_TEAM_CAPACITY;
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
    throw new Error("No fue posible obtener capacidad del equipo desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.capacity || raw.data || [];

  return items.map((item: Partial<TeamCapacityEntry>, index: number) =>
    normalizeCapacityEntry(item, index),
  );
}

export function getCapacityMetrics(entries: TeamCapacityEntry[]): CapacityMetrics {
  const people = entries.length;
  const overallocated = entries.filter(
    (entry) => utilizationBand(entry) === "over",
  ).length;
  const atRisk = entries.filter(
    (entry) => utilizationBand(entry) === "warning",
  ).length;
  const healthy = entries.filter(
    (entry) => utilizationBand(entry) === "healthy",
  ).length;
  const avgUtilization = people
    ? Math.round(
        entries.reduce(
          (accumulator, entry) => accumulator + utilizationPercent(entry),
          0,
        ) / people,
      )
    : 0;

  return {
    people,
    overallocated,
    atRisk,
    healthy,
    avgUtilization,
  };
}

export async function getRaidItems(): Promise<RaidItem[]> {
  const webhookUrl = process.env.N8N_RAID_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_RAID_ITEMS;
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
    throw new Error("No fue posible obtener el RAID log desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.raid || raw.data || [];

  return items.map((item: Partial<RaidItem>, index: number) =>
    normalizeRaidItem(item, index),
  );
}

export function getRaidMetrics(items: RaidItem[]): RaidMetrics {
  const openItems = items.filter((item) => isOpenStatus(item.status));

  return {
    total: items.length,
    open: openItems.length,
    criticalOpen: items.filter((item) => isCriticalOpen(item)).length,
    risks: items.filter((item) => item.type === "Risk").length,
    assumptions: items.filter((item) => item.type === "Assumption").length,
    issues: items.filter((item) => item.type === "Issue").length,
    dependencies: items.filter((item) => item.type === "Dependency").length,
  };
}

export function getRaidProjectSummaries(items: RaidItem[]): RaidProjectSummary[] {
  const grouped = new Map<string, RaidProjectSummary>();

  for (const item of items) {
    const current = grouped.get(item.projectId) || {
      projectId: item.projectId,
      projectName: item.projectName,
      clientName: item.clientName,
      industry: item.industry,
      open: 0,
      critical: 0,
      risks: 0,
      assumptions: 0,
      issues: 0,
      dependencies: 0,
    };

    if (isOpenStatus(item.status)) current.open += 1;
    if (isCriticalOpen(item)) current.critical += 1;

    if (item.type === "Risk") current.risks += 1;
    if (item.type === "Assumption") current.assumptions += 1;
    if (item.type === "Issue") current.issues += 1;
    if (item.type === "Dependency") current.dependencies += 1;

    grouped.set(item.projectId, current);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.critical !== a.critical) return b.critical - a.critical;
    if (b.open !== a.open) return b.open - a.open;
    return a.projectName.localeCompare(b.projectName);
  });
}
