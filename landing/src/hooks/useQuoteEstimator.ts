import { type FormEvent, useEffect, useMemo, useState } from "react";

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

type TrackingPayload = Record<string, unknown>;

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `quote-${crypto.randomUUID()}`;
  }

  return `quote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createCorrelationId(sessionId: string) {
  return `quote-${sessionId}-${Date.now()}`;
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

function trackQuoteEvent(event: string, payload: TrackingPayload = {}) {
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
  console.info("[tracking]", detail);
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

export function useQuoteEstimator(apiBaseUrl: string) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<Complexity>("media");
  const [sector, setSector] = useState<Sector>("pyme");

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [detalles, setDetalles] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrecting, setIsCorrecting] = useState(false);

  const [leadId, setLeadId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [utmData, setUtmData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLeadId = window.localStorage.getItem(LEAD_ID_STORAGE_KEY) || "";
    setLeadId(storedLeadId);

    const storedSessionId =
      window.localStorage.getItem(SESSION_ID_STORAGE_KEY) || createSessionId();
    setSessionId(storedSessionId);
    window.localStorage.setItem(SESSION_ID_STORAGE_KEY, storedSessionId);

    setUtmData(collectUtm(window.location.search));
  }, []);

  const estimatedRange = useMemo(() => {
    if (selectedServices.length === 0) {
      return { min: 0, max: 0 };
    }

    let min = 0;
    let max = 0;

    selectedServices.forEach((srvId) => {
      const srv = SERVICES.find((service) => service.id === srvId);
      if (!srv) {
        return;
      }

      if (complexity === "baja") {
        min += srv.prices.baja;
        max += srv.prices.media;
        return;
      }

      if (complexity === "media") {
        min += srv.prices.media;
        max += (srv.prices.media + srv.prices.alta) / 2;
        return;
      }

      min += srv.prices.alta;
      max += srv.prices.alta * 1.5;
    });

    if (sector === "publico") {
      min *= 1.2;
      max *= 1.3;
    }

    return { min, max };
  }, [selectedServices, complexity, sector]);

  const handleServiceToggle = (id: string) => {
    setSelectedServices((previous) =>
      previous.includes(id)
        ? previous.filter((serviceId) => serviceId !== id)
        : [...previous, id],
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setIsCorrecting(false);
  };

  const persistLeadId = (nextLeadId: string) => {
    if (typeof window === "undefined" || !nextLeadId) {
      return;
    }

    window.localStorage.setItem(LEAD_ID_STORAGE_KEY, nextLeadId);
    setLeadId(nextLeadId);
  };

  const submitEstimate = async (input: {
    mode: QuoteAction;
    feedbackText?: string;
  }) => {
    if (selectedServices.length === 0) {
      setStatus("error");
      setErrorMessage("Selecciona al menos un servicio para estimar la propuesta.");
      setFormMessage("Selecciona al menos un servicio para continuar.");
      trackQuoteEvent("quote_validation_error", {
        reason: "missing_service",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setStatus("error");
      setErrorMessage("Debes ingresar un correo válido para continuar.");
      setFormMessage("Revisa el correo electrónico e intenta de nuevo.");
      trackQuoteEvent("quote_validation_error", {
        reason: "invalid_email",
      });
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setFormMessage("");

    const selectedServiceNames = selectedServices
      .map((id) => SERVICES.find((service) => service.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const start = Date.now();
    const correlationId = createCorrelationId(sessionId || createSessionId());
    const idempotencyKey = createIdempotencyKey({
      sessionId: sessionId || createSessionId(),
      mode: input.mode,
      leadId,
      serviceNames: selectedServiceNames,
      feedback: input.feedbackText,
    });

    trackQuoteEvent("quote_submit_started", {
      mode: input.mode,
      leadId: leadId || "new",
      correlationId,
      event_id: `search:${correlationId}`,
      idempotencyKey,
      servicesCount: selectedServices.length,
      service_interest: selectedServiceNames,
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
    const trackingCorrelationId =
      typeof trackingMeta.correlationId === "string"
        ? trackingMeta.correlationId
        : undefined;

    const payload = {
      leadId: leadId || undefined,
      fullName: nombre.trim(),
      companyName: empresa.trim(),
      email: normalizedEmail,
      serviceInterest: selectedServiceNames,
      source: "landing_quote_estimator",
      utm: trackingUtm || utmData || undefined,
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
      mode: input.mode,
      feedback: input.feedbackText || "",
      correlationId: trackingCorrelationId || correlationId,
      idempotencyKey,
      transcription: `
        SOLICITUD DE COTIZACION - JS SOLUTIONS
        --------------------------------------
        CLIENTE: ${nombre.trim()}
        EMPRESA: ${empresa.trim()}
        SECTOR: ${sector.toUpperCase()}
        SERVICIOS: ${selectedServiceNames}
        COMPLEJIDAD: ${complexity.toUpperCase()}
        INVERSION ESTIMADA: $${estimatedRange.min.toLocaleString()} - $${estimatedRange.max.toLocaleString()} COP

        REQUERIMIENTOS DETALLADOS:
        ${detalles.trim() || "No se proporcionaron detalles adicionales."}
      `.trim(),
    };

    const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/v1/public/quotes/estimate`;

    try {
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

      if (nextLeadId) {
        persistLeadId(nextLeadId);
      }

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

      setQuoteId(nextQuoteId);
      setPreviewPdfUrl(processedPdfUrl);

      if (input.mode === "preview") {
        setShowModal(true);
        setStatus("idle");
        setFormMessage("Previsualización lista. Revisa y decide el siguiente paso.");
      } else {
        setStatus("success");
        setFormMessage("Propuesta enviada. Te contactaremos para continuar.");
      }

      trackQuoteEvent("quote_submit_success", {
        mode: input.mode,
        leadId: nextLeadId || leadId || "new",
        correlationId,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar la solicitud de cotización.";

      setStatus("error");
      setErrorMessage(message);
      setFormMessage("No pudimos procesar la solicitud. Intenta de nuevo.");

      trackQuoteEvent("quote_submit_error", {
        mode: input.mode,
        correlationId,
        durationMs,
        error: message,
      });
    }
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    await submitEstimate({ mode: "preview" });
  };

  const handleAprobar = async () => {
    await submitEstimate({ mode: "send" });
    closeModal();
  };

  const handleCorregir = async () => {
    if (!feedback.trim()) {
      setFormMessage("Describe el ajuste para regenerar la propuesta.");
      return;
    }

    await submitEstimate({
      mode: "preview",
      feedbackText: feedback.trim(),
    });
    setFeedback("");
    setIsCorrecting(false);
  };

  return {
    SERVICES,
    selectedServices,
    complexity,
    sector,
    nombre,
    empresa,
    email,
    detalles,
    status,
    errorMessage,
    formMessage,
    showModal,
    previewPdfUrl,
    quoteId,
    feedback,
    isCorrecting,
    estimatedRange,
    setComplexity,
    setSector,
    setNombre,
    setEmpresa,
    setEmail,
    setDetalles,
    setStatus,
    setFeedback,
    setIsCorrecting,
    handleServiceToggle,
    handleSubmit,
    handleAprobar,
    handleCorregir,
    closeModal,
  };
}
