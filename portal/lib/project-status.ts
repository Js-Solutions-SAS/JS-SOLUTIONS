import {
  type DocumentStatus,
  type DocumentType,
  type Milestone,
  type MilestoneStatus,
  type ProjectData,
  type ProjectPayments,
  type ProjectDocument,
  type ProjectContract,
  type ProjectQuote,
  type ProjectSignature,
  type QuoteStatus,
  type Task,
  type TaskStatus,
} from "@/app/dashboard/types";

class ProjectStatusError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ProjectStatusError";
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_PHASES = [
  "Descubrimiento",
  "Desarrollo",
  "QA",
  "Entrega",
] as const;

function toTaskStatus(status: unknown): TaskStatus {
  const normalized = String(status ?? "").toLowerCase().trim();

  if (["finalizado", "completado", "completed", "done"].includes(normalized)) {
    return "Finalizado";
  }

  if (["qa", "quality", "review"].includes(normalized)) {
    return "QA";
  }

  if (["en curso", "in progress", "progreso", "desarrollo"].includes(normalized)) {
    return "En curso";
  }

  return "Pendiente";
}

function toMilestoneStatus(status: unknown): MilestoneStatus {
  const normalized = String(status ?? "").toLowerCase().trim();

  if (["completado", "completed", "done", "success"].includes(normalized)) {
    return "Completado";
  }

  if (["en proceso", "in progress", "active", "ongoing"].includes(normalized)) {
    return "En Proceso";
  }

  return "Pendiente";
}

function toDocumentStatus(status: unknown): DocumentStatus {
  const normalized = String(status ?? "").toLowerCase().trim();

  if (["aprobado", "approved", "accepted", "signed"].includes(normalized)) {
    return "Aprobado";
  }

  if (["en revisión", "review", "qa", "pending review"].includes(normalized)) {
    return "En revisión";
  }

  return "Pendiente";
}

function toQuoteStatus(status: unknown): QuoteStatus {
  return toDocumentStatus(status);
}

function inferPhaseFromOperationalStatus(status: string): string {
  const normalized = status.toLowerCase().trim();

  if (
    [
      "diagnóstico capturado",
      "diagnostico capturado",
      "brief enviado",
      "brief completado",
    ].includes(normalized)
  ) {
    return "Descubrimiento";
  }

  if (normalized === "cotización en revisión" || normalized === "cotizacion en revision") {
    return "Cotización";
  }

  if (normalized === "firmado") {
    return "Aprobado Comercial";
  }

  if (normalized === "contrato enviado") {
    return "Contratación";
  }

  return "Desarrollo";
}

function inferProgressFromOperationalStatus(status: string): number {
  const normalized = status.toLowerCase().trim();

  if (normalized === "diagnóstico capturado" || normalized === "diagnostico capturado") {
    return 10;
  }

  if (normalized === "brief enviado") {
    return 20;
  }

  if (normalized === "brief completado") {
    return 30;
  }

  if (normalized === "cotización en revisión" || normalized === "cotizacion en revision") {
    return 35;
  }

  if (normalized === "firmado") {
    return 50;
  }

  if (normalized === "contrato enviado") {
    return 65;
  }

  return 0;
}

function inferDocumentType(name: string, url: string, providedType?: unknown): DocumentType {
  const normalizedType = String(providedType ?? "").toLowerCase().trim();
  if (["pdf", "doc", "image", "figma", "sheet", "link", "other"].includes(normalizedType)) {
    return normalizedType as DocumentType;
  }

  const source = `${name} ${url}`.toLowerCase();
  if (source.includes("figma")) return "figma";
  if (source.match(/\.(png|jpg|jpeg|webp|svg|gif)($|\?)/)) return "image";
  if (source.match(/\.(doc|docx)($|\?)/)) return "doc";
  if (source.match(/\.(xls|xlsx|csv|sheet)($|\?)/)) return "sheet";
  if (source.match(/\.(pdf)($|\?)/)) return "pdf";
  if (source.startsWith("http")) return "link";

  return "other";
}

