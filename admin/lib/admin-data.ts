import "server-only";

import type {
  ApprovalItem,
  ApprovalMetrics,
  ApprovalStageCoverage,
  CapacityMetrics,
  ChangeRequest,
  ChangeRequestMetrics,
  DashboardMetrics,
  DeliveryMetrics,
  ExecutivePortfolioEntry,
  ExecutivePortfolioMetrics,
  OperationalFinanceClientSummary,
  OperationalFinanceEntry,
  OperationalFinanceMetrics,
  Milestone,
  RaidItem,
  RaidMetrics,
  RaidProjectSummary,
  Quote,
  QuotesFeedSource,
  SOP,
  TicketSLAClientSummary,
  TicketSLAEntry,
  TicketSLAMetrics,
  TeamCapacityEntry,
} from "@/lib/types";
import {
  isApprovalOverdue,
  isApprovalResolved,
  normalizeApprovalItem,
} from "@/lib/approval-utils";
import {
  costImpact,
  normalizeChangeRequest,
  scheduleImpactDays,
} from "@/lib/change-request-utils";
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
import {
  executionPct,
  isOverBudget,
  normalizeOperationalFinanceEntry,
} from "@/lib/finance-utils";
import {
  healthBand,
  healthScore,
  normalizeExecutivePortfolioEntry,
} from "@/lib/executive-portfolio-utils";
import { normalizeQuote, statusTone } from "@/lib/quote-utils";
import {
  normalizeTicketSLAEntry,
  resolutionBreached,
  resolutionHours,
  responseBreached,
  responseHours,
} from "@/lib/ticket-sla-utils";
import {
  daysUntil,
  isMilestoneBlocked,
  isMilestoneDone,
  milestoneRiskLevel,
  normalizeMilestone,
} from "@/lib/milestone-utils";
import {
  generateCorrelationId,
  getJsonWithTimeout,
  resolveApiInternalToken,
} from "@/lib/network";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const MOCK_QUOTES: Quote[] = [
  {
    id: "L-001",
    nombre: "Camilo Rodriguez",
    empresa: "TechGroup Latam",
    servicio: "Consultoria y Arquitectura",
    monto: "$4.500.000 COP",
    estado: "Pendiente",
    industria: "General",
  },
  {
    id: "L-002",
    nombre: "Laura Medina",
    empresa: "Retail Horizon",
    servicio: "Automatizacion de ventas e-commerce",
    monto: "$2.800.000 COP",
    estado: "En Proceso",
    industria: "Retail / E-commerce",
  },
  {
    id: "L-003",
    nombre: "Andres Pardo",
    empresa: "Secretaria de Movilidad",
    servicio: "Plataforma de atencion ciudadana",
    monto: "$7.200.000 COP",
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

const MOCK_APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: "apr-1",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldia Metropolitana",
    industry: "Sector Publico",
    owner: "Maria Torres",
    stage: "Brief",
    status: "Approved",
    requestedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    approvedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    title: "Aprobacion de brief funcional",
    notes: "Validado por PM y referente del cliente.",
  },
  {
    id: "apr-2",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldia Metropolitana",
    industry: "Sector Publico",
    owner: "Camilo Vega",
    stage: "Scope",
    status: "In Review",
    requestedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    title: "Validacion final de alcance",
    notes: "Pendiente firma de comite legal.",
  },
  {
    id: "apr-3",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    industry: "Retail / E-commerce",
    owner: "Luis Mejia",
    stage: "QA",
    status: "Pending",
    requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    title: "Go/No-Go QA checkout",
    notes: "Se requiere evidencia de regresion completa.",
  },
  {
    id: "apr-4",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    industry: "Retail / E-commerce",
    owner: "Laura Medina",
    stage: "UAT",
    status: "Blocked",
    requestedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    title: "Aprobacion UAT flujo omnicanal",
    notes: "Bloqueado por falta de usuarios de negocio en ventana acordada.",
  },
  {
    id: "apr-5",
    projectId: "P-003",
    projectName: "Produccion automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Produccion de Medios",
    owner: "Sara Alvarez",
    stage: "Contract",
    status: "Approved",
    requestedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    approvedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    title: "Anexo contractual de licenciamiento",
  },
  {
    id: "apr-6",
    projectId: "P-003",
    projectName: "Produccion automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Produccion de Medios",
    owner: "Diego Pardo",
    stage: "Scope Change",
    status: "Pending",
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    title: "Cambio de alcance para modulo editorial",
    notes: "Incremento de 2 automatizaciones y ajuste de cronograma.",
  },
];

