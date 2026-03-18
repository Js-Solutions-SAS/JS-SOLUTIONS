import type { Quote } from "@/lib/types";

const PENDING_KEYWORDS = ["pendiente", "revisi", "cotiz", "diagn"];
const IN_PROGRESS_KEYWORDS = ["proceso", "curso", "gesti", "aprob", "brief", "enviado", "complet"];
const SIGNED_KEYWORDS = ["firm", "contrato"];

function mapStatusLabel(value: string): string {
  const normalized = value.toLowerCase().trim();

  if (["diagnostic_captured", "lead_captured", "captured"].includes(normalized)) {
    return "Diagnóstico Capturado";
  }
  if (["brief_sent", "brief_requested"].includes(normalized)) {
    return "Brief Enviado";
  }
  if (["brief_submitted", "brief_completed"].includes(normalized)) {
    return "Brief Completado";
  }
  if (["in_review", "quote_in_review"].includes(normalized)) {
    return "Cotización En Revisión";
  }
  if (["approved", "signed", "quote_signed", "contract_signed"].includes(normalized)) {
    return "Firmado";
  }
  if (["contract_sent", "contracted"].includes(normalized)) {
    return "Contrato Enviado";
  }

  return value;
}

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

function parseTechnicalBrief(
  value: unknown,
): Pick<Quote, "technicalBrief" | "technicalBriefRaw"> {
  if (value == null) {
    return {
      technicalBrief: null,
      technicalBriefRaw: undefined,
    };
  }

  if (typeof value === "object") {
    return {
      technicalBrief: value as Record<string, unknown>,
      technicalBriefRaw: undefined,
    };
  }

  const raw = normalizeString(value);
  if (!raw) {
    return {
      technicalBrief: null,
      technicalBriefRaw: undefined,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        technicalBrief: parsed as Record<string, unknown>,
        technicalBriefRaw: raw,
      };
    }
  } catch {
    return {
      technicalBrief: null,
      technicalBriefRaw: raw,
    };
  }

  return {
    technicalBrief: null,
    technicalBriefRaw: raw,
  };
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
  const briefData = parseTechnicalBrief(
    raw.Technical_Brief_JSON ?? raw.technicalBrief ?? raw.technical_brief_json,
  );
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
    mapStatusLabel(
      readVariant(raw, "estado", "status", "Estado", "Status") || "Pendiente",
    );
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
  const briefCompletedAt =
    readVariant(raw, "briefCompletedAt", "Brief_Completed_At", "brief_completed_at") ||
    undefined;
  const clientDashboardUrl =
    readVariant(
      raw,
      "clientDashboardUrl",
      "Client_Dashboard_URL",
      "client_dashboard_url",
      "dashboardUrl",
      "Dashboard_URL",
    ) || undefined;
  const quoteDocumentId =
    readVariant(
      raw,
      "quoteDocumentId",
      "Quote_Document_Id",
      "quote_document_id",
    ) || undefined;
  const quotePdfUrl =
    readVariant(raw, "quotePdfUrl", "Quote_PDF_URL", "quote_pdf_url") ||
    undefined;
  const quoteStatus =
    mapStatusLabel(
      readVariant(raw, "quoteStatus", "Quote_Status", "quote_status") || "",
    ) || undefined;
  const quoteGeneratedAt =
    readVariant(
      raw,
      "quoteGeneratedAt",
      "Quote_Generated_At",
      "quote_generated_at",
    ) || undefined;
  const quoteApprovedAt =
    readVariant(
      raw,
      "quoteApprovedAt",
      "Quote_Approved_At",
      "quote_approved_at",
    ) || undefined;
  const quoteLastFeedback =
    readVariant(
      raw,
      "quoteLastFeedback",
      "Quote_Last_Feedback",
      "quote_last_feedback",
    ) || undefined;
  const contractUrl =
    readVariant(raw, "contractUrl", "Contract_URL", "contract_url") ||
    undefined;
  const contractGeneratedAt =
    readVariant(
      raw,
      "contractGeneratedAt",
      "Contract_Generated_At",
      "contract_generated_at",
    ) || undefined;

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
    technicalBrief: briefData.technicalBrief,
    technicalBriefRaw: briefData.technicalBriefRaw,
    briefCompletedAt,
    clientDashboardUrl,
    quoteDocumentId,
    quotePdfUrl,
    quoteStatus,
    quoteGeneratedAt,
    quoteApprovedAt,
    quoteLastFeedback,
    contractUrl,
    contractGeneratedAt,
  };
}