function inferDocumentKind(
  name: string,
  providedKind?: unknown,
): ProjectDocument["kind"] {
  const normalizedKind = String(providedKind ?? "").toLowerCase().trim();
  if (["quote", "contract", "deliverable"].includes(normalizedKind)) {
    return normalizedKind as ProjectDocument["kind"];
  }

  const normalizedName = name.toLowerCase();
  if (normalizedName.includes("cotiz")) return "quote";
  if (normalizedName.includes("contrato")) return "contract";

  return "deliverable";
}

function clampProgress(value: unknown): number {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function parseTasks(rawTasks: unknown): Task[] {
  if (!Array.isArray(rawTasks)) {
    return [];
  }

  return rawTasks.reduce<Task[]>((acc, item, index) => {
      if (!item || typeof item !== "object") {
        return acc;
      }

      const record = item as Record<string, unknown>;
      const name = String(record.name ?? record.taskName ?? `Fase ${index + 1}`).trim();
      const id = String(record.id ?? record.taskId ?? `${index + 1}`).trim();
      const phase = String(record.phase ?? record.stage ?? "").trim();

      acc.push({
        id,
        name,
        status: toTaskStatus(record.status),
        phase: phase || undefined,
      });

      return acc;
    }, []);
}

function deriveMilestones(
  currentPhase: string,
  progressPercentage: number,
  rawMilestones: unknown,
): Milestone[] {
  if (Array.isArray(rawMilestones) && rawMilestones.length > 0) {
    return rawMilestones.reduce<Milestone[]>((acc, milestone, index) => {
        if (!milestone || typeof milestone !== "object") {
          return acc;
        }

        const record = milestone as Record<string, unknown>;
        const name = String(record.name ?? record.phase ?? `Fase ${index + 1}`).trim();

        acc.push({
          id: String(record.id ?? `m-${index + 1}`),
          name,
          status: toMilestoneStatus(record.status),
          description: String(record.description ?? "").trim() || undefined,
        });

        return acc;
      }, []);
  }

  const currentIdx = DEFAULT_PHASES.findIndex(
    (phase) => phase.toLowerCase() === currentPhase.toLowerCase(),
  );

  return DEFAULT_PHASES.map((phase, index) => {
    let status: MilestoneStatus = "Pendiente";

    if (progressPercentage >= 100 || (currentIdx >= 0 && index < currentIdx)) {
      status = "Completado";
    } else if ((currentIdx >= 0 && index === currentIdx) || (currentIdx === -1 && index === 1)) {
      status = "En Proceso";
    }

    return {
      id: `m-${index + 1}`,
      name: phase,
      status,
      description:
        phase === "Descubrimiento"
          ? "Alineación funcional y técnica"
          : phase === "Desarrollo"
            ? "Construcción de entregables"
            : phase === "QA"
              ? "Validación y control de calidad"
              : "Liberación y cierre",
    } satisfies Milestone;
  });
}

function parseDocuments(rawDocuments: unknown, driveFolderUrl: string): ProjectDocument[] {
  if (!Array.isArray(rawDocuments) || rawDocuments.length === 0) {
    if (!driveFolderUrl) {
      return [];
    }

    return [
      {
        id: "drive-folder",
        name: "Carpeta central de entregables",
        type: "link",
        status: "En revisión",
        url: driveFolderUrl,
        kind: "deliverable",
      },
    ];
  }

  return rawDocuments.reduce<ProjectDocument[]>((acc, item, index) => {
      if (!item || typeof item !== "object") {
        return acc;
      }

      const record = item as Record<string, unknown>;
      const name = String(record.name ?? record.title ?? `Documento ${index + 1}`).trim();
      const url = String(record.url ?? record.href ?? driveFolderUrl ?? "").trim();

      acc.push({
        id: String(record.id ?? `doc-${index + 1}`),
        name,
        type: inferDocumentType(name, url, record.type),
        status: toDocumentStatus(record.status),
        url,
        updatedAt: String(record.updatedAt ?? record.updated_at ?? "").trim() || undefined,
        sizeLabel: String(record.sizeLabel ?? record.size ?? "").trim() || undefined,
        kind: inferDocumentKind(name, record.kind),
      });

      return acc;
    }, []);
}

function parseQuote(rawQuote: unknown, documents: ProjectDocument[]): ProjectQuote | undefined {
  if (rawQuote && typeof rawQuote === "object") {
    const record = rawQuote as Record<string, unknown>;
    const id = String(record.id ?? record.quoteId ?? "").trim();
    const name = String(record.name ?? "Cotización Comercial").trim();
    const url = String(record.url ?? record.href ?? "").trim();

    if (!id || !url) {
      return undefined;
    }

    return {
      id,
      name,
      url,
      status: toQuoteStatus(record.status),
      sentAt: String(record.sentAt ?? record.generatedAt ?? "").trim() || undefined,
      approvedAt:
        String(record.approvedAt ?? record.quoteApprovedAt ?? "").trim() || undefined,
    };
  }

  const quoteDocument = documents.find((document) => document.kind === "quote");
  if (!quoteDocument) {
    return undefined;
  }

  return {
    id: quoteDocument.id,
    name: quoteDocument.name,
    url: quoteDocument.url,
    status: toQuoteStatus(quoteDocument.status),
  };
}

function parseContract(
  rawContract: unknown,
  documents: ProjectDocument[],
): ProjectContract | undefined {
  if (rawContract && typeof rawContract === "object") {
    const record = rawContract as Record<string, unknown>;
    const id = String(record.id ?? record.contractId ?? "").trim();
    const name = String(record.name ?? "Contrato Comercial").trim();
    const url = String(record.url ?? record.href ?? "").trim();

    if (!id || !url) {
      return undefined;
    }

    return {
      id,
      name,
      url,
      status: toQuoteStatus(record.status),
      sentAt: String(record.sentAt ?? record.generatedAt ?? "").trim() || undefined,
      approvedAt:
        String(record.approvedAt ?? record.contractApprovedAt ?? "").trim() ||
        undefined,
    };
  }

  const contractDocument = documents.find((document) => document.kind === "contract");
  if (!contractDocument) {
    return undefined;
  }

  return {
    id: contractDocument.id,
    name: contractDocument.name,
    url: contractDocument.url,
    status: toQuoteStatus(contractDocument.status),
  };
}

function parseSignature(rawSignature: unknown): ProjectSignature | undefined {
  if (!rawSignature || typeof rawSignature !== "object") {
    return undefined;
  }

  const record = rawSignature as Record<string, unknown>;
  const signature: ProjectSignature = {
    provider: String(record.provider ?? "").trim() || undefined,
    quoteEnvelopeId: String(record.quoteEnvelopeId ?? "").trim() || undefined,
    contractEnvelopeId: String(record.contractEnvelopeId ?? "").trim() || undefined,
    quoteSignUrl: String(record.quoteSignUrl ?? "").trim() || undefined,
    contractSignUrl: String(record.contractSignUrl ?? "").trim() || undefined,
    status: String(record.status ?? "").trim() || undefined,
    updatedAt: String(record.updatedAt ?? "").trim() || undefined,
  };

  if (
    !signature.provider &&
    !signature.quoteEnvelopeId &&
    !signature.contractEnvelopeId &&
    !signature.quoteSignUrl &&
    !signature.contractSignUrl &&
    !signature.status &&
    !signature.updatedAt
  ) {
    return undefined;
  }

  return signature;
}

function parsePayments(rawPayments: unknown): ProjectPayments | undefined {
  if (!rawPayments || typeof rawPayments !== "object") {
    return undefined;
  }

  const record = rawPayments as Record<string, unknown>;
  const methodsRaw = Array.isArray(record.methods) ? record.methods : [];
  const methods = methodsRaw.reduce<Array<{ label: string; value: string }>>(
    (acc, item) => {
      if (!item || typeof item !== "object") {
        return acc;
      }

    const obj = item as Record<string, unknown>;
    const label = String(obj.label ?? "").trim();
    const value = String(obj.value ?? "").trim();

    if (!label || !value) {
      return acc;
    }

      acc.push({ label, value });
      return acc;
    },
    [],
  );

  const status = String(record.status ?? "pending")
    .trim()
    .toLowerCase() as ProjectPayments["status"];

  return {
    status:
      ["pending", "processing", "approved", "rejected", "manual_review"].includes(
        status,
      )
        ? status
        : "pending",
    amount:
      typeof record.amount === "number"
        ? record.amount
        : Number.isFinite(Number(record.amount))
          ? Number(record.amount)
          : undefined,
    currency: "COP",
    checkoutUrl: String(record.checkoutUrl ?? record.paymentUrl ?? "").trim() || undefined,
    paymentIntentId: String(record.paymentIntentId ?? "").trim() || undefined,
    approvedAt: String(record.approvedAt ?? "").trim() || undefined,
    methods: methods && methods.length > 0 ? methods : undefined,
  };
}

function normalizeProjectData(rawData: unknown): ProjectData {
  if (!rawData || typeof rawData !== "object") {
    throw new ProjectStatusError(
      "No se recibieron datos válidos del proyecto.",
      502,
      "invalid_payload",
    );
  }

  const data = rawData as Record<string, unknown>;
  const projectName = String(
    data.projectName ?? data.project ?? data.empresa ?? data.clientName ?? "",
  ).trim();
  if (!projectName) {
    throw new ProjectStatusError(
      "Token no válido o datos del proyecto incompletos.",
      401,
      "invalid_token",
    );
  }

  const operationalStatus = String(
    data.estado ?? data.Estado ?? data.status ?? "",
  ).trim();
  const currentPhase =
    String(data.currentPhase ?? "").trim() ||
    inferPhaseFromOperationalStatus(operationalStatus);
  const progressPercentage = clampProgress(
    data.progressPercentage ??
      data.progress ??
      inferProgressFromOperationalStatus(operationalStatus),
  );
  const driveFolderUrl = String(data.driveFolderUrl ?? data.driveUrl ?? "").trim();
  const documents = parseDocuments(data.documents ?? data.deliverables, driveFolderUrl);
  const quote = parseQuote(
    data.quote ??
      (data.Quote_PDF_URL
        ? {
            id: data.Quote_Document_Id ?? "quote",
            name: "Cotización Comercial",
            url: data.Quote_PDF_URL,
            status: data.Quote_Status ?? data.status,
            sentAt: data.Quote_Generated_At,
            approvedAt: data.Quote_Approved_At,
          }
        : null),
    documents,
  );
  const contract = parseContract(
    data.contract ??
      (data.Contract_URL
        ? {
            id: data.Contract_Document_Id ?? "contract",
            name: "Contrato Comercial",
            url: data.Contract_URL,
            status: data.Contract_Status ?? data.status,
            sentAt: data.Contract_Generated_At,
            approvedAt: data.Contract_Approved_At,
          }
        : null),
    documents,
  );
  const signature = parseSignature(data.signature);
  const payments = parsePayments(data.payments);
  const clientToken = String(
    data.clientToken ?? data.Brief_Token ?? data.client_token ?? "",
  ).trim();

  return {
    clientToken,
    projectName,
    serviceType: String(
      data.serviceType ?? data.service ?? data.servicio ?? "Implementación tecnológica",
    ).trim(),
    currentPhase,
    progressPercentage,
    driveFolderUrl,
    quote,
    contract,
    signature,
    payments,
    tasks: parseTasks(data.tasks),
    milestones: deriveMilestones(currentPhase, progressPercentage, data.milestones),
    documents,
  };
}

export async function fetchProjectStatus(clientToken: string): Promise<ProjectData> {
  const normalizedToken = clientToken.trim();
  if (!normalizedToken) {
    throw new ProjectStatusError(
      "No encontramos un token válido en el enlace.",
      400,
      "missing_token",
    );
  }

  if (!process.env.N8N_WEBHOOK_URL) {
    throw new ProjectStatusError(
      "N8N_WEBHOOK_URL no está configurada.",
      500,
      "missing_webhook",
    );
  }

  const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
    },
    body: JSON.stringify({ clientToken: normalizedToken }),
    cache: "no-store",
  });

  if (!n8nResponse.ok) {
    if ([400, 401, 403, 404].includes(n8nResponse.status)) {
      throw new ProjectStatusError(
        "Token caducado o proyecto no encontrado.",
        n8nResponse.status,
        "invalid_token",
      );
    }

    throw new ProjectStatusError(
      "Error al contactar con el sistema central (n8n).",
      502,
      "n8n_upstream_error",
    );
  }

  const rawData = await n8nResponse.json();
  return normalizeProjectData(rawData);
}

export { ProjectStatusError };