const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: "cr-1",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldía Metropolitana",
    industry: "Sector Público",
    owner: "María Torres",
    type: "Compliance",
    status: "Pending Review",
    title: "Ajuste de módulo de trazabilidad legal",
    description: "Se solicita auditoría extendida de eventos para cumplir nueva circular.",
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    baselineCost: 7200,
    proposedCost: 8700,
    baselineDueDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    proposedDueDate: new Date(Date.now() + 17 * 86400000).toISOString(),
    justification: "Requisito regulatorio obligatorio para salida a producción.",
  },
  {
    id: "cr-2",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    industry: "Retail / E-commerce",
    owner: "Luis Mejía",
    type: "Scope",
    status: "Approved",
    title: "Integrar nuevo flujo de cupones en checkout",
    description: "Nueva regla de cupones segmentados por categoría de producto.",
    requestedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    baselineCost: 2800,
    proposedCost: 3600,
    baselineDueDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    proposedDueDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    justification: "Impacta conversión comercial en campaña de temporada.",
  },
  {
    id: "cr-3",
    projectId: "P-003",
    projectName: "Producción automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Producción de Medios",
    owner: "Sara Álvarez",
    type: "Technical",
    status: "In Progress",
    title: "Refactor de cola de render por picos nocturnos",
    description: "Se requiere redistribuir workers para evitar cuellos de botella.",
    requestedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    baselineCost: 1500,
    proposedCost: 2100,
    baselineDueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    proposedDueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
  {
    id: "cr-4",
    projectId: "P-003",
    projectName: "Producción automatizada de contenido",
    clientName: "Nova Media House",
    industry: "Producción de Medios",
    owner: "Diego Pardo",
    type: "Design",
    status: "Rejected",
    title: "Rediseño completo de dashboard editorial",
    description: "Cambio visual completo solicitado fuera del roadmap del trimestre.",
    requestedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    baselineCost: 1200,
    proposedCost: 5200,
    baselineDueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    proposedDueDate: new Date(Date.now() + 23 * 86400000).toISOString(),
    justification: "No aporta impacto operativo inmediato sobre KPI acordados.",
  },
];

