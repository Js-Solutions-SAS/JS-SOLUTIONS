"use server";

import { revalidatePath } from "next/cache";
import {
  buildApiUrl,
  generateCorrelationId,
  generateIdempotencyKey,
  resolveApiInternalToken,
} from "@/lib/network";

interface ApproveCheckpointInput {
  approvalId: string;
  projectId: string;
  stage: string;
  expectedVersion?: number;
}

export async function approveCheckpointAction(input: ApproveCheckpointInput) {
  if (!input.approvalId || !input.projectId || !input.stage) {
    return {
      ok: false,
      message: "Faltan datos requeridos para aprobar este punto de control.",
    };
  }

  const apiUrl = buildApiUrl(
    `/api/v1/admin/approvals/${encodeURIComponent(input.approvalId)}/decision`,
  );

  if (!apiUrl) {
    return {
      ok: false,
      message: "Configura API_BASE_URL para ejecutar aprobaciones reales.",
    };
  }

  try {
    const correlationId = generateCorrelationId("admin-approval-decision");
    const idempotencyKey = generateIdempotencyKey(
      "admin-approval-decision",
      `${input.approvalId}:approved`,
    );

    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": correlationId,
        "Idempotency-Key": idempotencyKey,
        ...(resolveApiInternalToken()
          ? { Authorization: `Bearer ${resolveApiInternalToken()}` }
          : {}),
      },
      cache: "no-store",
      body: JSON.stringify({
        decision: "approved",
        reason: `Approved from admin stage ${input.stage}`,
        expectedVersion: input.expectedVersion,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(raw || `API respondió con estado ${response.status}`);
    }

    revalidatePath("/aprobaciones");

    return {
      ok: true,
      message: "Punto de control aprobado y sincronizado con la API.",
    };
  } catch (error) {
    console.error("approveCheckpointAction", error);
    return {
      ok: false,
      message: "No se pudo registrar esta aprobación. Revisa la conectividad con n8n.",
    };
  }
}
