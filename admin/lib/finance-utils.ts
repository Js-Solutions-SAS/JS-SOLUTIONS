import type {
  FinanceBillingStatus,
  FinanceClientType,
  OperationalFinanceEntry,
} from "@/lib/types";

const CLIENT_TYPES: FinanceClientType[] = [
  "Public Sector",
  "Retail / E-commerce",
  "Luxury",
  "Media Production",
  "Technology",
];

const BILLING_STATUSES: FinanceBillingStatus[] = [
  "Pending Billing",
  "Partially Invoiced",
  "Fully Invoiced",
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

function normalizeClientType(value: unknown): FinanceClientType {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("public") || normalized.includes("gob") || normalized.includes("sector")) {
    return "Public Sector";
  }
  if (normalized.includes("retail") || normalized.includes("ecommerce")) {
    return "Retail / E-commerce";
  }
  if (normalized.includes("lux") || normalized.includes("lujo")) return "Luxury";
  if (normalized.includes("media") || normalized.includes("produ")) return "Media Production";
  return "Technology";
}

function normalizeCurrency(value: unknown): OperationalFinanceEntry["currency"] {
  void value;
  return "COP";
}

function normalizeBillingStatus(value: unknown): FinanceBillingStatus {
  const normalized = normalizeString(value).toLowerCase();

  if (normalized.includes("fully") || normalized.includes("completo") || normalized.includes("full")) {
    return "Fully Invoiced";
  }
  if (normalized.includes("partial") || normalized.includes("parcial")) {
    return "Partially Invoiced";
  }
  return "Pending Billing";
}

export function normalizeOperationalFinanceEntry(
  raw: Partial<OperationalFinanceEntry>,
  index: number,
): OperationalFinanceEntry {
  const budgetAmount = Math.max(normalizeNumber(raw.budgetAmount), 0);
  const executedAmount = Math.max(normalizeNumber(raw.executedAmount), 0);
  const pendingBillingAmount = Math.max(normalizeNumber(raw.pendingBillingAmount), 0);
  const invoicedAmount = Math.max(normalizeNumber(raw.invoicedAmount), 0);

  return {
    id: normalizeString(raw.id || `fin-${index + 1}`),
    projectId: normalizeString(raw.projectId || `project-${index + 1}`),
    projectName: normalizeString(raw.projectName || "Proyecto sin nombre"),
    clientName: normalizeString(raw.clientName || "Cliente no definido"),
    clientType: normalizeClientType(raw.clientType),
    industry: normalizeString(raw.industry || "General"),
    owner: normalizeString(raw.owner || "Sin asignar"),
    currency: normalizeCurrency(raw.currency),
    budgetAmount,
    executedAmount,
    pendingBillingAmount,
    invoicedAmount,
    billingStatus: normalizeBillingStatus(raw.billingStatus),
    updatedAt: normalizeDate(raw.updatedAt),
    externalUrl: normalizeString(raw.externalUrl || "") || undefined,
  };
}

export function isFinanceClientType(value: string): value is FinanceClientType {
  return CLIENT_TYPES.includes(value as FinanceClientType);
}

export function isFinanceBillingStatus(value: string): value is FinanceBillingStatus {
  return BILLING_STATUSES.includes(value as FinanceBillingStatus);
}

export function executionPct(entry: OperationalFinanceEntry): number {
  if (entry.budgetAmount <= 0) return 0;
  return Math.round((entry.executedAmount / entry.budgetAmount) * 100);
}

export function budgetVariance(entry: OperationalFinanceEntry): number {
  return Math.round((entry.budgetAmount - entry.executedAmount) * 100) / 100;
}

export function isOverBudget(entry: OperationalFinanceEntry): boolean {
  return entry.executedAmount > entry.budgetAmount;
}
