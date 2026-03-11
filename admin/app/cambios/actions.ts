"use server";

import { revalidatePath } from "next/cache";
import {
  buildApiUrl,
  generateCorrelationId,
  generateIdempotencyKey,
  resolveApiInternalToken,
} from "@/lib/network";

interface ReviewChangeRequestInput {
  changeRequestId: string;
  projectId: string;
  decision: "approve" | "reject";
  expectedVersion?: number;
}

export async function reviewChangeRequestAction(input: ReviewChangeRequestInput) {
  if (!input.changeRequestId || !input.projectId || !input.decision) {
    return {
      ok: false,
      message: "Faltan datos requeridos para procesar la solicitud de cambio.",
    };
  }

  const apiUrl = buildApiUrl(
    `/api/v1/admin/change-requests/${encodeURIComponent(input.changeRequestId)}/decision`,
  );

  if (!apiUrl) {
    return {
      ok: false,
      message: "Configura API_BASE_URL para procesar cambios reales.",
    };
  }

  try {
    const correlationId = generateCorrelationId("admin-change-decision");
    const idempotencyKey = generateIdempotencyKey(
      "admin-change-decision",
      `${input.changeRequestId}:${input.decision}`,
    );
    const token = resolveApiInternalToken();
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": correlationId,
        "Idempotency-Key": idempotencyKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      body: JSON.stringify({
        decision: input.decision,
        reason:
          input.decision === "approve"
            ? "Approved from admin UI"
            : "Rejected from admin UI",
        expectedVersion: input.expectedVersion,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(raw || `API respondió con estado ${response.status}`);
    }

    revalidatePath("/cambios");

    return {
      ok: true,
      message:
        input.decision === "approve"
          ? "Solicitud de cambio aprobada y sincronizada con la API."
          : "Solicitud de cambio rechazada y sincronizada con la API.",
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
