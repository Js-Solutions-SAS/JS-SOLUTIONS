import type {
  ApprovalItem,
  ApprovalStage,
  ApprovalStatus,
} from "@/lib/types";

const APPROVAL_STAGES: ApprovalStage[] = [
  "Brief",
  "Scope",
  "QA",
  "UAT",
  "Contract",
  "Scope Change",
];

const APPROVAL_STATUSES: ApprovalStatus[] = [
  "Pending",
  "In Review",
  "Approved",
  "Rejected",
  "Blocked",
];

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeDate(value: unknown): string | undefined {
  const raw = normalizeString(value);
  if (!raw) return undefined;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
}

function normalizeStage(value: unknown): ApprovalStage {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("brief")) return "Brief";
  if (
    normalized.includes("scope") ||
    normalized.includes("alcance")
  ) {
    return normalized.includes("cambio") ? "Scope Change" : "Scope";
  }
  if (normalized.includes("qa")) return "QA";
  if (normalized.includes("uat")) return "UAT";
  if (normalized.includes("contrato") || normalized.includes("contract")) {
    return "Contract";
  }
  if (
    normalized.includes("cambio") ||
    normalized.includes("change")
  ) {
    return "Scope Change";
  }

  return "Brief";
}

function normalizeStatus(value: unknown): ApprovalStatus {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("review") || normalized.includes("revision")) return "In Review";
  if (normalized.includes("approv") || normalized.includes("aprob")) return "Approved";
  if (normalized.includes("reject") || normalized.includes("rechaz")) return "Rejected";
  if (normalized.includes("block") || normalized.includes("bloq")) return "Blocked";
  return "Pending";
}

export function normalizeApprovalItem(
  raw: Partial<ApprovalItem>,
  index: number,
): ApprovalItem {
  const now = new Date().toISOString();
  const status = normalizeStatus(raw.status);
  const approvedAt = normalizeDate(raw.approvedAt);

  return {
    id: normalizeString(raw.id || `approval-${index + 1}`),
    projectId: normalizeString(raw.projectId || `project-${index + 1}`),
    projectName: normalizeString(raw.projectName || "Proyecto sin nombre"),
    clientName: normalizeString(raw.clientName || "Cliente no definido"),
    industry: normalizeString(raw.industry || "General"),
    owner: normalizeString(raw.owner || "Sin asignar"),
    stage: normalizeStage(raw.stage),
    status,
    requestedAt: normalizeDate(raw.requestedAt) || now,
    dueDate: normalizeDate(raw.dueDate),
    approvedAt: status === "Approved" ? approvedAt || now : approvedAt,
    title: normalizeString(raw.title || "Aprobacion sin titulo"),
    notes: normalizeString(raw.notes || "") || undefined,
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

export function isApprovalStage(value: string): value is ApprovalStage {
  return APPROVAL_STAGES.includes(value as ApprovalStage);
}

export function isApprovalStatus(value: string): value is ApprovalStatus {
  return APPROVAL_STATUSES.includes(value as ApprovalStatus);
}

export function isApprovalResolved(status: ApprovalStatus): boolean {
  return status === "Approved" || status === "Rejected";
}

export function isApprovalActionable(status: ApprovalStatus): boolean {
  return status === "Pending" || status === "In Review";
}

export function isApprovalOverdue(item: ApprovalItem): boolean {
  if (!item.dueDate || isApprovalResolved(item.status)) return false;

  const due = new Date(item.dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
}
