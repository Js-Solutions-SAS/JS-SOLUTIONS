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
          ? `Tiempo de espera agotado tras ${timeoutMs}ms al conectar con n8n.`
          : error instanceof Error
            ? error.message
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
