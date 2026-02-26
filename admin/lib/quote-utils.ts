import type { Quote } from "@/lib/types";

const PENDING_KEYWORDS = ["pendiente", "revisi", "cotiz"];
const IN_PROGRESS_KEYWORDS = ["proceso", "curso", "gesti", "aprob"];
const SIGNED_KEYWORDS = ["firm", "enviado", "contrato", "complet"];

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

export function inferIndustry(text: string): string {
  const value = text.toLowerCase();

  if (value.includes("gob") || value.includes("public")) return "Sector Público";
  if (value.includes("retail") || value.includes("tienda") || value.includes("e-commerce")) return "Retail / E-commerce";
  if (value.includes("lujo") || value.includes("premium") || value.includes("fashion")) return "Marca de Lujo";
  if (value.includes("media") || value.includes("video") || value.includes("producci")) return "Producción de Medios";
  if (value.includes("salud") || value.includes("clin")) return "Salud";

  return "General";
}

export function parseAmount(value: string): number {
  const numeric = value.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const result = Number.parseFloat(numeric);
  return Number.isFinite(result) ? result : 0;
}

export function statusTone(status: string): "pending" | "progress" | "success" {
  const value = status.toLowerCase();

  if (SIGNED_KEYWORDS.some((keyword) => value.includes(keyword))) return "success";
  if (IN_PROGRESS_KEYWORDS.some((keyword) => value.includes(keyword))) return "progress";
  if (PENDING_KEYWORDS.some((keyword) => value.includes(keyword))) return "pending";

  return "pending";
}

export function normalizeQuote(raw: Partial<Quote>, index: number): Quote {
  const servicio = normalizeString(raw.servicio || "Sin servicio");
  const empresa = normalizeString(raw.empresa || "Empresa no especificada");

  return {
    id: normalizeString(raw.id || `lead-${index + 1}`),
    nombre: normalizeString(raw.nombre || "Sin nombre"),
    empresa,
    servicio,
    monto: normalizeString(raw.monto || "$0"),
    estado: normalizeString(raw.estado || "Pendiente"),
    email: normalizeString(raw.email || "") || undefined,
    industria:
      normalizeString(raw.industria || "") ||
      inferIndustry(`${empresa} ${servicio}`),
  };
}
