import {
  type DocumentStatus,
  type DocumentType,
  type Milestone,
  type MilestoneStatus,
  type ProjectData,
  type ProjectDocument,
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
      });

      return acc;
    }, []);
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
  const projectName = String(data.projectName ?? data.project ?? "").trim();
  if (!projectName) {
    throw new ProjectStatusError(
      "Token no válido o datos del proyecto incompletos.",
      401,
      "invalid_token",
    );
  }

  const currentPhase = String(data.currentPhase ?? "Desarrollo").trim() || "Desarrollo";
  const progressPercentage = clampProgress(data.progressPercentage ?? data.progress);
  const driveFolderUrl = String(data.driveFolderUrl ?? data.driveUrl ?? "").trim();

  return {
    projectName,
    serviceType: String(data.serviceType ?? data.service ?? "Implementación tecnológica").trim(),
    currentPhase,
    progressPercentage,
    driveFolderUrl,
    tasks: parseTasks(data.tasks),
    milestones: deriveMilestones(currentPhase, progressPercentage, data.milestones),
    documents: parseDocuments(data.documents ?? data.deliverables, driveFolderUrl),
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
