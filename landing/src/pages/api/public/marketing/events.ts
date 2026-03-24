import type { APIRoute } from "astro";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sanitizePayload } from "@/lib/security/sanitize";

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  (import.meta.env.PROD ? "https://api.jssolutions.com.co" : "http://localhost:3003");

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`landing:marketing:${ip}`, { limit: 60, windowMs: 60_000 });
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit excedido para eventos de marketing.",
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

    const safePayload = sanitizePayload<Record<string, unknown>>(await request.json());

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/public/marketing/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Landing-Proxy": "true",
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
        error: "No fue posible registrar evento de marketing.",
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
