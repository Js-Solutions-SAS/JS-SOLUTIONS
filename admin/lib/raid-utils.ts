import type { RaidItem, RaidStatus, RaidType } from "@/lib/types";

const RAID_TYPES: RaidType[] = ["Risk", "Assumption", "Issue", "Dependency"];
const RAID_STATUSES: RaidStatus[] = ["Open", "Mitigated", "Blocked", "Closed"];

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

function normalizeType(value: unknown): RaidType {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("assump")) return "Assumption";
  if (normalized.includes("issue") || normalized.includes("inciden")) return "Issue";
  if (normalized.includes("depend")) return "Dependency";
  return "Risk";
}

function normalizeStatus(value: unknown): RaidStatus {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("mitig")) return "Mitigated";
  if (normalized.includes("block")) return "Blocked";
  if (normalized.includes("clos") || normalized.includes("cerr")) return "Closed";
  return "Open";
}

function normalizePriority(value: unknown): RaidItem["priority"] {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("crit")) return "Critical";
  if (normalized.includes("high") || normalized.includes("alta")) return "High";
  if (normalized.includes("med")) return "Medium";
  return "Low";
}

export function normalizeRaidItem(raw: Partial<RaidItem>, index: number): RaidItem {
  const type = normalizeType(raw.type);
  const status = normalizeStatus(raw.status);

  return {
    id: normalizeString(raw.id || `raid-${index + 1}`),
    projectId: normalizeString(raw.projectId || `project-${index + 1}`),
    projectName: normalizeString(raw.projectName || "Proyecto sin nombre"),
    clientName: normalizeString(raw.clientName || "Cliente no definido"),
    industry: normalizeString(raw.industry || "General"),
    owner: normalizeString(raw.owner || "Sin asignar"),
    type,
    status,
    priority: normalizePriority(raw.priority),
    title: normalizeString(raw.title || "Registro sin titulo"),
    detail: normalizeString(raw.detail || "Sin detalle"),
    dueDate: normalizeDate(raw.dueDate),
    mitigation: normalizeString(raw.mitigation || "") || undefined,
    dependencyOn: normalizeString(raw.dependencyOn || "") || undefined,
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

export function isRaidType(value: string): value is RaidType {
  return RAID_TYPES.includes(value as RaidType);
}

export function isRaidStatus(value: string): value is RaidStatus {
  return RAID_STATUSES.includes(value as RaidStatus);
}

export function isOpenStatus(status: RaidStatus): boolean {
  return status === "Open" || status === "Blocked";
}

export function isCriticalOpen(item: RaidItem): boolean {
  return isOpenStatus(item.status) && (item.priority === "High" || item.priority === "Critical");
}
