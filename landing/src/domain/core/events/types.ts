export interface DomainEvent<TPayload = Record<string, unknown>> {
  eventName: string;
  version: number;
  payload: TPayload;
  source: string;
  correlationId: string;
  timestamp: string;
  deprecatedSince?: number;
  sunsetAt?: string;
  replacedBy?: string;
  contractId?: string;
}

export type DomainEventHandler<TPayload = Record<string, unknown>> = (
  event: DomainEvent<TPayload>,
) => void;

export function createCorrelationId(prefix = "evt"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDomainEvent<TPayload = Record<string, unknown>>(
  source: string,
  eventName: string,
  payload: TPayload,
  version = 1,
  correlationId = createCorrelationId(source.replace(/\s+/g, "-").toLowerCase()),
  contract?: Pick<
    DomainEvent<TPayload>,
    "deprecatedSince" | "sunsetAt" | "replacedBy" | "contractId"
  >,
): DomainEvent<TPayload> {
  return {
    source,
    eventName,
    version,
    payload,
    correlationId,
    timestamp: new Date().toISOString(),
    deprecatedSince: contract?.deprecatedSince,
    sunsetAt: contract?.sunsetAt,
    replacedBy: contract?.replacedBy,
    contractId: contract?.contractId,
  };
}

export function toVersionedEventName(baseName: string, version: number): string {
  return `${baseName}.v${version}`;
}

export function parseVersionedEventName(
  value: string,
): { baseName: string; version: number | null } {
  const match = value.match(/^(.*)\.v(\d+)$/);
  if (!match) {
    return {
      baseName: value,
      version: null,
    };
  }

  return {
    baseName: match[1] || value,
    version: Number.parseInt(match[2] || "", 10) || null,
  };
}

export function isSupportedVersion(
  version: number,
  supportedVersions: number[],
): boolean {
  return supportedVersions.includes(version);
}

export function isDeprecatedEvent(event: DomainEvent): boolean {
  return typeof event.deprecatedSince === "number";
}
