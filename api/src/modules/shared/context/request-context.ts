import type { Request } from 'express';

import { generateCorrelationId, generateIdempotencyKey } from '../../../common/ids';

function readHeader(
  headers: Request['headers'],
  key: string,
): string | undefined {
  const value = headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getCorrelationId(req: Request, prefix: string): string {
  const header = readHeader(req.headers, 'x-correlation-id')?.trim();
  const bodyValue =
    req.body && typeof req.body.correlationId === 'string'
      ? req.body.correlationId.trim()
      : '';

  return header || bodyValue || generateCorrelationId(prefix);
}

export function getIdempotencyKey(
  req: Request,
  scope: string,
  ref: string,
): string {
  const header = readHeader(req.headers, 'idempotency-key')?.trim();
  const bodyValue =
    req.body && typeof req.body.idempotencyKey === 'string'
      ? req.body.idempotencyKey.trim()
      : '';

  return header || bodyValue || generateIdempotencyKey(scope, ref);
}

export function getIfMatchVersion(req: Request): number | null {
  const value = readHeader(req.headers, 'if-match');
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\"/g, '').trim();
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
