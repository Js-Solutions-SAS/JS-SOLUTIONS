"use server";

import { revalidatePath } from "next/cache";

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
}

function normalizeInput(value: string | undefined): string {
  return String(value || "").trim();
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
    };
  } catch (error) {
    console.error("createQuoteAction", error);

    return {
      ok: false,
      message: "No fue posible crear la cotización. Revisa la conexión con n8n.",
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

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Contrato generado y enviado correctamente.",
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

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Brief técnico solicitado y enviado al prospecto correctamente.",
    };
  } catch (error) {
    console.error("requestTechnicalBriefAction", error);
    return {
      ok: false,
      message: "No fue posible solicitar el brief. Revisa la conexion con n8n.",
    };
  }
}
