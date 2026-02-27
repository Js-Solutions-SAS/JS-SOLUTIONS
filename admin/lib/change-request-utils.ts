import type {
  ChangeRequest,
  ChangeRequestStatus,
  ChangeRequestType,
} from "@/lib/types";

const CHANGE_REQUEST_TYPES: ChangeRequestType[] = [
  "Scope",
  "Technical",
  "Design",
  "Compliance",
];

const CHANGE_REQUEST_STATUSES: ChangeRequestStatus[] = [
  "Pending Review",
  "Approved",
  "Rejected",
  "In Progress",
  "Implemented",
];

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: unknown): string {
  const raw = normalizeString(value);
  if (!raw) return new Date().toISOString();

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();

  return parsed.toISOString();
}

function normalizeType(value: unknown): ChangeRequestType {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized.includes("tech")) return "Technical";
  if (normalized.includes("design") || normalized.includes("ux") || normalized.includes("ui")) {
    return "Design";
  }
  if (normalized.includes("compliance") || normalized.includes("legal") || normalized.includes("norma")) {
    return "Compliance";
  }
  return "Scope";
}

function normalizeStatus(value: unknown): ChangeRequestStatus {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized.includes("approv") || normalized.includes("aprob")) return "Approved";
  if (normalized.includes("reject") || normalized.includes("rechaz")) return "Rejected";
  if (normalized.includes("progress") || normalized.includes("curso") || normalized.includes("desarrollo")) {
    return "In Progress";
  }
  if (normalized.includes("implement") || normalized.includes("entregado")) return "Implemented";
  return "Pending Review";
}

export function normalizeChangeRequest(
  raw: Partial<ChangeRequest>,
  index: number,
): ChangeRequest {
  return {
    id: normalizeString(raw.id || `cr-${index + 1}`),
    projectId: normalizeString(raw.projectId || `project-${index + 1}`),
    projectName: normalizeString(raw.projectName || "Proyecto sin nombre"),
    clientName: normalizeString(raw.clientName || "Cliente no definido"),
    industry: normalizeString(raw.industry || "General"),
    owner: normalizeString(raw.owner || "Sin asignar"),
    type: normalizeType(raw.type),
    status: normalizeStatus(raw.status),
    title: normalizeString(raw.title || "Solicitud de cambio"),
    description: normalizeString(raw.description || "Sin descripción"),
    requestedAt: normalizeDate(raw.requestedAt),
    baselineCost: normalizeNumber(raw.baselineCost),
    proposedCost: normalizeNumber(raw.proposedCost),
    baselineDueDate: normalizeDate(raw.baselineDueDate),
    proposedDueDate: normalizeDate(raw.proposedDueDate),
    justification: normalizeString(raw.justification || "") || undefined,
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

export function isChangeRequestStatus(value: string): value is ChangeRequestStatus {
  return CHANGE_REQUEST_STATUSES.includes(value as ChangeRequestStatus);
}

export function isChangeRequestType(value: string): value is ChangeRequestType {
  return CHANGE_REQUEST_TYPES.includes(value as ChangeRequestType);
}

export function isChangeRequestActionable(status: ChangeRequestStatus): boolean {
  return status === "Pending Review";
}

export function costImpact(request: ChangeRequest): number {
  return Math.round((request.proposedCost - request.baselineCost) * 100) / 100;
}

export function scheduleImpactDays(request: ChangeRequest): number {
  const baseline = new Date(request.baselineDueDate);
  const proposed = new Date(request.proposedDueDate);

  baseline.setHours(0, 0, 0, 0);
  proposed.setHours(0, 0, 0, 0);

  const diff = proposed.getTime() - baseline.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