const MOCK_TICKET_SLA: TicketSLAEntry[] = [
  {
    id: "sla-1",
    ticketId: "TK-1032",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldía Metropolitana",
    clientType: "Public Sector",
    industry: "Sector Público",
    owner: "María Torres",
    priority: "High",
    channel: "Email",
    status: "In Progress",
    summary: "Ajuste de permisos en módulo de reportes ciudadanos.",
    createdAt: new Date(Date.now() - 18 * 36e5).toISOString(),
    firstResponseAt: new Date(Date.now() - 10 * 36e5).toISOString(),
    targetResponseHours: 4,
    targetResolutionHours: 24,
  },
  {
    id: "sla-2",
    ticketId: "TK-1048",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    clientType: "Retail / E-commerce",
    industry: "Retail / E-commerce",
    owner: "Laura Medina",
    priority: "Critical",
    channel: "WhatsApp",
    status: "Resolved",
    summary: "Error intermitente en checkout con cupones segmentados.",
    createdAt: new Date(Date.now() - 40 * 36e5).toISOString(),
    firstResponseAt: new Date(Date.now() - 38 * 36e5).toISOString(),
    resolvedAt: new Date(Date.now() - 9 * 36e5).toISOString(),
    targetResponseHours: 1,
    targetResolutionHours: 12,
  },
  {
    id: "sla-3",
    ticketId: "TK-1061",
    projectId: "P-003",
    projectName: "Producción automatizada de contenido",
    clientName: "Nova Media House",
    clientType: "Media Production",
    industry: "Producción de Medios",
    owner: "Sara Álvarez",
    priority: "Medium",
    channel: "Portal",
    status: "Pending Customer",
    summary: "Solicitud de ajuste en flujo de aprobación editorial nocturna.",
    createdAt: new Date(Date.now() - 30 * 36e5).toISOString(),
    firstResponseAt: new Date(Date.now() - 24 * 36e5).toISOString(),
    targetResponseHours: 8,
    targetResolutionHours: 36,
  },
  {
    id: "sla-4",
    ticketId: "TK-1068",
    projectId: "P-004",
    projectName: "Clienteling Concierge",
    clientName: "Maison d'Or",
    clientType: "Luxury",
    industry: "Luxury Retail",
    owner: "Diego Pardo",
    priority: "Low",
    channel: "Email",
    status: "Closed",
    summary: "Cambio de texto en plantilla de notificación VIP.",
    createdAt: new Date(Date.now() - 55 * 36e5).toISOString(),
    firstResponseAt: new Date(Date.now() - 50 * 36e5).toISOString(),
    resolvedAt: new Date(Date.now() - 16 * 36e5).toISOString(),
    targetResponseHours: 12,
    targetResolutionHours: 48,
  },
  {
    id: "sla-5",
    ticketId: "TK-1075",
    projectId: "P-005",
    projectName: "Automation Hub",
    clientName: "TechGroup Latam",
    clientType: "Technology",
    industry: "Technology",
    owner: "Luis Mejía",
    priority: "High",
    channel: "Slack",
    status: "Open",
    summary: "Webhook de n8n no dispara evento de reintento en ERP.",
    createdAt: new Date(Date.now() - 6 * 36e5).toISOString(),
    targetResponseHours: 2,
    targetResolutionHours: 16,
  },
  {
    id: "sla-6",
    ticketId: "TK-1082",
    projectId: "P-006",
    projectName: "Payments Core",
    clientName: "Banco Federal",
    clientType: "Public Sector",
    industry: "Finanzas",
    owner: "Camilo Vega",
    priority: "Critical",
    channel: "Phone",
    status: "In Progress",
    summary: "Conciliación fallida en lote de pagos masivos.",
    createdAt: new Date(Date.now() - 20 * 36e5).toISOString(),
    firstResponseAt: new Date(Date.now() - 19 * 36e5).toISOString(),
    targetResponseHours: 1,
    targetResolutionHours: 8,
  },
];

