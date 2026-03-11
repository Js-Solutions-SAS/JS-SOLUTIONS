"use server";

import { revalidatePath } from "next/cache";

import {
  buildApiUrl,
  generateCorrelationId,
  generateIdempotencyKey,
  postJsonWithTimeout,
  resolveApiInternalToken,
} from "@/lib/network";
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

interface RequestTechnicalBriefInput {
  leadId?: string;
  email?: string;
  forceResend?: boolean;
  requestId?: string;
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
  mode?: "preview" | "send";
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

  const apiUrl = buildApiUrl("/api/v1/leads/intake");

  if (!apiUrl) {
    return {
      ok: false,
      message:
        "Configura API_BASE_URL para crear cotizaciones reales desde el admin.",
    };
  }

  let correlationId = "";

  try {
    correlationId = generateCorrelationId("create-quote");
    const idempotencyKey = generateIdempotencyKey(
      "create-quote",
      payload.leadId || `${payload.email || payload.nombre}:${payload.empresa}`,
    );
    const response = await postJsonWithTimeout(apiUrl, {
      body: payload,
      correlationId,
      idempotencyKey,
      secretToken: resolveApiInternalToken(),
    });
    const result = response.data;
    if (!response.ok) {
      throw new Error(
        response.errorMessage || `API respondio con estado ${response.status}`,
      );
    }

    const upstreamSuccess =
      typeof result.success === "boolean" ? result.success : undefined;
    const hasExpectedData =
      typeof result.leadId === "string" ||
      typeof result.token === "string" ||
      typeof result.briefUrl === "string" ||
      typeof result.clientDashboardUrl === "string" ||
      typeof result.dashboardUrl === "string";

    if (upstreamSuccess === false) {
      throw new Error(
        typeof result.message === "string"
          ? normalizeInput(result.message)
          : "La API rechazó la creación de la cotización.",
      );
    }

    if (!hasExpectedData) {
      throw new Error(
        "La API respondió sin datos esperados del lead (leadId/token/briefUrl).",
      );
    }

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Cotización creada y sincronizada correctamente.",
      briefUrl:
        typeof result.briefUrl === "string" ? normalizeInput(result.briefUrl) : undefined,
      leadId: typeof result.leadId === "string" ? normalizeInput(result.leadId) : undefined,
      briefToken: typeof result.token === "string" ? normalizeInput(result.token) : undefined,
      clientDashboardUrl:
        typeof result.clientDashboardUrl === "string"
          ? normalizeInput(result.clientDashboardUrl)
          : typeof result.dashboardUrl === "string"
            ? normalizeInput(result.dashboardUrl)
            : undefined,
      correlationId: response.correlationId,
    };
  } catch (error) {
    console.error("createQuoteAction", error);

    return {
      ok: false,
      message: `No fue posible crear la cotización. Revisa la conexión con la API.${correlationId ? ` CorrelationId: ${correlationId}` : ""}`,
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

  const apiUrl = buildApiUrl("/api/v1/quotes/generate");
  if (!apiUrl) {
    return {
      ok: false,
      message:
        "Configura API_BASE_URL para generar cotizaciones reales.",
    };
  }

  let correlationId = "";

  try {
    const mode = input.mode || "send";
    correlationId = generateCorrelationId("generate-quote");
    const idempotencyKey = generateIdempotencyKey(
      `generate-quote:${mode}`,
      `${leadId}:${clientToken}:${feedback || "na"}`,
    );
    const response = await postJsonWithTimeout(apiUrl, {
      body: {
        leadId,
        clientToken,
        transcripcion,
        feedback: feedback || undefined,
        mode,
      },
      correlationId,
      idempotencyKey,
      secretToken: resolveApiInternalToken(),
    });
    const result = response.data;
    if (!response.ok) {
      throw new Error(
        response.errorMessage || `API respondio con estado ${response.status}`,
      );
    }
    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message:
        mode === "preview"
          ? "Previsualización de cotización generada correctamente."
          : "Cotización generada y enviada correctamente.",
      quotePdfUrl:
        typeof result.quotePdfUrl === "string"
          ? normalizeInput(result.quotePdfUrl)
          : typeof result.pdfUrl === "string"
            ? normalizeInput(result.pdfUrl)
            : undefined,
      quoteDocumentId:
        typeof result.quoteDocumentId === "string"
          ? normalizeInput(result.quoteDocumentId)
          : undefined,
      dashboardUrl:
        typeof result.dashboardUrl === "string"
          ? normalizeInput(result.dashboardUrl)
          : undefined,
      mode,
      correlationId: response.correlationId,
    };
  } catch (error) {
    console.error("generateQuoteAction", error);

    return {
      ok: false,
      message:
        `No fue posible generar la cotización. Revisa la conexión con la API.${correlationId ? ` CorrelationId: ${correlationId}` : ""}`,
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

  const apiUrl = buildApiUrl("/api/v1/contracts/generate");

  if (!apiUrl) {
    return {
      ok: false,
      message:
        "Configura API_BASE_URL para generar contratos reales.",
    };
  }

  let correlationId = "";

  try {
    correlationId = generateCorrelationId("generate-contract");
    const idempotencyKey = generateIdempotencyKey(
      "generate-contract",
      `${input.leadId || "na"}:${input.email || "na"}`,
    );
    const response = await postJsonWithTimeout(apiUrl, {
      body: input as unknown as Record<string, unknown>,
      correlationId,
      idempotencyKey,
      secretToken: resolveApiInternalToken(),
    });
    const result = response.data;
    if (!response.ok) {
      throw new Error(
        response.errorMessage || `API respondio con estado ${response.status}`,
      );
    }

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Contrato generado y enviado correctamente.",
      contractUrl:
        typeof result.contractUrl === "string"
          ? normalizeInput(result.contractUrl)
          : undefined,
      correlationId: response.correlationId,
    };
  } catch (error) {
    console.error("generateContractAction", error);
    return {
      ok: false,
      message:
        `No fue posible generar el contrato. Revisa la conexion con la API.${correlationId ? ` CorrelationId: ${correlationId}` : ""}`,
    };
  }
}

export async function requestTechnicalBriefAction(
  input: RequestTechnicalBriefInput,
) {
  if (!input.leadId && !input.email) {
    return {
      ok: false,
      message: "Debes enviar leadId o email para solicitar el brief.",
    };
  }

  const apiUrl = buildApiUrl("/api/v1/brief/request");

  if (!apiUrl) {
    return {
      ok: false,
      message:
        "Configura API_BASE_URL para enviar briefs reales.",
    };
  }

  let correlationId = "";

  try {
    correlationId = generateCorrelationId("request-brief");
    const requestId =
      normalizeInput(input.requestId) ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `req-brief-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const idempotencyKey = generateIdempotencyKey(
      "request-brief",
      requestId,
    );
    const response = await postJsonWithTimeout(apiUrl, {
      body: {
        leadId: normalizeInput(input.leadId) || undefined,
        email: normalizeInput(input.email) || undefined,
        forceResend: Boolean(input.forceResend),
        requestId,
      },
      correlationId,
      idempotencyKey,
      secretToken: resolveApiInternalToken(),
    });
    const result = response.data;
    if (!response.ok) {
      throw new Error(
        response.errorMessage || `API respondio con estado ${response.status}`,
      );
    }

    revalidatePath("/cotizaciones");

    const deliveryStatus =
      typeof result.deliveryStatus === "string"
        ? normalizeInput(result.deliveryStatus)
        : "sent";
    const resultMessage =
      typeof result.message === "string" && normalizeInput(result.message)
        ? normalizeInput(result.message)
        : deliveryStatus === "skipped_idempotent"
          ? "Solicitud de brief ya procesada previamente."
          : "Brief técnico solicitado y enviado al prospecto correctamente.";

    return {
      ok: true,
      message: resultMessage,
      briefUrl:
        typeof result.briefUrl === "string" ? normalizeInput(result.briefUrl) : undefined,
      token: typeof result.token === "string" ? normalizeInput(result.token) : undefined,
      clientDashboardUrl:
        typeof result.clientDashboardUrl === "string"
          ? normalizeInput(result.clientDashboardUrl)
          : typeof result.dashboardUrl === "string"
            ? normalizeInput(result.dashboardUrl)
            : undefined,
      deliveryStatus,
      correlationId: response.correlationId,
    };
  } catch (error) {
    console.error("requestTechnicalBriefAction", error);
    return {
      ok: false,
      message: `No fue posible solicitar el brief. Revisa la conexion con la API.${correlationId ? ` CorrelationId: ${correlationId}` : ""}`,
    };
  }
}

export async function previewQuoteAction(input: GenerateQuoteInput) {
  return generateQuoteAction({ ...input, mode: "preview" });
}
