"use server";

import { revalidatePath } from "next/cache";

interface ReviewChangeRequestInput {
  changeRequestId: string;
  projectId: string;
  decision: "approve" | "reject";
}

export async function reviewChangeRequestAction(input: ReviewChangeRequestInput) {
  if (!input.changeRequestId || !input.projectId || !input.decision) {
    return {
      ok: false,
      message: "Faltan datos requeridos para procesar la solicitud de cambio.",
    };
  }

  const webhookUrl = process.env.N8N_CHANGE_REQUESTS_ACTION_WEBHOOK_URL;

  if (!webhookUrl) {
    revalidatePath("/cambios");
    return {
      ok: true,
      message: "Decisión simulada (sin webhook configurado).",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: input.decision,
        changeRequestId: input.changeRequestId,
        projectId: input.projectId,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondió con estado ${response.status}`);
    }

    revalidatePath("/cambios");

    return {
      ok: true,
      message:
        input.decision === "approve"
          ? "Solicitud de cambio aprobada y sincronizada con n8n."
          : "Solicitud de cambio rechazada y sincronizada con n8n.",
    };
  } catch (error) {
    console.error("reviewChangeRequestAction", error);
    return {
      ok: false,
      message:
        "No se pudo registrar la decisión. Revisa la conectividad con n8n.",
    };
  }
}