const MOCK_OPERATIONAL_FINANCE: OperationalFinanceEntry[] = [
  {
    id: "fin-1",
    projectId: "P-001",
    projectName: "Portal de Licitaciones",
    clientName: "Alcaldía Metropolitana",
    clientType: "Public Sector",
    industry: "Sector Público",
    owner: "María Torres",
    currency: "COP",
    budgetAmount: 82000,
    executedAmount: 69400,
    pendingBillingAmount: 17800,
    invoicedAmount: 64200,
    billingStatus: "Partially Invoiced",
    updatedAt: new Date(Date.now() - 10 * 36e5).toISOString(),
  },
  {
    id: "fin-2",
    projectId: "P-002",
    projectName: "Ecommerce Omnicanal",
    clientName: "Retail Horizon",
    clientType: "Retail / E-commerce",
    industry: "Retail / E-commerce",
    owner: "Laura Medina",
    currency: "COP",
    budgetAmount: 56000,
    executedAmount: 43800,
    pendingBillingAmount: 9300,
    invoicedAmount: 40100,
    billingStatus: "Partially Invoiced",
    updatedAt: new Date(Date.now() - 6 * 36e5).toISOString(),
  },
  {
    id: "fin-3",
    projectId: "P-003",
    projectName: "Producción automatizada de contenido",
    clientName: "Nova Media House",
    clientType: "Media Production",
    industry: "Producción de Medios",
    owner: "Sara Álvarez",
    currency: "COP",
    budgetAmount: 34000,
    executedAmount: 36250,
    pendingBillingAmount: 7100,
    invoicedAmount: 29150,
    billingStatus: "Pending Billing",
    updatedAt: new Date(Date.now() - 14 * 36e5).toISOString(),
  },
  {
    id: "fin-4",
    projectId: "P-004",
    projectName: "Clienteling Concierge",
    clientName: "Maison d'Or",
    clientType: "Luxury",
    industry: "Luxury Retail",
    owner: "Diego Pardo",
    currency: "COP",
    budgetAmount: 47000,
    executedAmount: 31100,
    pendingBillingAmount: 12400,
    invoicedAmount: 29900,
    billingStatus: "Partially Invoiced",
    updatedAt: new Date(Date.now() - 5 * 36e5).toISOString(),
  },
  {
    id: "fin-5",
    projectId: "P-005",
    projectName: "Automation Hub",
    clientName: "TechGroup Latam",
    clientType: "Technology",
    industry: "Technology",
    owner: "Luis Mejía",
    currency: "COP",
    budgetAmount: 29500,
    executedAmount: 17400,
    pendingBillingAmount: 6600,
    invoicedAmount: 14300,
    billingStatus: "Pending Billing",
    updatedAt: new Date(Date.now() - 3 * 36e5).toISOString(),
  },
];

const MOCK_EXECUTIVE_PORTFOLIO: ExecutivePortfolioEntry[] = [
  {
    id: "portfolio-1",
    industry: "Public Sector",
    activeProjects: 8,
    onTrackProjects: 5,
    atRiskProjects: 2,
    criticalProjects: 1,
    avgSLACompliancePct: 84,
    avgExecutionPct: 92,
    pendingBillingAmount: 31200,
    openApprovals: 6,
    openRaidItems: 7,
    owner: "María Torres",
    updatedAt: new Date(Date.now() - 7 * 36e5).toISOString(),
  },
  {
    id: "portfolio-2",
    industry: "Retail / E-commerce",
    activeProjects: 6,
    onTrackProjects: 4,
    atRiskProjects: 2,
    criticalProjects: 0,
    avgSLACompliancePct: 90,
    avgExecutionPct: 88,
    pendingBillingAmount: 24600,
    openApprovals: 4,
    openRaidItems: 4,
    owner: "Laura Medina",
    updatedAt: new Date(Date.now() - 5 * 36e5).toISOString(),
  },
  {
    id: "portfolio-3",
    industry: "Luxury",
    activeProjects: 4,
    onTrackProjects: 3,
    atRiskProjects: 1,
    criticalProjects: 0,
    avgSLACompliancePct: 95,
    avgExecutionPct: 81,
    pendingBillingAmount: 18900,
    openApprovals: 2,
    openRaidItems: 2,
    owner: "Diego Pardo",
    updatedAt: new Date(Date.now() - 4 * 36e5).toISOString(),
  },
  {
    id: "portfolio-4",
    industry: "Media Production",
    activeProjects: 5,
    onTrackProjects: 2,
    atRiskProjects: 2,
    criticalProjects: 1,
    avgSLACompliancePct: 78,
    avgExecutionPct: 103,
    pendingBillingAmount: 27100,
    openApprovals: 5,
    openRaidItems: 8,
    owner: "Sara Álvarez",
    updatedAt: new Date(Date.now() - 9 * 36e5).toISOString(),
  },
];

