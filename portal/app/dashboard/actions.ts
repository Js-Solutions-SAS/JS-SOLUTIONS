"use server";

import { revalidatePath } from "next/cache";

interface ApproveDeliverableInput {
  clientToken: string;
  documentId: string;
  documentName: string;
}

interface ApproveDeliverableResult {
  ok: boolean;
  message: string;
}

interface ApproveQuoteInput {
  clientToken: string;
  resourceId: string;
  resourceName: string;
}

async function sendApprovalRequest(payload: Record<string, unknown>) {
  const webhookUrl = process.env.N8N_APPROVAL_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      message: "N8N_APPROVAL_WEBHOOK_URL no está configurada.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "No pudimos registrar la aprobación en este momento.",
      };
    }

    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Aprobación registrada correctamente.",
    };
  } catch {
    return {
      ok: false,
      message: "Ocurrió un error de red al confirmar la aprobación.",
    };
  }
}

export async function approveDeliverableAction(
  input: ApproveDeliverableInput,
): Promise<ApproveDeliverableResult> {
  if (!input.clientToken || !input.documentId) {
    return {
      ok: false,
      message: "No se pudo validar la aprobación del entregable.",
    };
  }
  const result = await sendApprovalRequest({
    clientToken: input.clientToken,
    resourceType: "deliverable",
    documentId: input.documentId,
    documentName: input.documentName,
    approvedAt: new Date().toISOString(),
  });

  return {
    ok: result.ok,
    message: result.ok
      ? `${input.documentName} fue aprobado correctamente.`
      : result.message,
  };
}

export async function approveQuoteAction(
  input: ApproveQuoteInput,
): Promise<ApproveDeliverableResult> {
  if (!input.clientToken || !input.resourceId) {
    return {
      ok: false,
      message: "No se pudo validar la aprobación de la cotización.",
    };
  }

  const result = await sendApprovalRequest({
    clientToken: input.clientToken,
    resourceType: "quote",
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    approvedAt: new Date().toISOString(),
  });

  return {
    ok: result.ok,
    message: result.ok
      ? `${input.resourceName} fue aceptada correctamente.`
      : result.message,
  };
}
