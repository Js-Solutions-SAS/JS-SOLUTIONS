import { NextResponse } from "next/server";
import {
  generateCorrelationId,
  generateIdempotencyKey,
  postJsonWithTimeout,
} from "@/lib/network";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // El frontend enviara al menos: { token, technicalBrief: {...} }
    if (!data.token) {
      return NextResponse.json(
        { error: "Token no proporcionado." },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.N8N_SUBMIT_BRIEF_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("N8N_SUBMIT_BRIEF_WEBHOOK_URL is not configured.");
      // Modo de prueba si no hay webhook
      return NextResponse.json({
        success: true,
        message: "Brief recibido (modo simulado, webhook no configurado).",
        receivedData: data,
      });
    }

    console.log("Enviando brief a n8n:", webhookUrl);

    const correlationId =
      typeof data.correlationId === "string" && data.correlationId
        ? data.correlationId
        : generateCorrelationId("submit-brief");
    const idempotencyKey =
      typeof data.idempotencyKey === "string" && data.idempotencyKey
        ? data.idempotencyKey
        : generateIdempotencyKey("submit-brief", String(data.token || "na"));
    const upstream = await postJsonWithTimeout(webhookUrl, {
      body: data,
      correlationId,
      idempotencyKey,
      secretToken: process.env.N8N_SECRET_TOKEN,
    });
    const result = upstream.data;

    if (!upstream.ok) {
      const details =
        typeof result?.error === "string"
          ? result.error
          : typeof result?.message === "string"
            ? result.message
            : typeof result?.raw === "string"
              ? result.raw.slice(0, 280)
              : `n8n respondio con estado ${upstream.status}`;

      throw new Error(details);
    }

    return NextResponse.json({
      success: true,
      message: "El brief técnico ha sido enviado con éxito.",
      result,
      correlationId: upstream.correlationId,
    });
  } catch (error) {
    console.error("Error submitting technical brief to n8n:", error);
    return NextResponse.json(
      {
        error: "Hubo un error procesando tu solicitud.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
