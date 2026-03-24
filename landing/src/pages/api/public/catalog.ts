import type { APIRoute } from "astro";

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  (import.meta.env.PROD ? "https://api.jssolutions.com.co" : "http://localhost:3003");

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const upstream = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/public/catalog`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Landing-Proxy": "true",
      },
    });

    const raw = await upstream.text();

    return new Response(raw, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        items: [],
        source: "fallback",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      },
    );
  }
};
