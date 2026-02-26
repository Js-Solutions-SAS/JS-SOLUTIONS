import type { Milestone, MilestoneRiskLevel } from "@/lib/types";

const DONE_STATUSES = ["completado", "done", "cerrado", "entregado"];
const BLOCKED_STATUSES = ["bloqueado", "blocked", "hold", "detenido"];

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

export function toISODate(value: unknown): string {
  const raw = normalizeString(value);
  if (!raw) return new Date().toISOString();

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();

  return parsed.toISOString();
}

export function normalizeMilestone(
  raw: Partial<Milestone>,
  index: number,
): Milestone {
  return {
    id: normalizeString(raw.id || `milestone-${index + 1}`),
    projectId: normalizeString(raw.projectId || raw.id || `project-${index + 1}`),
    projectName: normalizeString(raw.projectName || "Proyecto sin nombre"),
    clientName: normalizeString(raw.clientName || "Cliente no definido"),
    industry: normalizeString(raw.industry || "General"),
    owner: normalizeString(raw.owner || "Sin asignar"),
    phase: normalizeString(raw.phase || "Ejecucion"),
    title: normalizeString(raw.title || "Hito sin titulo"),
    dueDate: toISODate(raw.dueDate),
    status: normalizeString(raw.status || "Pendiente"),
    priority: normalizeString(raw.priority || "Media"),
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

function isDone(status: string): boolean {
  const value = status.toLowerCase();
  return DONE_STATUSES.some((keyword) => value.includes(keyword));
}

function isBlocked(status: string): boolean {
  const value = status.toLowerCase();
  return BLOCKED_STATUSES.some((keyword) => value.includes(keyword));
}

export function daysUntil(date: string): number {
  const target = new Date(date);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function milestoneRiskLevel(milestone: Milestone): MilestoneRiskLevel {
  if (isDone(milestone.status)) return "none";

  const remainingDays = daysUntil(milestone.dueDate);

  if (isBlocked(milestone.status) || remainingDays < 0) {
    return "high";
  }

  if (remainingDays <= 3) {
    return "medium";
  }

  return "low";
}

export function isMilestoneDone(milestone: Milestone): boolean {
  return isDone(milestone.status);
}

export function isMilestoneBlocked(milestone: Milestone): boolean {
  return isBlocked(milestone.status);
}
