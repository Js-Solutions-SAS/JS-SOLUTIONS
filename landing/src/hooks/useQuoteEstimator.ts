import { type FormEvent, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine, fromPromise } from "xstate";

import {
  createCorrelationId,
  createDomainEvent,
} from "@/domain/core/events/types";
import { createDualEventBus } from "@/domain/core/events/event-bus";

export const SERVICES = [
  {
    id: "autom",
    name: "Automatización con n8n",
    prices: { baja: 1200000, media: 3500000, alta: 6500000 },
  },
  {
    id: "software",
    name: "Desarrollo a Medida (Web/App)",
    prices: { baja: 3500000, media: 12000000, alta: 25000000 },
  },
  {
    id: "voz",
    name: "Agentes de Voz con IA",
    prices: { baja: 1800000, media: 6000000, alta: 12000000 },
  },
  {
    id: "content",
    name: "Content Factory",
    prices: { baja: 900000, media: 2500000, alta: 5000000 },
  },
] as const;

const LEAD_ID_STORAGE_KEY = "js_quote_lead_id";
const SESSION_ID_STORAGE_KEY = "js_quote_session_id";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type Status = "idle" | "loading" | "success" | "error";

type Complexity = "baja" | "media" | "alta";
type Sector = "pyme" | "publico";
type QuoteAction = "preview" | "send";

type EstimatedRange = {
  min: number;
  max: number;
};

interface QuoteStateContext {
  selectedServices: string[];
  complexity: Complexity;
  sector: Sector;
  nombre: string;
  empresa: string;
  email: string;
  detalles: string;
  website: string;
  errorMessage: string;
  formMessage: string;
  showModal: boolean;
  previewPdfUrl: string;
  quoteId: string;
  feedback: string;
  leadId: string;
  sessionId: string;
  utmData: Record<string, string> | null;
  submissionMode: QuoteAction;
  correlationId: string;
}

type HydrateEvent = {
  type: "HYDRATE";
  leadId: string;
  sessionId: string;
  utmData: Record<string, string> | null;
};

type SubmitPreviewEvent = { type: "SUBMIT_PREVIEW" };
type SubmitSendEvent = { type: "SUBMIT_SEND" };
type SubmitCorrectionEvent = { type: "SUBMIT_CORRECTION" };
type RetryEvent = { type: "RETRY" };
type CloseModalEvent = { type: "CLOSE_MODAL" };
type OpenCorrectionEvent = { type: "OPEN_CORRECTION" };
type CancelCorrectionEvent = { type: "CANCEL_CORRECTION" };
type ToggleServiceEvent = { type: "TOGGLE_SERVICE"; serviceId: string };
type SetComplexityEvent = { type: "SET_COMPLEXITY"; value: Complexity };
type SetSectorEvent = { type: "SET_SECTOR"; value: Sector };
type SetNombreEvent = { type: "SET_NOMBRE"; value: string };
type SetEmpresaEvent = { type: "SET_EMPRESA"; value: string };
type SetEmailEvent = { type: "SET_EMAIL"; value: string };
type SetDetallesEvent = { type: "SET_DETALLES"; value: string };
type SetWebsiteEvent = { type: "SET_WEBSITE"; value: string };
type SetFeedbackEvent = { type: "SET_FEEDBACK"; value: string };
type ResetEvent = { type: "RESET" };

type QuoteEvents =
  | HydrateEvent
  | SubmitPreviewEvent
  | SubmitSendEvent
  | SubmitCorrectionEvent
  | RetryEvent
  | CloseModalEvent
  | OpenCorrectionEvent
  | CancelCorrectionEvent
  | ToggleServiceEvent
  | SetComplexityEvent
  | SetSectorEvent
  | SetNombreEvent
  | SetEmpresaEvent
  | SetEmailEvent
  | SetDetallesEvent
  | SetWebsiteEvent
  | SetFeedbackEvent
  | ResetEvent;

