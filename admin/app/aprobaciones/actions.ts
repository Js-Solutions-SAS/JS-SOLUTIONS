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
      message: "Missing required data to approve this checkpoint.",
    };
  }

  const webhookUrl = process.env.N8N_APPROVALS_ACTION_WEBHOOK_URL;

  if (!webhookUrl) {
    revalidatePath("/aprobaciones");
    return {
      ok: true,
      message: "Approval simulated (no webhook configured).",
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
      throw new Error(`n8n responded with status ${response.status}`);
    }

    revalidatePath("/aprobaciones");

    return {
      ok: true,
      message: "Checkpoint approved and synced with n8n.",
    };
  } catch (error) {
    console.error("approveCheckpointAction", error);
    return {
      ok: false,
      message: "Could not register this approval. Check n8n connectivity.",
    };
  }
}
