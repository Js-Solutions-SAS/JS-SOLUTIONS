"use client";

import { useCallback, useMemo, useOptimistic, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CircleDashed,
  Code2,
  Compass,
  ExternalLink,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Link2,
  LoaderCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import {
  approveDeliverableAction,
  approveQuoteAction,
} from "@/app/dashboard/actions";
import type {
  DocumentStatus,
  ProjectData,
  ProjectDocument,
  ProjectQuote,
  Task,
  TaskStatus,
} from "@/app/dashboard/types";

interface DashboardClientProps {
  token: string;
  initialData: ProjectData;
}

interface Toast {
  id: number;
  title: string;
  description: string;
  tone: "success" | "error";
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getTaskStatusMeta(status: TaskStatus) {
  switch (status) {
    case "Finalizado":
      return {
        icon: CheckCircle2,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "QA":
      return {
        icon: ShieldCheck,
        badge: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "En curso":
      return {
        icon: LoaderCircle,
        badge: "bg-blue-50 text-blue-700 border-blue-200",
      };
    default:
      return {
        icon: CircleDashed,
        badge: "bg-neutral-100 text-neutral-600 border-neutral-200",
      };
  }
}

function getMilestoneIcon(phase: string) {
  const normalized = phase.toLowerCase();

  if (normalized.includes("desc")) return Compass;
  if (normalized.includes("desarrollo") || normalized.includes("build")) return Code2;
  if (normalized.includes("qa") || normalized.includes("calidad")) return FlaskConical;
  if (normalized.includes("entrega") || normalized.includes("release")) return Rocket;

  return Sparkles;
}

function getMilestoneStatusStyles(status: string) {
  if (status === "Completado") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "En Proceso") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-500";
}

function getDocumentIcon(type: ProjectDocument["type"]) {
  switch (type) {
    case "pdf":
      return FileText;
    case "doc":
      return FileCode2;
    case "image":
      return FileImage;
    case "sheet":
      return FileSpreadsheet;
    case "figma":
      return Sparkles;
    default:
      return Link2;
  }
}

function getDocumentStatusClass(status: DocumentStatus) {
  if (status === "Aprobado") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "En revisión") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-neutral-200 bg-neutral-100 text-neutral-600";
}

function inferTasksForMilestone(tasks: Task[], activePhase: string): Task[] {
  const normalizedPhase = activePhase.toLowerCase();

  const byExplicitPhase = tasks.filter((task) =>
    task.phase?.toLowerCase().includes(normalizedPhase),
  );

  if (byExplicitPhase.length > 0) {
    return byExplicitPhase;
  }

  if (normalizedPhase.includes("qa")) {
    const filtered = tasks.filter((task) => task.status === "QA");
    return filtered.length > 0 ? filtered : tasks;
  }

  if (normalizedPhase.includes("desarrollo")) {
    const filtered = tasks.filter((task) => task.status === "En curso");
    return filtered.length > 0 ? filtered : tasks;
  }

  if (normalizedPhase.includes("desc")) {
    const filtered = tasks.filter((task) => task.status === "Pendiente");
    return filtered.length > 0 ? filtered : tasks;
  }

  if (normalizedPhase.includes("entrega")) {
    const filtered = tasks.filter((task) => task.status === "Finalizado");
    return filtered.length > 0 ? filtered : tasks;
  }

  return tasks;
}

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[70] flex w-[min(92vw,24rem)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-lg",
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50/95"
                : "border-red-200 bg-red-50/95",
            )}
          >
            <p className="text-sm font-semibold text-brand-charcoal">{toast.title}</p>
            <p className="mt-1 text-xs text-neutral-600">{toast.description}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function DashboardClient({ token, initialData }: DashboardClientProps) {
  const [documents, setDocuments] = useState(initialData.documents);
  const [quote, setQuote] = useState<ProjectQuote | null>(initialData.quote ?? null);
  const [activeMilestoneId, setActiveMilestoneId] = useState(
    () =>
      initialData.milestones.find((milestone) => milestone.status === "En Proceso")?.id ??
      initialData.milestones[0]?.id ??
      "",
  );
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [pendingQuoteId, setPendingQuoteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPending, startTransition] = useTransition();

  const [optimisticDocuments, addOptimisticApproval] = useOptimistic(
    documents,
    (currentState, approvedDocumentId: string) =>
      currentState.map((doc) =>
        doc.id === approvedDocumentId ? { ...doc, status: "Aprobado" as const } : doc,
      ),
  );
  const [optimisticQuote, addOptimisticQuoteApproval] = useOptimistic(
    quote,
    (currentState: ProjectQuote | null, _approved: true) =>
      currentState
        ? {
            ...currentState,
            status: "Aprobado" as const,
            approvedAt: currentState.approvedAt ?? new Date().toISOString(),
          }
        : currentState,
  );

  const pushToast = useCallback((payload: Omit<Toast, "id">) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    setToasts((current) => [...current, { ...payload, id }]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const activeMilestone = useMemo(
    () => initialData.milestones.find((milestone) => milestone.id === activeMilestoneId),
    [activeMilestoneId, initialData.milestones],
  );

  const visibleTasks = useMemo(() => {
    if (!activeMilestone) {
      return initialData.tasks;
    }

    return inferTasksForMilestone(initialData.tasks, activeMilestone.name);
  }, [activeMilestone, initialData.tasks]);

  const completedTasks = useMemo(
    () => initialData.tasks.filter((task) => task.status === "Finalizado").length,
    [initialData.tasks],
  );

  const inProgressTasks = useMemo(
    () =>
      initialData.tasks.filter((task) => ["En curso", "QA"].includes(task.status))
        .length,
    [initialData.tasks],
  );

  const approvedDocs = useMemo(
    () => optimisticDocuments.filter((document) => document.status === "Aprobado").length,
    [optimisticDocuments],
  );

  const handleApproveDeliverable = (document: ProjectDocument) => {
    if (document.status === "Aprobado") {
      return;
    }

    startTransition(async () => {
      setPendingDocumentId(document.id);
      addOptimisticApproval(document.id);

      const result = await approveDeliverableAction({
        clientToken: token,
        documentId: document.id,
        documentName: document.name,
      });

      if (!result.ok) {
        pushToast({
          tone: "error",
          title: "No se pudo aprobar",
          description: result.message,
        });
        setPendingDocumentId(null);
        return;
      }

      setDocuments((current) =>
        current.map((doc) =>
          doc.id === document.id ? { ...doc, status: "Aprobado" as const } : doc,
        ),
      );

      pushToast({
        tone: "success",
        title: "Entregable aprobado",
        description: result.message,
      });
      setPendingDocumentId(null);
    });
  };

  const handleApproveQuote = (activeQuote: ProjectQuote) => {
    if (activeQuote.status === "Aprobado") {
      return;
    }

    startTransition(async () => {
      setPendingQuoteId(activeQuote.id);
      addOptimisticQuoteApproval(true);

      const result = await approveQuoteAction({
        clientToken: token,
        resourceId: activeQuote.id,
        resourceName: activeQuote.name,
      });

      if (!result.ok) {
        pushToast({
          tone: "error",
          title: "No se pudo aceptar",
          description: result.message,
        });
        setPendingQuoteId(null);
        return;
      }

      setQuote((current) =>
        current
          ? {
              ...current,
              status: "Aprobado",
              approvedAt: current.approvedAt ?? new Date().toISOString(),
            }
          : current,
      );
      setDocuments((current) =>
        current.map((document) =>
          document.kind === "quote" || document.id === activeQuote.id
            ? { ...document, status: "Aprobado" as const }
            : document,
        ),
      );

      pushToast({
        tone: "success",
        title: "Cotización aceptada",
        description: result.message,
      });
      setPendingQuoteId(null);
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f6f2] px-4 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-gold/20 to-transparent blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative mx-auto max-w-6xl space-y-6"
      >
        <section className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                Cliente Portal
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-brand-charcoal sm:text-3xl">
                {initialData.projectName}
              </h1>
              <p className="text-sm text-neutral-600">{initialData.serviceType}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Sesión segura validada
              </div>

              {initialData.driveFolderUrl ? (
                <a
                  href={initialData.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-brand-charcoal transition hover:scale-[1.01] hover:border-black/20 hover:shadow-md"
                >
                  <FolderOpen className="h-4 w-4" />
                  Abrir Drive
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-500">
                  <FolderOpen className="h-4 w-4" />
                  Sin enlace de Drive
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Avance global
            </p>
            <p className="mt-3 text-4xl font-semibold text-brand-charcoal">
              {initialData.progressPercentage}%
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full border border-black/10 bg-neutral-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${initialData.progressPercentage}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="relative h-full rounded-full bg-brand-charcoal"
              >
                <div className="absolute inset-0 skeleton-shimmer opacity-70" />
              </motion.div>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              Fase activa: <span className="font-semibold text-brand-charcoal">{initialData.currentPhase}</span>
            </p>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Timeline del proyecto
              </p>
              <span className="text-xs text-neutral-500">
                {completedTasks} completadas · {inProgressTasks} activas
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {initialData.milestones.map((milestone) => {
                const Icon = getMilestoneIcon(milestone.name);
                const isActive = milestone.id === activeMilestoneId;

                return (
                  <button
                    key={milestone.id}
                    onClick={() => setActiveMilestoneId(milestone.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      isActive
                        ? "border-brand-charcoal/25 bg-brand-charcoal text-white"
                        : "border-black/10 bg-white text-brand-charcoal",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                          isActive
                            ? "border-white/20 bg-white/10 text-white"
                            : getMilestoneStatusStyles(milestone.status),
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                          isActive
                            ? "border-white/25 text-white"
                            : getMilestoneStatusStyles(milestone.status),
                        )}
                      >
                        {milestone.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{milestone.name}</p>
                    <p className={cn("mt-1 text-xs", isActive ? "text-white/75" : "text-neutral-500")}>{milestone.description}</p>
                  </button>
                );
              })}
            </div>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-charcoal">Detalle operativo</h2>
                <p className="text-sm text-neutral-500">
                  {activeMilestone
                    ? `Tareas visibles para ${activeMilestone.name}`
                    : "Tareas del plan de trabajo"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {visibleTasks.map((task) => {
                const statusMeta = getTaskStatusMeta(task.status);
                const StatusIcon = statusMeta.icon;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-neutral-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border", statusMeta.badge)}>
                        <StatusIcon className={cn("h-4 w-4", task.status === "En curso" && "animate-spin")}/>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-brand-charcoal">{task.name}</p>
                        <p className="text-xs text-neutral-500">{task.phase ?? "Flujo general"}</p>
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide", statusMeta.badge)}>
                      {task.status}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Entregables
            </h2>
            <p className="mt-2 text-3xl font-semibold text-brand-charcoal">
              {approvedDocs}
              <span className="ml-2 text-sm font-medium text-neutral-500">aprobados</span>
            </p>
            <p className="mt-4 text-sm text-neutral-500">
              Total en centro documental: <span className="font-semibold text-brand-charcoal">{optimisticDocuments.length}</span>
            </p>
            <div className="mt-5 rounded-2xl border border-black/10 bg-neutral-50 p-4 text-xs text-neutral-600">
              Al aprobar un entregable se sincroniza automáticamente con n8n y el equipo operativo.
            </div>
          </article>
        </section>

        {optimisticQuote ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Cotización Comercial
                </p>
                <h2 className="text-xl font-semibold text-brand-charcoal">
                  {optimisticQuote.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      getDocumentStatusClass(optimisticQuote.status),
                    )}
                  >
                    {optimisticQuote.status}
                  </span>
                  {optimisticQuote.sentAt ? (
                    <span className="text-xs text-neutral-500">
                      Enviada: {optimisticQuote.sentAt}
                    </span>
                  ) : null}
                  {optimisticQuote.approvedAt ? (
                    <span className="text-xs text-neutral-500">
                      Aprobada: {optimisticQuote.approvedAt}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={optimisticQuote.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-brand-charcoal transition hover:scale-[1.01] hover:border-black/20 hover:shadow-md"
                >
                  Abrir cotización
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleApproveQuote(optimisticQuote)}
                  disabled={
                    optimisticQuote.status === "Aprobado" ||
                    pendingQuoteId === optimisticQuote.id
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition",
                    optimisticQuote.status === "Aprobado"
                      ? "cursor-default bg-emerald-600"
                      : "bg-brand-charcoal hover:scale-[1.01] hover:bg-black disabled:cursor-not-allowed disabled:opacity-70",
                  )}
                >
                  {pendingQuoteId === optimisticQuote.id ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Enviando
                    </>
                  ) : optimisticQuote.status === "Aprobado" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Aceptada
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Aceptar cotización
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-brand-charcoal">Centro de Documentos</h2>
              <p className="text-sm text-neutral-500">
                Revisa archivos, abre fuentes y aprueba entregables en un clic.
              </p>
            </div>
            <span className="rounded-full border border-black/10 bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {isPending ? "Sincronizando aprobación..." : "Sincronización en tiempo real"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {optimisticDocuments.map((document) => {
              const DocumentIcon = getDocumentIcon(document.type);
              const isApproving = pendingDocumentId === document.id;
              const isApproved = document.status === "Aprobado";
              const isQuoteDocument = document.kind === "quote";

              return (
                <article
                  key={document.id}
                  className="group rounded-2xl border border-black/10 bg-white p-4 transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-black/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-neutral-50 text-brand-charcoal">
                      <DocumentIcon className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        getDocumentStatusClass(document.status),
                      )}
                    >
                      {document.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-brand-charcoal">{document.name}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {document.sizeLabel ?? "Documento de proyecto"}
                    {document.updatedAt ? ` · Actualizado ${document.updatedAt}` : ""}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {document.url ? (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-brand-charcoal transition hover:border-black/25"
                      >
                        Abrir
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
                        Sin enlace
                      </span>
                    )}

                    {isQuoteDocument ? (
                      <span className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
                        Acepta desde el bloque superior
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveDeliverable(document)}
                        disabled={isApproved || isApproving}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition",
                          isApproved
                            ? "cursor-default bg-emerald-600"
                            : "bg-brand-charcoal hover:scale-[1.01] hover:bg-black disabled:cursor-not-allowed disabled:opacity-70",
                        )}
                      >
                        {isApproving ? (
                          <>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            Enviando
                          </>
                        ) : isApproved ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprobado
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Aprobar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </motion.main>

      <ToastViewport toasts={toasts} />
    </div>
  );
}