type SubmitResult = {
  nextLeadId: string;
  quoteId: string;
  previewPdfUrl: string;
  mode: QuoteAction;
};

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `quote-${crypto.randomUUID()}`;
  }

  return `quote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_:.]/g, "");
}

function createIdempotencyKey(input: {
  sessionId: string;
  mode: QuoteAction;
  leadId?: string;
  serviceNames: string;
  feedback?: string;
}) {
  const parts = [
    "quote-estimate",
    normalizeValue(input.sessionId),
    normalizeValue(input.mode),
    normalizeValue(input.leadId || "new"),
    normalizeValue(input.serviceNames || "na"),
    normalizeValue(input.feedback || "na"),
  ];

  return parts.join(":").slice(0, 190);
}

function collectUtm(search: string): Record<string, string> | null {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      result[key] = value;
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseJsonResponse(value: string): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }

    return {};
  } catch {
    return {
      raw: value,
    };
  }
}

function getEstimatedRange(context: Pick<QuoteStateContext, "selectedServices" | "complexity" | "sector">): EstimatedRange {
  if (context.selectedServices.length === 0) {
    return { min: 0, max: 0 };
  }

  let min = 0;
  let max = 0;

  context.selectedServices.forEach((srvId) => {
    const srv = SERVICES.find((service) => service.id === srvId);
    if (!srv) {
      return;
    }

    if (context.complexity === "baja") {
      min += srv.prices.baja;
      max += srv.prices.media;
      return;
    }

    if (context.complexity === "media") {
      min += srv.prices.media;
      max += (srv.prices.media + srv.prices.alta) / 2;
      return;
    }

    min += srv.prices.alta;
    max += srv.prices.alta * 1.5;
  });

  if (context.sector === "publico") {
    min *= 1.2;
    max *= 1.3;
  }

  return { min, max };
}

function getSelectedServiceNames(selectedServices: string[]): string {
  return selectedServices
    .map((id) => SERVICES.find((service) => service.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

function persistLeadId(nextLeadId: string) {
  if (typeof window === "undefined" || !nextLeadId) {
    return;
  }

  window.localStorage.setItem(LEAD_ID_STORAGE_KEY, nextLeadId);
}

function trackQuoteEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const detail = {
    event,
    source: "landing_quote_estimator",
    at: new Date().toISOString(),
    ...payload,
  };

  window.dispatchEvent(new CustomEvent("js_tracking", { detail }));

  const bus = createDualEventBus(window);
  const domainEvent = createDomainEvent("landing.quote-estimator", event, detail);
  bus.publish(domainEvent);
}

async function submitEstimate(
  context: QuoteStateContext,
  mode: QuoteAction,
  endpointBase: string,
): Promise<SubmitResult> {
  const selectedServiceNames = getSelectedServiceNames(context.selectedServices);
  const normalizedEmail = context.email.trim().toLowerCase();
  const range = getEstimatedRange(context);
  const correlationId = createCorrelationId("quote");
  const idempotencyKey = createIdempotencyKey({
    sessionId: context.sessionId || createSessionId(),
    mode,
    leadId: context.leadId,
    serviceNames: selectedServiceNames,
    feedback: mode === "preview" ? context.feedback.trim() : "",
  });

  trackQuoteEvent("quote_submit_started", {
    mode,
    leadId: context.leadId || "new",
    correlationId,
    idempotencyKey,
  });

  const tracker =
    typeof window !== "undefined"
      ? ((window as Window & { __jsTrack?: Record<string, unknown> }).__jsTrack as
          | {
              getLeadPayloadMeta?: () => Record<string, unknown>;
            }
          | undefined)
      : undefined;
  const trackingMeta = tracker?.getLeadPayloadMeta?.() || {};
  const trackingUtm =
    trackingMeta.utm && typeof trackingMeta.utm === "object"
      ? (trackingMeta.utm as Record<string, unknown>)
      : undefined;

  const payload = {
    leadId: context.leadId || undefined,
    fullName: context.nombre.trim(),
    companyName: context.empresa.trim(),
    email: normalizedEmail,
    website: context.website.trim(),
    serviceInterest: selectedServiceNames,
    source: "landing_quote_estimator",
    utm: trackingUtm || context.utmData || undefined,
    landingPath:
      typeof trackingMeta.landingPath === "string"
        ? trackingMeta.landingPath
        : typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/cotizador",
    referrer:
      typeof trackingMeta.referrer === "string"
        ? trackingMeta.referrer
        : typeof document !== "undefined" && document.referrer
          ? document.referrer
          : undefined,
    mode,
    feedback: mode === "preview" ? context.feedback.trim() : "",
    correlationId,
    idempotencyKey,
    transcription: `
      SOLICITUD DE COTIZACION - JS SOLUTIONS
      --------------------------------------
      CLIENTE: ${context.nombre.trim()}
      EMPRESA: ${context.empresa.trim()}
      SECTOR: ${context.sector.toUpperCase()}
      SERVICIOS: ${selectedServiceNames}
      COMPLEJIDAD: ${context.complexity.toUpperCase()}
      INVERSION ESTIMADA: $${range.min.toLocaleString()} - $${range.max.toLocaleString()} COP

      REQUERIMIENTOS DETALLADOS:
      ${context.detalles.trim() || "No se proporcionaron detalles adicionales."}
    `.trim(),
  };

  const endpoint = `${endpointBase.replace(/\/$/, "")}/api/public/quotes/estimate`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Correlation-Id": correlationId,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  const result = parseJsonResponse(responseText);

  if (!response.ok) {
    const message =
      typeof result.error === "string"
        ? result.error
        : typeof result.message === "string"
          ? result.message
          : `Error ${response.status}: no se pudo generar la cotización.`;
    throw new Error(message);
  }

  const nextLeadId =
    typeof result.leadId === "string"
      ? result.leadId
      : typeof result.data === "object" &&
          result.data &&
          typeof (result.data as Record<string, unknown>).leadId === "string"
        ? ((result.data as Record<string, unknown>).leadId as string)
        : "";

  const rawPdfUrl =
    typeof result.quotePdfUrl === "string"
      ? result.quotePdfUrl
      : typeof result.pdfUrl === "string"
        ? result.pdfUrl
        : typeof result.data === "object" &&
            result.data &&
            typeof (result.data as Record<string, unknown>).quotePdfUrl === "string"
          ? ((result.data as Record<string, unknown>).quotePdfUrl as string)
          : "";

  const processedPdfUrl = rawPdfUrl.includes("drive.google.com")
    ? rawPdfUrl.replace(/\/view(\?.*)?$/, "/preview")
    : rawPdfUrl;

  const nextQuoteId =
    typeof result.id === "string"
      ? result.id
      : typeof result.quoteDocumentId === "string"
        ? result.quoteDocumentId
        : `JS-${Date.now()}`;

  trackQuoteEvent("quote_submit_success", {
    mode,
    leadId: nextLeadId || context.leadId || "new",
    correlationId,
  });

  return {
    nextLeadId,
    quoteId: nextQuoteId,
    previewPdfUrl: processedPdfUrl,
    mode,
  };
}

export const quoteEstimatorMachine = createMachine(
  {
    types: {} as {
      context: QuoteStateContext;
      events: QuoteEvents;
      output: SubmitResult;
    },
    id: "quote_estimator_machine",
    initial: "idle",
    context: {
      selectedServices: [],
      complexity: "media",
      sector: "pyme",
      nombre: "",
      empresa: "",
      email: "",
      detalles: "",
      website: "",
      errorMessage: "",
      formMessage: "",
      showModal: false,
      previewPdfUrl: "",
      quoteId: "",
      feedback: "",
      leadId: "",
      sessionId: "",
      utmData: null,
      submissionMode: "preview",
      correlationId: "",
    },
    on: {
      HYDRATE: {
        actions: assign(({ event }) => {
          if (event.type !== "HYDRATE") return {};
          return {
            leadId: event.leadId,
            sessionId: event.sessionId,
            utmData: event.utmData,
          };
        }),
      },
      TOGGLE_SERVICE: {
        actions: assign(({ context, event }) => {
          if (event.type !== "TOGGLE_SERVICE") return {};
          const next = context.selectedServices.includes(event.serviceId)
            ? context.selectedServices.filter((serviceId) => serviceId !== event.serviceId)
            : [...context.selectedServices, event.serviceId];

          return {
            selectedServices: next,
          };
        }),
      },
      SET_COMPLEXITY: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_COMPLEXITY") return {};
          return { complexity: event.value };
        }),
      },
      SET_SECTOR: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_SECTOR") return {};
          return { sector: event.value };
        }),
      },
      SET_NOMBRE: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_NOMBRE") return {};
          return { nombre: event.value };
        }),
      },
      SET_EMPRESA: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_EMPRESA") return {};
          return { empresa: event.value };
        }),
      },
      SET_EMAIL: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_EMAIL") return {};
          return { email: event.value };
        }),
      },
      SET_DETALLES: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_DETALLES") return {};
          return { detalles: event.value };
        }),
      },
      SET_WEBSITE: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_WEBSITE") return {};
          return { website: event.value };
        }),
      },
      SET_FEEDBACK: {
        actions: assign(({ event }) => {
          if (event.type !== "SET_FEEDBACK") return {};
          return { feedback: event.value };
        }),
      },
      RESET: {
        actions: assign(() => ({
          errorMessage: "",
          formMessage: "",
          showModal: false,
          previewPdfUrl: "",
          quoteId: "",
          feedback: "",
        })),
        target: ".idle",
      },
    },
    states: {
      idle: {
        on: {
          SUBMIT_PREVIEW: [
            {
              guard: "isPreviewSubmissionValid",
              actions: assign(() => ({
                submissionMode: "preview",
                errorMessage: "",
                formMessage: "",
              })),
              target: "submitting",
            },
            {
              actions: "setValidationError",
              target: "failure",
            },
          ],
        },
      },
      submitting: {
        invoke: {
          src: "submit",
          input: ({ context }) => context,
          onDone: [
            {
              guard: ({ event }) => event.output.mode === "preview",
              actions: ["handlePreviewSuccess"],
              target: "preview_ready",
            },
            {
              actions: ["handleSendSuccess"],
              target: "success",
            },
          ],
          onError: {
            actions: "handleSubmissionError",
            target: "failure",
          },
        },
      },
      preview_ready: {
        on: {
          OPEN_CORRECTION: {
            target: "correcting",
          },
          CLOSE_MODAL: {
            actions: assign(() => ({
              showModal: false,
            })),
            target: "idle",
          },
          SUBMIT_SEND: {
            guard: "canSend",
            actions: assign(() => ({
              submissionMode: "send",
              errorMessage: "",
              formMessage: "",
            })),
            target: "submitting",
          },
        },
      },
      correcting: {
        on: {
          CANCEL_CORRECTION: {
            target: "preview_ready",
          },
          SUBMIT_CORRECTION: [
            {
              guard: "canCorrect",
              actions: assign(() => ({
                submissionMode: "preview",
                errorMessage: "",
                formMessage: "",
              })),
              target: "submitting",
            },
            {
              actions: assign(() => ({
                formMessage: "Describe el ajuste para regenerar la propuesta.",
              })),
            },
          ],
        },
      },
      success: {
        on: {
          RESET: {
            target: "idle",
          },
        },
      },
      failure: {
        on: {
          RETRY: {
            actions: assign(() => ({
              errorMessage: "",
              formMessage: "",
            })),
            target: "idle",
          },
          SUBMIT_PREVIEW: {
            target: "idle",
          },
        },
      },
    },
  },
  {
    guards: {
      isPreviewSubmissionValid: ({ context }) => {
        const normalizedEmail = context.email.trim().toLowerCase();
        return (
          context.selectedServices.length > 0 &&
          isValidEmail(normalizedEmail) &&
          !context.website.trim()
        );
      },
      canCorrect: ({ context }) => Boolean(context.feedback.trim()),
      canSend: ({ context }) => Boolean(context.quoteId),
    },
    actions: {
      setValidationError: assign(({ context }) => {
        if (context.selectedServices.length === 0) {
          trackQuoteEvent("quote_validation_error", {
            reason: "missing_service",
          });
          return {
            errorMessage: "Selecciona al menos un servicio para estimar la propuesta.",
            formMessage: "Selecciona al menos un servicio para continuar.",
          };
        }

        trackQuoteEvent("quote_validation_error", {
          reason: "invalid_email",
        });

        return {
          errorMessage: "Debes ingresar un correo válido para continuar.",
          formMessage: "Revisa el correo electrónico e intenta de nuevo.",
        };
      }),
      handlePreviewSuccess: assign(({ context, event }) => {
        if (!("output" in event) || !event.output) return {};
        const result = event.output as SubmitResult;

        if (result.nextLeadId) {
          persistLeadId(result.nextLeadId);
        }

        return {
          leadId: result.nextLeadId || context.leadId,
          quoteId: result.quoteId,
          previewPdfUrl: result.previewPdfUrl,
          showModal: true,
          formMessage: "Previsualización lista. Revisa y decide el siguiente paso.",
          feedback: "",
        };
      }),
      handleSendSuccess: assign(({ context, event }) => {
        if (!("output" in event) || !event.output) return {};
        const result = event.output as SubmitResult;

        if (result.nextLeadId) {
          persistLeadId(result.nextLeadId);
        }

        return {
          leadId: result.nextLeadId || context.leadId,
          showModal: false,
          formMessage: "Propuesta enviada. Te contactaremos para continuar.",
          feedback: "",
        };
      }),
      handleSubmissionError: assign(({ event }) => {
        const message =
          "error" in event && event.error instanceof Error
            ? event.error.message
            : "No se pudo completar la solicitud de cotización.";

        trackQuoteEvent("quote_submit_error", {
          error: message,
        });

        return {
          errorMessage: message,
          formMessage: "No pudimos procesar la solicitud. Intenta de nuevo.",
        };
      }),
    },
    actors: {
      submit: fromPromise(async ({ input }: { input: QuoteStateContext }) => {
        const endpointBase = typeof window !== "undefined" ? window.location.origin : "";
        return submitEstimate(input, input.submissionMode, endpointBase);
      }),
    },
  },
);

export function useQuoteEstimator(_apiBaseUrl: string) {
  const [state, send] = useMachine(quoteEstimatorMachine);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLeadId = window.localStorage.getItem(LEAD_ID_STORAGE_KEY) || "";
    const storedSessionId =
      window.localStorage.getItem(SESSION_ID_STORAGE_KEY) || createSessionId();
    window.localStorage.setItem(SESSION_ID_STORAGE_KEY, storedSessionId);

    send({
      type: "HYDRATE",
      leadId: storedLeadId,
      sessionId: storedSessionId,
      utmData: collectUtm(window.location.search),
    });
  }, [send]);

  const status: Status = useMemo(() => {
    if (state.matches("submitting")) {
      return "loading";
    }

    if (state.matches("success")) {
      return "success";
    }

    if (state.matches("failure")) {
      return "error";
    }

    return "idle";
  }, [state]);

  const estimatedRange = useMemo(() => getEstimatedRange(state.context), [state.context]);

  return {
    SERVICES,
    selectedServices: state.context.selectedServices,
    complexity: state.context.complexity,
    sector: state.context.sector,
    nombre: state.context.nombre,
    empresa: state.context.empresa,
    email: state.context.email,
    detalles: state.context.detalles,
    website: state.context.website,
    status,
    errorMessage: state.context.errorMessage,
    formMessage: state.context.formMessage,
    showModal: state.context.showModal,
    previewPdfUrl: state.context.previewPdfUrl,
    quoteId: state.context.quoteId,
    feedback: state.context.feedback,
    isCorrecting: state.matches("correcting"),
    estimatedRange,
    setComplexity: (value: Complexity) => send({ type: "SET_COMPLEXITY", value }),
    setSector: (value: Sector) => send({ type: "SET_SECTOR", value }),
    setNombre: (value: string) => send({ type: "SET_NOMBRE", value }),
    setEmpresa: (value: string) => send({ type: "SET_EMPRESA", value }),
    setEmail: (value: string) => send({ type: "SET_EMAIL", value }),
    setDetalles: (value: string) => send({ type: "SET_DETALLES", value }),
    setWebsite: (value: string) => send({ type: "SET_WEBSITE", value }),
    setStatus: (nextStatus: Status) => {
      if (nextStatus === "idle") {
        send({ type: "RESET" });
      }
    },
    setFeedback: (value: string) => send({ type: "SET_FEEDBACK", value }),
    setIsCorrecting: (value: boolean) =>
      send({ type: value ? "OPEN_CORRECTION" : "CANCEL_CORRECTION" }),
    handleServiceToggle: (id: string) => send({ type: "TOGGLE_SERVICE", serviceId: id }),
    handleSubmit: async (event?: FormEvent) => {
      event?.preventDefault();
      send({ type: "SUBMIT_PREVIEW" });
    },
    handleAprobar: async () => {
      send({ type: "SUBMIT_SEND" });
    },
    handleCorregir: async () => {
      send({ type: "SUBMIT_CORRECTION" });
    },
    closeModal: () => send({ type: "CLOSE_MODAL" }),
  };
}
