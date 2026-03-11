import type { Quote, QuotesFeedSource } from "@/lib/types";

export function sourceTone(source: QuotesFeedSource) {
  if (source === "live") return "success" as const;
  if (source === "error") return "pending" as const;
  return "neutral" as const;
}

export function sourceLabel(source: QuotesFeedSource) {
  if (source === "live") return "Fuente n8n activa";
  if (source === "error") return "Error de sincronizacion";
  return "Sin conexion n8n";
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

export function buildBriefSummary(quote: Quote): Array<{ label: string; value: string }> {
  const brief = quote.technicalBrief;

  if (!brief) {
    return [];
  }

  const objectives = normalizeList(brief.objectives);
  const integrations = normalizeList(brief.integrations);

  return [
    {
      label: "Objetivos",
      value: objectives.length > 0 ? objectives.join(", ") : "No definidos",
    },
    {
      label: "Urgencia",
      value: String(brief.urgency ?? "No definida"),
    },
    {
      label: "Stack actual",
      value: String(brief.currentStack ?? "No especificado"),
    },
    {
      label: "Activos de diseño",
      value: String(brief.designAssets ?? "No especificados"),
    },
    {
      label: "Integraciones",
      value: integrations.length > 0 ? integrations.join(", ") : "No definidas",
    },
    {
      label: "Notas adicionales",
      value: String(brief.additionalNotes ?? "Sin observaciones"),
    },
  ];
}

export function getStatusLabel(quote: Quote): string {
  if (quote.contractUrl || quote.estado === "Contrato Enviado") {
    return "Contrato Enviado";
  }

  if (quote.estado === "Firmado") {
    return "Firmado";
  }

  if (quote.quoteStatus === "En revisión") {
    return "Cotización En Revisión";
  }

  return quote.estado;
}
