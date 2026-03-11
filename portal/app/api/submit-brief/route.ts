import { NextResponse } from "next/server";
import {
  buildApiUrl,
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

    const apiUrl = buildApiUrl(
      `/api/v1/public/briefs/${encodeURIComponent(String(data.token))}/submissions`,
    );

    if (!apiUrl) {
      return NextResponse.json(
        {
          error: "API_BASE_URL no está configurada.",
        },
        { status: 500 },
      );
    }

    const correlationId =
      typeof data.correlationId === "string" && data.correlationId
        ? data.correlationId
        : generateCorrelationId("submit-brief");
    const idempotencyKey =
      typeof data.idempotencyKey === "string" && data.idempotencyKey
        ? data.idempotencyKey
        : generateIdempotencyKey("submit-brief", String(data.token || "na"));
    const upstream = await postJsonWithTimeout(apiUrl, {
      body: {
        answers:
          (data.technicalBrief as Record<string, unknown> | undefined) ||
          (data.answers as Record<string, unknown> | undefined) ||
          data,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        submittedBy:
          typeof data.submittedBy === "string" ? data.submittedBy : "portal",
      },
      correlationId,
      idempotencyKey,
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
              : `API respondio con estado ${upstream.status}`;

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
