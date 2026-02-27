import type {
  ExecutiveIndustry,
  ExecutivePortfolioEntry,
} from "@/lib/types";

const INDUSTRIES: ExecutiveIndustry[] = [
  "Public Sector",
  "Retail / E-commerce",
  "Luxury",
  "Media Production",
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

function normalizeIndustry(value: unknown): ExecutiveIndustry {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("public") || normalized.includes("gob") || normalized.includes("sector")) {
    return "Public Sector";
  }
  if (normalized.includes("retail") || normalized.includes("ecommerce")) {
    return "Retail / E-commerce";
  }
  if (normalized.includes("lux") || normalized.includes("lujo")) return "Luxury";
  return "Media Production";
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeExecutivePortfolioEntry(
  raw: Partial<ExecutivePortfolioEntry>,
  index: number,
): ExecutivePortfolioEntry {
  return {
    id: normalizeString(raw.id || `portfolio-${index + 1}`),
    industry: normalizeIndustry(raw.industry),
    activeProjects: Math.max(0, normalizeNumber(raw.activeProjects)),
    onTrackProjects: Math.max(0, normalizeNumber(raw.onTrackProjects)),
    atRiskProjects: Math.max(0, normalizeNumber(raw.atRiskProjects)),
    criticalProjects: Math.max(0, normalizeNumber(raw.criticalProjects)),
    avgSLACompliancePct: clampPercent(normalizeNumber(raw.avgSLACompliancePct)),
    avgExecutionPct: clampPercent(normalizeNumber(raw.avgExecutionPct)),
    pendingBillingAmount: Math.max(0, normalizeNumber(raw.pendingBillingAmount)),
    openApprovals: Math.max(0, normalizeNumber(raw.openApprovals)),
    openRaidItems: Math.max(0, normalizeNumber(raw.openRaidItems)),
    owner: normalizeString(raw.owner || "Sin asignar"),
    updatedAt: normalizeDate(raw.updatedAt),
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

export function isExecutiveIndustry(value: string): value is ExecutiveIndustry {
  return INDUSTRIES.includes(value as ExecutiveIndustry);
}

export function healthScore(entry: ExecutivePortfolioEntry): number {
  const riskPenalty = entry.atRiskProjects * 8 + entry.criticalProjects * 16;
  const executionPenalty = Math.max(entry.avgExecutionPct - 100, 0) * 0.9;
  const slaPenalty = Math.max(90 - entry.avgSLACompliancePct, 0) * 0.7;
  const governancePenalty = entry.openApprovals * 2 + entry.openRaidItems * 1.5;

  const score = 100 - riskPenalty - executionPenalty - slaPenalty - governancePenalty;
  return clampPercent(score);
}

export function healthBand(entry: ExecutivePortfolioEntry): "healthy" | "warning" | "critical" {
  const score = healthScore(entry);
  if (score >= 80) return "healthy";
  if (score >= 60) return "warning";
  return "critical";
}