export async function getQuotes(): Promise<Quote[]> {
  const apiBaseUrl = String(process.env.API_BASE_URL || "").trim();
  const apiToken = resolveApiInternalToken();
  const correlationId = generateCorrelationId("quotes-list");

  if (!apiBaseUrl) {
    return MOCK_QUOTES;
  }

  const response = await getJsonWithTimeout(
    `${apiBaseUrl.replace(/\/$/, "")}/api/v1/quotes`,
    {
      correlationId,
      secretToken: apiToken,
    },
  );
  if (!response.ok) {
    throw new Error(
      `${response.errorMessage || "No fue posible obtener cotizaciones desde la API."} CorrelationId: ${response.correlationId}`,
    );
  }

  const raw = response.data;
  const itemsSource: unknown = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.items)
      ? raw.items
      : raw.quotes;
  const items = Array.isArray(itemsSource) ? itemsSource : [];

  return items.map(
    (item: unknown, index: number) =>
      normalizeQuote((item as Partial<Quote> & Record<string, unknown>) || {}, index),
  );
}

export interface QuotesFeedResult {
  quotes: Quote[];
  source: QuotesFeedSource;
  message: string;
}

export async function getQuotesFeed(): Promise<QuotesFeedResult> {
  const apiBaseUrl = String(process.env.API_BASE_URL || "").trim();
  const apiToken = resolveApiInternalToken();
  const correlationId = generateCorrelationId("quotes-feed");

  if (!apiBaseUrl) {
    return {
      quotes: [],
      source: "unconfigured",
      message:
        "Configura API_BASE_URL para ver cotizaciones reales desde la API.",
    };
  }

  try {
    const response = await getJsonWithTimeout(
      `${apiBaseUrl.replace(/\/$/, "")}/api/v1/quotes`,
      {
        correlationId,
        secretToken: apiToken,
      },
    );
    if (!response.ok) {
      throw new Error(
        response.errorMessage || `API respondio con estado ${response.status}`,
      );
    }

    const raw = response.data;
    const itemsSource: unknown = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.items)
        ? raw.items
        : raw.quotes || raw.data;
    const items = Array.isArray(itemsSource) ? itemsSource : [];

    return {
      quotes: items.map(
        (item: unknown, index: number) =>
          normalizeQuote((item as Partial<Quote> & Record<string, unknown>) || {}, index),
      ),
      source: "live",
      message:
        items.length > 0
          ? "Cotizaciones sincronizadas en tiempo real desde la API."
          : "La conexión con la API está activa, pero aún no hay cotizaciones registradas.",
    };
  } catch (error) {
    console.error("getQuotesFeed", error);

    return {
      quotes: [],
      source: "error",
      message:
        `No fue posible sincronizar cotizaciones desde la API. Revisa API_BASE_URL. CorrelationId: ${correlationId}`,
    };
  }
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
  const [quotesFeed, sopsResult] = await Promise.allSettled([
    getQuotesFeed(),
    getSops(),
  ]);

  const quotes = quotesFeed.status === "fulfilled" ? quotesFeed.value.quotes : [];
  const sops = sopsResult.status === "fulfilled" ? sopsResult.value : MOCK_SOPS;

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

