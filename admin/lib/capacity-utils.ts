import type { CapacityUtilizationBand, TeamCapacityEntry } from "@/lib/types";

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCapacityEntry(
  raw: Partial<TeamCapacityEntry>,
  index: number,
): TeamCapacityEntry {
  const capacityHours = normalizeNumber(raw.capacityHours || 0);
  const assignedHours = normalizeNumber(raw.assignedHours || 0);

  return {
    id: normalizeString(raw.id || `capacity-${index + 1}`),
    personName: normalizeString(raw.personName || "Sin nombre"),
    role: normalizeString(raw.role || "Sin rol"),
    weekLabel: normalizeString(raw.weekLabel || "Semana actual"),
    capacityHours,
    assignedHours,
    projectCount: normalizeNumber(raw.projectCount || 0),
    focusArea: normalizeString(raw.focusArea || "General"),
    ownerEmail: normalizeString(raw.ownerEmail || "") || undefined,
  };
}

export function utilizationPercent(entry: TeamCapacityEntry): number {
  if (entry.capacityHours <= 0) return 0;
  return Math.round((entry.assignedHours / entry.capacityHours) * 100);
}

export function utilizationBand(entry: TeamCapacityEntry): CapacityUtilizationBand {
  const utilization = utilizationPercent(entry);

  if (utilization > 100) return "over";
  if (utilization >= 85) return "warning";
  return "healthy";
}

export function isOverallocated(entry: TeamCapacityEntry): boolean {
  return utilizationBand(entry) === "over";
}
