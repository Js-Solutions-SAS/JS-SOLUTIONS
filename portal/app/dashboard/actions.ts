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

export async function approveDeliverableAction(
  input: ApproveDeliverableInput,
): Promise<ApproveDeliverableResult> {
  if (!input.clientToken || !input.documentId) {
    return {
      ok: false,
      message: "No se pudo validar la aprobación del entregable.",
    };
  }

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
      body: JSON.stringify({
        clientToken: input.clientToken,
        documentId: input.documentId,
        documentName: input.documentName,
        approvedAt: new Date().toISOString(),
      }),
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
      message: `${input.documentName} fue aprobado correctamente.`,
    };
  } catch {
    return {
      ok: false,
      message: "Ocurrió un error de red al confirmar el entregable.",
    };
  }
}
