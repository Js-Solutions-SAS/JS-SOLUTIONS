"use server";

import { revalidatePath } from "next/cache";

import type { Quote } from "@/lib/types";

interface CreateQuoteInput {
  leadId?: string;
  nombre: string;
  empresa: string;
  email?: string;
  servicio: string;
  monto: string;
  industria?: string;
  detalles?: string;
  sector?: string;
  complejidad?: string;
  servicios?: string[];
  rangoInversion?: {
    min: number;
    max: number;
  };
  estado?: string;
}

interface GenerateContractInput {
  leadId: string;
  email?: string;
  estado?: string;
}

interface GenerateQuoteInput {
  leadId: string;
  nombre: string;
  empresa: string;
  email?: string;
  servicio: string;
  briefToken?: string;
  technicalBrief?: Record<string, unknown> | null;
  feedback?: string;
}

function normalizeInput(value: string | undefined): string {
  return String(value || "").trim();
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function buildBriefSummary(brief: Quote["technicalBrief"]): string {
  if (!brief || typeof brief !== "object") {
    return "";
  }

  const objectives = normalizeList(brief.objectives);
  const integrations = normalizeList(brief.integrations);
  const urgency = normalizeInput(String(brief.urgency ?? ""));
  const currentStack = normalizeInput(String(brief.currentStack ?? ""));
  const designAssets = normalizeInput(String(brief.designAssets ?? ""));
  const additionalNotes = normalizeInput(String(brief.additionalNotes ?? ""));

  return [
    "Resumen del brief técnico:",
    objectives.length > 0
      ? `- Objetivos: ${objectives.join(", ")}`
      : "- Objetivos: No definidos",
    urgency ? `- Urgencia: ${urgency}` : "- Urgencia: No definida",
    currentStack
      ? `- Stack actual: ${currentStack}`
      : "- Stack actual: No especificado",
    designAssets
      ? `- Activos de diseño: ${designAssets}`
      : "- Activos de diseño: No especificados",
    integrations.length > 0
      ? `- Integraciones requeridas: ${integrations.join(", ")}`
      : "- Integraciones requeridas: No definidas",
    additionalNotes
      ? `- Notas adicionales: ${additionalNotes}`
      : "- Notas adicionales: Sin observaciones",
  ].join("\n");
}

export async function createQuoteAction(input: CreateQuoteInput) {
  const payload = {
    leadId: normalizeInput(input.leadId) || undefined,
    nombre: normalizeInput(input.nombre),
    empresa: normalizeInput(input.empresa),
    email: normalizeInput(input.email) || undefined,
    servicio: normalizeInput(input.servicio),
    monto: normalizeInput(input.monto),
    industria: normalizeInput(input.industria) || undefined,
    detalles: normalizeInput(input.detalles) || undefined,
    sector: normalizeInput(input.sector) || undefined,
    complejidad: normalizeInput(input.complejidad) || undefined,
    servicios: Array.isArray(input.servicios) ? input.servicios : undefined,
    rangoInversion: input.rangoInversion,
    estado: normalizeInput(input.estado) || "Pendiente",
  };

  if (!payload.nombre || !payload.empresa || !payload.servicio || !payload.monto) {
    return {
      ok: false,
      message:
        "Debes completar nombre, empresa, servicio y monto para crear la cotización.",
    };
  }

  const webhookUrl = process.env.N8N_CREATE_QUOTE_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      message:
        "Configura N8N_CREATE_QUOTE_URL para crear cotizaciones reales desde el admin.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondio con estado ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Cotización creada y sincronizada correctamente.",
      briefUrl: result.briefUrl,
      leadId: result.leadId,
      briefToken: result.token,
      clientDashboardUrl: result.clientDashboardUrl || result.dashboardUrl,
    };
  } catch (error) {
    console.error("createQuoteAction", error);

    return {
      ok: false,
      message: "No fue posible crear la cotización. Revisa la conexión con n8n.",
    };
  }
}

export async function generateQuoteAction(input: GenerateQuoteInput) {
  const leadId = normalizeInput(input.leadId);
  const clientToken = normalizeInput(input.briefToken);
  const feedback = normalizeInput(input.feedback);

  if (!leadId || !clientToken) {
    return {
      ok: false,
      message:
        "El lead debe tener un Brief_Token antes de generar la cotización.",
    };
  }

  const transcripcion = buildBriefSummary(input.technicalBrief);
  if (!transcripcion) {
    return {
      ok: false,
      message:
        "El brief técnico aún no está completo o no se pudo interpretar.",
    };
  }

  const webhookUrl = process.env.N8N_GENERATE_QUOTE_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      message:
        "Configura N8N_GENERATE_QUOTE_URL para generar cotizaciones reales.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        clientToken,
        transcripcion,
        datos_cliente: [
          normalizeInput(input.nombre),
          normalizeInput(input.empresa),
          normalizeInput(input.email),
        ]
          .filter(Boolean)
          .join(" | "),
        datos_proveedor: "JS Solutions",
        feedback: feedback || undefined,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondio con estado ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));
    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Cotización generada y enviada correctamente.",
      quotePdfUrl: result.quotePdfUrl || result.pdfUrl,
      quoteDocumentId: result.quoteDocumentId,
      dashboardUrl: result.dashboardUrl,
    };
  } catch (error) {
    console.error("generateQuoteAction", error);

    return {
      ok: false,
      message:
        "No fue posible generar la cotización. Revisa la conexión con n8n.",
    };
  }
}

export async function generateContractAction(input: GenerateContractInput) {
  if (!input.leadId && !input.email) {
    return {
      ok: false,
      message: "Debes enviar leadId o email para generar contrato.",
    };
  }

  if (normalizeInput(input.estado) !== "Firmado") {
    return {
      ok: false,
      message:
        "Solo puedes generar contrato cuando la cotización ya esté firmada.",
    };
  }

  const webhookUrl = process.env.N8N_GENERATE_CONTRACT_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      message:
        "Configura N8N_GENERATE_CONTRACT_URL para generar contratos reales.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondio con estado ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Contrato generado y enviado correctamente.",
      contractUrl: result.contractUrl,
    };
  } catch (error) {
    console.error("generateContractAction", error);
    return {
      ok: false,
      message:
        "No fue posible generar el contrato. Revisa la conexion con n8n.",
    };
  }
}

export async function requestTechnicalBriefAction(
  input: GenerateContractInput,
) {
  if (!input.leadId && !input.email) {
    return {
      ok: false,
      message: "Debes enviar leadId o email para solicitar el brief.",
    };
  }

  const webhookUrl = process.env.N8N_REQUEST_BRIEF_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      message:
        "Configura N8N_REQUEST_BRIEF_WEBHOOK_URL para enviar briefs reales.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondio con estado ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Brief técnico solicitado y enviado al prospecto correctamente.",
      briefUrl: result.briefUrl,
      token: result.token,
      clientDashboardUrl: result.clientDashboardUrl || result.dashboardUrl,
    };
  } catch (error) {
    console.error("requestTechnicalBriefAction", error);
    return {
      ok: false,
      message: "No fue posible solicitar el brief. Revisa la conexion con n8n.",
    };
  }
}