export async function getApprovals(): Promise<ApprovalItem[]> {
  const webhookUrl = process.env.N8N_APPROVALS_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_APPROVAL_ITEMS;
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
    throw new Error("No fue posible obtener aprobaciones desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.approvals || raw.data || [];

  return items.map((item: Partial<ApprovalItem>, index: number) =>
    normalizeApprovalItem(item, index),
  );
}

export function getApprovalMetrics(items: ApprovalItem[]): ApprovalMetrics {
  return {
    total: items.length,
    pending: items.filter((item) => item.status === "Pending").length,
    inReview: items.filter((item) => item.status === "In Review").length,
    blocked: items.filter((item) => item.status === "Blocked").length,
    approved: items.filter((item) => item.status === "Approved").length,
    overdue: items.filter((item) => isApprovalOverdue(item)).length,
  };
}

export function getApprovalStageCoverage(
  items: ApprovalItem[],
): ApprovalStageCoverage[] {
  const stages: ApprovalStageCoverage["stage"][] = [
    "Brief",
    "Scope",
    "QA",
    "UAT",
    "Contract",
    "Scope Change",
  ];

  return stages.map((stage) => {
    const entries = items.filter((item) => item.stage === stage);

    return {
      stage,
      total: entries.length,
      approved: entries.filter((item) => item.status === "Approved").length,
      pending: entries.filter((item) => !isApprovalResolved(item.status)).length,
    };
  });
}

export async function getChangeRequests(): Promise<ChangeRequest[]> {
  const webhookUrl = process.env.N8N_CHANGE_REQUESTS_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_CHANGE_REQUESTS;
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
    throw new Error("No fue posible obtener solicitudes de cambio desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.changeRequests || raw.data || [];

  return items.map((item: Partial<ChangeRequest>, index: number) =>
    normalizeChangeRequest(item, index),
  );
}

export function getChangeRequestMetrics(items: ChangeRequest[]): ChangeRequestMetrics {
  const totalCostImpact = items.reduce(
    (accumulator, item) => accumulator + costImpact(item),
    0,
  );
  const totalDelayDays = items.reduce(
    (accumulator, item) => accumulator + Math.max(scheduleImpactDays(item), 0),
    0,
  );

  return {
    total: items.length,
    pendingReview: items.filter((item) => item.status === "Pending Review").length,
    approved: items.filter((item) => item.status === "Approved").length,
    rejected: items.filter((item) => item.status === "Rejected").length,
    inDelivery: items.filter(
      (item) => item.status === "In Progress" || item.status === "Implemented",
    ).length,
    totalCostImpact: Math.round(totalCostImpact * 100) / 100,
    totalDelayDays,
  };
}

export async function getTicketSLAEntries(): Promise<TicketSLAEntry[]> {
  const webhookUrl = process.env.N8N_TICKETS_SLA_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_TICKET_SLA;
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
    throw new Error("No fue posible obtener los tickets SLA desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.tickets || raw.data || [];

  return items.map((item: Partial<TicketSLAEntry>, index: number) =>
    normalizeTicketSLAEntry(item, index),
  );
}

export function getTicketSLAMetrics(items: TicketSLAEntry[]): TicketSLAMetrics {
  const responseTimes = items
    .map((item) => responseHours(item))
    .filter((value): value is number => value !== null);
  const resolutionTimes = items
    .map((item) => resolutionHours(item))
    .filter((value): value is number => value !== null);

  const withinSLA = items.filter(
    (item) => !responseBreached(item) && !resolutionBreached(item),
  ).length;

  return {
    total: items.length,
    open: items.filter((item) => item.status === "Open" || item.status === "In Progress").length,
    breachedResponse: items.filter((item) => responseBreached(item)).length,
    breachedResolution: items.filter((item) => resolutionBreached(item)).length,
    withinSLA,
    avgResponseHours: responseTimes.length
      ? Math.round(
          (responseTimes.reduce((accumulator, value) => accumulator + value, 0) /
            responseTimes.length) *
            10,
        ) / 10
      : 0,
    avgResolutionHours: resolutionTimes.length
      ? Math.round(
          (resolutionTimes.reduce((accumulator, value) => accumulator + value, 0) /
            resolutionTimes.length) *
            10,
        ) / 10
      : 0,
  };
}

export function getTicketSLAClientSummaries(
  items: TicketSLAEntry[],
): TicketSLAClientSummary[] {
  const grouped = new Map<TicketSLAClientSummary["clientType"], TicketSLAClientSummary>();

  for (const item of items) {
    const current = grouped.get(item.clientType) || {
      clientType: item.clientType,
      total: 0,
      breachedResponse: 0,
      breachedResolution: 0,
      withinSLA: 0,
    };

    current.total += 1;
    if (responseBreached(item)) current.breachedResponse += 1;
    if (resolutionBreached(item)) current.breachedResolution += 1;
    if (!responseBreached(item) && !resolutionBreached(item)) current.withinSLA += 1;

    grouped.set(item.clientType, current);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const breachesA = a.breachedResponse + a.breachedResolution;
    const breachesB = b.breachedResponse + b.breachedResolution;
    if (breachesB !== breachesA) return breachesB - breachesA;
    return b.total - a.total;
  });
}

export async function getOperationalFinanceEntries(): Promise<OperationalFinanceEntry[]> {
  const webhookUrl = process.env.N8N_OPERATIONAL_FINANCE_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_OPERATIONAL_FINANCE;
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
    throw new Error("No fue posible obtener finanzas operativas desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.finances || raw.data || [];

  return items.map((item: Partial<OperationalFinanceEntry>, index: number) =>
    normalizeOperationalFinanceEntry(item, index),
  );
}

export function getOperationalFinanceMetrics(
  items: OperationalFinanceEntry[],
): OperationalFinanceMetrics {
  const projects = items.length;
  const totalBudget = items.reduce((accumulator, item) => accumulator + item.budgetAmount, 0);
  const totalExecuted = items.reduce((accumulator, item) => accumulator + item.executedAmount, 0);
  const totalPendingBilling = items.reduce(
    (accumulator, item) => accumulator + item.pendingBillingAmount,
    0,
  );
  const totalInvoiced = items.reduce((accumulator, item) => accumulator + item.invoicedAmount, 0);
  const avgExecutionPct = projects
    ? Math.round(items.reduce((accumulator, item) => accumulator + executionPct(item), 0) / projects)
    : 0;

  return {
    projects,
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalExecuted: Math.round(totalExecuted * 100) / 100,
    totalPendingBilling: Math.round(totalPendingBilling * 100) / 100,
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    avgExecutionPct,
    overBudget: items.filter((item) => isOverBudget(item)).length,
  };
}

export function getOperationalFinanceClientSummaries(
  items: OperationalFinanceEntry[],
): OperationalFinanceClientSummary[] {
  const grouped = new Map<OperationalFinanceClientSummary["clientType"], OperationalFinanceClientSummary>();

  for (const item of items) {
    const current = grouped.get(item.clientType) || {
      clientType: item.clientType,
      projects: 0,
      totalBudget: 0,
      totalExecuted: 0,
      totalPendingBilling: 0,
    };

    current.projects += 1;
    current.totalBudget += item.budgetAmount;
    current.totalExecuted += item.executedAmount;
    current.totalPendingBilling += item.pendingBillingAmount;

    grouped.set(item.clientType, current);
  }

  return Array.from(grouped.values())
    .map((summary) => ({
      ...summary,
      totalBudget: Math.round(summary.totalBudget * 100) / 100,
      totalExecuted: Math.round(summary.totalExecuted * 100) / 100,
      totalPendingBilling: Math.round(summary.totalPendingBilling * 100) / 100,
    }))
    .sort((a, b) => b.totalPendingBilling - a.totalPendingBilling);
}

export async function getExecutivePortfolioEntries(): Promise<ExecutivePortfolioEntry[]> {
  const webhookUrl = process.env.N8N_EXECUTIVE_PORTFOLIO_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_EXECUTIVE_PORTFOLIO;
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
    throw new Error("No fue posible obtener el portafolio ejecutivo desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.portfolio || raw.data || [];

  return items.map((item: Partial<ExecutivePortfolioEntry>, index: number) =>
    normalizeExecutivePortfolioEntry(item, index),
  );
}

export function getExecutivePortfolioMetrics(
  items: ExecutivePortfolioEntry[],
): ExecutivePortfolioMetrics {
  const industries = items.length;
  const totalProjects = items.reduce(
    (accumulator, item) => accumulator + item.activeProjects,
    0,
  );
  const totalPendingBilling = items.reduce(
    (accumulator, item) => accumulator + item.pendingBillingAmount,
    0,
  );
  const avgPortfolioHealth = industries
    ? Math.round(
        items.reduce((accumulator, item) => accumulator + healthScore(item), 0) /
          industries,
      )
    : 0;

  return {
    industries,
    totalProjects,
    healthyIndustries: items.filter((item) => healthBand(item) === "healthy").length,
    warningIndustries: items.filter((item) => healthBand(item) === "warning").length,
    criticalIndustries: items.filter((item) => healthBand(item) === "critical").length,
    totalPendingBilling: Math.round(totalPendingBilling * 100) / 100,
    avgPortfolioHealth,
  };
}
