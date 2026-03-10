const DEFAULT_TIMEOUT_MS = Number(process.env.N8N_REQUEST_TIMEOUT_MS || 15000);

function safeJsonParse(value: string): unknown {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

export function generateCorrelationId(prefix = "prt"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function generateIdempotencyKey(scope: string, ref: string): string {
  const normalizedScope = String(scope || "default").replace(/\s+/g, "-").toLowerCase();
  const normalizedRef = String(ref || "unknown").replace(/\s+/g, "-").toLowerCase();
  return `${normalizedScope}:${normalizedRef}`;
}

export interface JsonRequestOptions {
  body: Record<string, unknown>;
  correlationId: string;
  idempotencyKey?: string;
  secretToken?: string;
  timeoutMs?: number;
}

export interface JsonRequestResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
  errorMessage?: string;
  correlationId: string;
}

export async function postJsonWithTimeout(
  url: string,
  options: JsonRequestOptions,
): Promise<JsonRequestResult> {
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Number(options.timeoutMs)
    : DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": options.correlationId,
        ...(options.idempotencyKey
          ? { "Idempotency-Key": options.idempotencyKey }
          : {}),
        ...(options.secretToken
          ? { Authorization: `Bearer ${options.secretToken}` }
          : {}),
      },
      body: JSON.stringify({
        ...options.body,
        correlationId: options.correlationId,
        idempotencyKey: options.idempotencyKey,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await response.text();
    const data = safeJsonParse(raw);
    const normalizedData =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};

    if (!response.ok) {
      const errorMessage =
        typeof normalizedData.error === "string"
          ? normalizedData.error
          : typeof normalizedData.message === "string"
            ? normalizedData.message
            : `n8n respondió con estado ${response.status}`;

      return {
        ok: false,
        status: response.status,
        data: normalizedData,
        errorMessage,
        correlationId: options.correlationId,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: normalizedData,
      correlationId: options.correlationId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? `Tiempo de espera agotado tras ${timeoutMs}ms al conectar con n8n.`
        : error instanceof Error
          ? error.message
          : "Error de red inesperado.";

    return {
      ok: false,
      status: 0,
      data: {},
      errorMessage,
      correlationId: options.correlationId,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
