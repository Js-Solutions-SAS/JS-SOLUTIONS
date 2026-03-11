"use server";

import { revalidatePath } from "next/cache";
import {
  buildApiUrl,
  generateCorrelationId,
  generateIdempotencyKey,
  postJsonWithTimeout,
} from "@/lib/network";

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

interface ApproveContractInput {
  clientToken: string;
  resourceId: string;
  resourceName: string;
}

interface CreatePaymentIntentInput {
  clientToken: string;
  amount?: number;
  currency?: "COP";
  method?: "bancolombia_button";
}

interface CreatePaymentIntentResult {
  ok: boolean;
  message: string;
  checkoutUrl?: string;
  paymentIntentId?: string;
}

interface ApproveResourceInput {
  clientToken: string;
  resourceType: "deliverable" | "quote" | "contract";
  resourceId: string;
  resourceName: string;
}

async function sendApprovalRequest(input: ApproveResourceInput) {
  const apiUrl = buildApiUrl("/api/v1/client/approvals");
  if (!apiUrl) {
    return {
      ok: false,
      message: "API_BASE_URL no está configurada.",
    };
  }

  try {
    const correlationId = generateCorrelationId("portal-approval");
    const idempotencyKey = generateIdempotencyKey(
      `approval:${input.resourceType}`,
      `${input.clientToken}:${input.resourceId}`,
    );
    const response = await postJsonWithTimeout(apiUrl, {
      body: {
        clientToken: input.clientToken,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        resourceName: input.resourceName,
        decision: "approved",
      },
      correlationId,
      idempotencyKey,
    });

    if (!response.ok) {
      return {
        ok: false,
        message:
          response.errorMessage ||
          "No pudimos registrar la aprobación en este momento.",
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
    resourceId: input.documentId,
    resourceName: input.documentName,
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
  });

  return {
    ok: result.ok,
    message: result.ok
      ? `${input.resourceName} fue aceptada correctamente.`
      : result.message,
  };
}

export async function approveContractAction(
  input: ApproveContractInput,
): Promise<ApproveDeliverableResult> {
  if (!input.clientToken || !input.resourceId) {
    return {
      ok: false,
      message: "No se pudo validar la firma del contrato.",
    };
  }

  const result = await sendApprovalRequest({
    clientToken: input.clientToken,
    resourceType: "contract",
    resourceId: input.resourceId,
    resourceName: input.resourceName,
  });

  return {
    ok: result.ok,
    message: result.ok
      ? `${input.resourceName} fue firmado correctamente.`
      : result.message,
  };
}

export async function createPaymentIntentAction(
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> {
  if (!input.clientToken) {
    return {
      ok: false,
      message: "No se recibió un token de cliente válido para iniciar el pago.",
    };
  }

  const apiUrl = buildApiUrl("/api/v1/client/payments/intents");
  if (!apiUrl) {
    return {
      ok: false,
      message: "API_BASE_URL no está configurada.",
    };
  }

  const correlationId = generateCorrelationId("payment-create");
  const idempotencyKey = generateIdempotencyKey(
    "payment-create",
    `${input.clientToken}:${input.amount || 0}:${input.method || "bancolombia_button"}`,
  );

  const response = await postJsonWithTimeout(apiUrl, {
    body: {
      clientToken: input.clientToken,
      amount: input.amount,
      currency: input.currency || "COP",
      method: input.method || "bancolombia_button",
    },
    correlationId,
    idempotencyKey,
  });

  if (!response.ok) {
    return {
      ok: false,
      message:
        response.errorMessage ||
        "No se pudo iniciar el pago automático con Botón Bancolombia.",
    };
  }

  const checkoutUrl = String(
    response.data.checkoutUrl || response.data.paymentUrl || "",
  ).trim();
  const paymentIntentId = String(response.data.paymentIntentId || "").trim();

  return {
    ok: Boolean(checkoutUrl),
    message: checkoutUrl
      ? "Intento de pago creado correctamente."
      : "El backend respondió sin URL de pago.",
    checkoutUrl: checkoutUrl || undefined,
    paymentIntentId: paymentIntentId || undefined,
  };
}
