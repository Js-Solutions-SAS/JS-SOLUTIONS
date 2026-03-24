import type { APIRoute } from "astro";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sanitizePayload } from "@/lib/security/sanitize";

type AllowedMetric = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

interface PerformanceAlertPayload {
  app: "landing";
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
    record.app === "landing" &&
    typeof record.route === "string" &&
    typeof record.value === "number" &&
    typeof record.limit === "number" &&
    typeof record.id === "string" &&
    typeof record.timestamp === "string" &&
    typeof record.rating === "string" &&
    (metric === "LCP" || metric === "INP" || metric === "CLS" || metric === "FCP" || metric === "TTFB")
  );
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`landing:perf:${ip}`, { limit: 40, windowMs: 60_000 });
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Rate limit excedido para alertas de performance.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "Retry-After": String(rate.retryAfterSeconds),
          },
        },
      );
    }

    const payload = sanitizePayload(await request.json()) as unknown;

    if (!isValidPayload(payload)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid performance alert payload.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const webhookUrl = import.meta.env.PERFORMANCE_ALERT_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    console.warn("[PERFORMANCE_ALERT_LANDING]", {
      route: payload.route,
      metric: payload.metric,
      value: payload.value,
      limit: payload.limit,
      rating: payload.rating,
    });

    return new Response(
      JSON.stringify({
        ok: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[PERFORMANCE_ALERT_LANDING_ERROR]", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: "No fue posible procesar la alerta de performance.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
