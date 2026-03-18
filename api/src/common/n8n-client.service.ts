import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface N8nRequestInput {
  url: string;
  body: Record<string, unknown>;
  correlationId: string;
  idempotencyKey?: string;
  timeoutMs?: number;
}

interface N8nRequestResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
  errorMessage?: string;
}

function getHostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function describeFetchCause(error: Error): string {
  const cause = (
    error as Error & {
      cause?: unknown;
    }
  ).cause;

  if (!cause || typeof cause !== 'object') {
    return '';
  }

  const record = cause as Record<string, unknown>;
  const parts = [
    typeof record.code === 'string' ? `code=${record.code}` : '',
    typeof record.errno === 'string' ? `errno=${record.errno}` : '',
    typeof record.syscall === 'string' ? `syscall=${record.syscall}` : '',
    typeof record.hostname === 'string' ? `host=${record.hostname}` : '',
    typeof record.address === 'string' ? `address=${record.address}` : '',
    typeof record.port === 'number' ? `port=${record.port}` : '',
  ].filter(Boolean);

  return parts.join(', ');
}

function safeJsonParse(value: string): unknown {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

@Injectable()
export class N8nClientService {
  constructor(private readonly configService: ConfigService) {}

  async postJson(input: N8nRequestInput): Promise<N8nRequestResult> {
    const controller = new AbortController();
    const timeoutMs = Number.isFinite(input.timeoutMs)
      ? Number(input.timeoutMs)
      : Number(this.configService.get('N8N_REQUEST_TIMEOUT_MS', '15000'));
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const n8nSecretToken = this.configService.get<string>('N8N_SECRET_TOKEN');
      const response = await fetch(input.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': input.correlationId,
          ...(input.idempotencyKey
            ? { 'Idempotency-Key': input.idempotencyKey }
            : {}),
          ...(n8nSecretToken
            ? { Authorization: `Bearer ${n8nSecretToken}` }
            : {}),
        },
        body: JSON.stringify({
          ...input.body,
          correlationId: input.correlationId,
          idempotencyKey: input.idempotencyKey,
        }),
        signal: controller.signal,
      });

      const raw = await response.text();
      const data = safeJsonParse(raw);
      const normalizedData =
        data && typeof data === 'object'
          ? (data as Record<string, unknown>)
          : {};

      if (!response.ok) {
        const errorMessage =
          typeof normalizedData.error === 'string'
            ? normalizedData.error
            : typeof normalizedData.message === 'string'
              ? normalizedData.message
              : `n8n respondio con estado ${response.status}`;

        return {
          ok: false,
          status: response.status,
          data: normalizedData,
          errorMessage,
        };
      }

      return {
        ok: true,
        status: response.status,
        data: normalizedData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.name === 'AbortError'
          ? `Tiempo de espera agotado tras ${timeoutMs}ms al conectar con n8n (${getHostLabel(input.url)}).`
          : error instanceof Error
            ? `No fue posible conectar con n8n (${getHostLabel(input.url)}): ${error.message}${describeFetchCause(error) ? ` [${describeFetchCause(error)}]` : ''}`
            : 'Error de red inesperado';

      return {
        ok: false,
        status: 0,
        data: {},
        errorMessage,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
