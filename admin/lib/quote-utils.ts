import type { Quote } from "@/lib/types";

const PENDING_KEYWORDS = ["pendiente", "revisi", "cotiz"];
const IN_PROGRESS_KEYWORDS = ["proceso", "curso", "gesti", "aprob"];
const SIGNED_KEYWORDS = ["firm", "enviado", "contrato", "complet"];

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function readVariant(
  raw: Partial<Quote> & Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = normalizeString(raw[key]);
    if (value) {
      return value;
    }
  }

  return "";
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

export function normalizeQuote(
  raw: Partial<Quote> & Record<string, unknown>,
  index: number,
): Quote {
  const servicio =
    readVariant(raw, "servicio", "service", "Servicio", "Service") ||
    "Sin servicio";
  const empresa =
    readVariant(raw, "empresa", "company", "Empresa", "Company") ||
    "Empresa no especificada";
  const nombre =
    readVariant(raw, "nombre", "name", "leadName", "Nombre", "Name") ||
    "Sin nombre";
  const id =
    readVariant(raw, "id", "leadId", "quoteId", "ID", "Lead_ID", "lead_id") ||
    `lead-${index + 1}`;
  const monto =
    readVariant(raw, "monto", "amount", "Monto", "Amount") || "$0";
  const estado =
    readVariant(raw, "estado", "status", "Estado", "Status") || "Pendiente";
  const email =
    readVariant(
      raw,
      "email",
      "prospectEmail",
      "Prospect_Email",
      "Email",
      "correo",
    ) || undefined;
  const industria =
    readVariant(raw, "industria", "industry", "Industria", "Industry") ||
    inferIndustry(`${empresa} ${servicio}`);
  const briefUrl =
    readVariant(raw, "briefUrl", "Brief_URL", "brief_url", "BriefUrl") ||
    undefined;
  const briefToken =
    readVariant(raw, "briefToken", "Brief_Token", "brief_token", "BriefToken") ||
    undefined;

  return {
    id,
    nombre,
    empresa,
    servicio,
    monto,
    estado,
    email,
    industria,
    briefUrl,
    briefToken,
  };
}
