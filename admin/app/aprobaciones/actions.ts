"use server";

import { revalidatePath } from "next/cache";

interface ApproveCheckpointInput {
  approvalId: string;
  projectId: string;
  stage: string;
}

export async function approveCheckpointAction(input: ApproveCheckpointInput) {
  if (!input.approvalId || !input.projectId || !input.stage) {
    return {
      ok: false,
      message: "Faltan datos requeridos para aprobar este punto de control.",
    };
  }

  const webhookUrl = process.env.N8N_APPROVALS_ACTION_WEBHOOK_URL;

  if (!webhookUrl) {
    revalidatePath("/aprobaciones");
    return {
      ok: true,
      message: "Aprobación simulada (sin webhook configurado).",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        approvalId: input.approvalId,
        projectId: input.projectId,
        stage: input.stage,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondió con estado ${response.status}`);
    }

    revalidatePath("/aprobaciones");

    return {
      ok: true,
      message: "Punto de control aprobado y sincronizado con n8n.",
    };
  } catch (error) {
    console.error("approveCheckpointAction", error);
    return {
      ok: false,
      message: "No se pudo registrar esta aprobación. Revisa la conectividad con n8n.",
    };
  }
}
