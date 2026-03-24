import { NextResponse } from "next/server";

type AllowedMetric = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

interface PerformanceAlertPayload {
  app: "admin";
  route: string;
  metric: AllowedMetric;
  value: number;
  limit: number;
  rating: string;
  id: string;
  timestamp: string;
}

function isValidPayload(value: unknown): value is PerformanceAlertPayload {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  const metric = record.metric;

  return (
    record.app === "admin" &&
    typeof record.route === "string" &&
    typeof record.value === "number" &&
    typeof record.limit === "number" &&
    typeof record.id === "string" &&
    typeof record.timestamp === "string" &&
    typeof record.rating === "string" &&
    (metric === "LCP" || metric === "INP" || metric === "CLS" || metric === "FCP" || metric === "TTFB")
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    if (!isValidPayload(payload)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid performance alert payload.",
        },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.PERFORMANCE_ALERT_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    console.warn("[PERFORMANCE_ALERT_ADMIN]", {
      route: payload.route,
      metric: payload.metric,
      value: payload.value,
      limit: payload.limit,
      rating: payload.rating,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[PERFORMANCE_ALERT_ADMIN_ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "No fue posible procesar la alerta de performance.",
      },
      { status: 500 },
    );
  }
}
