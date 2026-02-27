import type {
  TicketClientType,
  TicketPriority,
  TicketSLAEntry,
  TicketSLAStatus,
} from "@/lib/types";

const CLIENT_TYPES: TicketClientType[] = [
  "Public Sector",
  "Retail / E-commerce",
  "Luxury",
  "Media Production",
  "Technology",
];

const TICKET_STATUSES: TicketSLAStatus[] = [
  "Open",
  "In Progress",
  "Pending Customer",
  "Resolved",
  "Closed",
];

const TICKET_PRIORITIES: TicketPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: unknown): string | undefined {
  const raw = normalizeString(value);
  if (!raw) return undefined;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
}

function normalizeClientType(value: unknown): TicketClientType {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("public") || normalized.includes("gob") || normalized.includes("sector")) {
    return "Public Sector";
  }
  if (normalized.includes("retail") || normalized.includes("ecommerce")) {
    return "Retail / E-commerce";
  }
  if (normalized.includes("lux") || normalized.includes("lujo")) {
    return "Luxury";
  }
  if (normalized.includes("media") || normalized.includes("contenido") || normalized.includes("produ")) {
    return "Media Production";
  }
  return "Technology";
}

function normalizeStatus(value: unknown): TicketSLAStatus {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("progress") || normalized.includes("curso")) return "In Progress";
  if (normalized.includes("customer") || normalized.includes("cliente")) return "Pending Customer";
  if (normalized.includes("resolve") || normalized.includes("resuelto")) return "Resolved";
  if (normalized.includes("close") || normalized.includes("cerrado")) return "Closed";
  return "Open";
}

function normalizePriority(value: unknown): TicketPriority {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("crit")) return "Critical";
  if (normalized.includes("high") || normalized.includes("alta")) return "High";
  if (normalized.includes("med")) return "Medium";
  return "Low";
}

export function normalizeTicketSLAEntry(
  raw: Partial<TicketSLAEntry>,
  index: number,
): TicketSLAEntry {
  const now = new Date().toISOString();
  const createdAt = normalizeDate(raw.createdAt) || now;

  return {
    id: normalizeString(raw.id || `sla-${index + 1}`),
    ticketId: normalizeString(raw.ticketId || `TK-${index + 1}`),
    projectId: normalizeString(raw.projectId || `project-${index + 1}`),
    projectName: normalizeString(raw.projectName || "Proyecto sin nombre"),
    clientName: normalizeString(raw.clientName || "Cliente no definido"),
    clientType: normalizeClientType(raw.clientType),
    industry: normalizeString(raw.industry || "General"),
    owner: normalizeString(raw.owner || "Sin asignar"),
    priority: normalizePriority(raw.priority),
    channel: normalizeString(raw.channel || "Email"),
    status: normalizeStatus(raw.status),
    summary: normalizeString(raw.summary || "Ticket sin descripción"),
    createdAt,
    firstResponseAt: normalizeDate(raw.firstResponseAt),
    resolvedAt: normalizeDate(raw.resolvedAt),
    targetResponseHours: Math.max(normalizeNumber(raw.targetResponseHours), 1),
    targetResolutionHours: Math.max(normalizeNumber(raw.targetResolutionHours), 1),
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

export function isTicketClientType(value: string): value is TicketClientType {
  return CLIENT_TYPES.includes(value as TicketClientType);
}

export function isTicketStatus(value: string): value is TicketSLAStatus {
  return TICKET_STATUSES.includes(value as TicketSLAStatus);
}

export function isTicketPriority(value: string): value is TicketPriority {
  return TICKET_PRIORITIES.includes(value as TicketPriority);
}

export function isTicketResolved(status: TicketSLAStatus): boolean {
  return status === "Resolved" || status === "Closed";
}

export function elapsedHours(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round((diff / 36e5) * 10) / 10);
}

export function responseHours(entry: TicketSLAEntry): number | null {
  if (!entry.firstResponseAt) return null;
  return elapsedHours(entry.createdAt, entry.firstResponseAt);
}

export function resolutionHours(entry: TicketSLAEntry): number | null {
  if (!entry.resolvedAt) return null;
  return elapsedHours(entry.createdAt, entry.resolvedAt);
}

export function responseBreached(entry: TicketSLAEntry): boolean {
  const responseTime = responseHours(entry);
  if (responseTime !== null) return responseTime > entry.targetResponseHours;

  return elapsedHours(entry.createdAt) > entry.targetResponseHours;
}

export function resolutionBreached(entry: TicketSLAEntry): boolean {
  const resolutionTime = resolutionHours(entry);
  if (resolutionTime !== null) return resolutionTime > entry.targetResolutionHours;
  if (isTicketResolved(entry.status)) return false;

  return elapsedHours(entry.createdAt) > entry.targetResolutionHours;
}

export function responseState(entry: TicketSLAEntry): "ok" | "breached" | "pending" {
  if (!entry.firstResponseAt && !responseBreached(entry)) return "pending";
  return responseBreached(entry) ? "breached" : "ok";
}

export function resolutionState(entry: TicketSLAEntry): "ok" | "breached" | "pending" {
  if (!isTicketResolved(entry.status) && !resolutionBreached(entry)) return "pending";
  return resolutionBreached(entry) ? "breached" : "ok";
}
