import type { APIRoute } from "astro";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import {
  isHoneypotTriggered,
  sanitizeEmail,
  sanitizePayload,
} from "@/lib/security/sanitize";

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  (import.meta.env.PROD ? "https://api.jssolutions.com.co" : "http://localhost:3003");

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`landing:quote:${ip}`, { limit: 6, windowMs: 60_000 });
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit excedido para cotizaciones.",
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

    const rawPayload = sanitizePayload<Record<string, unknown>>(await request.json());
    if (isHoneypotTriggered(rawPayload)) {
      return new Response(
        JSON.stringify({
          ok: true,
          accepted: true,
        }),
        {
          status: 202,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const normalizedEmail = sanitizeEmail(rawPayload.email);
    if (!normalizedEmail || typeof rawPayload.serviceInterest !== "string") {
      return new Response(
        JSON.stringify({
          error: "Payload de cotización inválido.",
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

    const safePayload = {
      ...rawPayload,
      email: normalizedEmail,
    };

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/public/quotes/estimate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Landing-Proxy": "true",
        "X-Correlation-Id": request.headers.get("X-Correlation-Id") || "",
        "Idempotency-Key": request.headers.get("Idempotency-Key") || "",
      },
      body: JSON.stringify(safePayload),
    });

    const raw = await response.text();

    return new Response(raw, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible procesar la cotización.",
        detail: error instanceof Error ? error.message : "unknown",
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
