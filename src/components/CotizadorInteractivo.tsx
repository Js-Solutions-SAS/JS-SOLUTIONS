import React, { useState, useMemo, useEffect } from "react";

const SERVICES = [
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
];

export default function CotizadorInteractivo({
  webhookUrl,
}: {
  webhookUrl: string;
}) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<"baja" | "media" | "alta">(
    "media",
  );
  const [sector, setSector] = useState<"pyme" | "publico">("pyme");

  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [detalles, setDetalles] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Debug timing
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleServiceToggle = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const estimatedRange = useMemo(() => {
    if (selectedServices.length === 0) return { min: 0, max: 0 };
    let min = 0;
    let max = 0;
    selectedServices.forEach((srvId) => {
      const srv = SERVICES.find((s) => s.id === srvId);
      if (srv) {
        if (complexity === "baja") {
          min += srv.prices.baja;
          max += srv.prices.media;
        } else if (complexity === "media") {
          min += srv.prices.media;
          max += (srv.prices.media + srv.prices.alta) / 2;
        } else {
          min += srv.prices.alta;
          max += srv.prices.alta * 1.5;
        }
      }
    });
    if (sector === "publico") {
      min *= 1.2;
      max *= 1.3;
    }
    return { min, max };
  }, [selectedServices, complexity, sector]);

  // ELIMINAMOS EL TIMEOUT INTERNO PARA PROBAR CONEXIÓN PURA
  const handleSubmit = async (
    e?: React.FormEvent,
    actionOverride?: string,
    feedbackText?: string,
  ) => {
    if (e) e.preventDefault();

    console.log("🚀 [Cotizador] Click detectado. Iniciando proceso...");

    if (selectedServices.length === 0) {
      alert("Selecciona al menos un servicio.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    const start = Date.now();
    setStartTime(start);

    const selectedServiceNames = selectedServices
      .map((id) => SERVICES.find((s) => s.id === id)?.name)
      .join(", ");

    const payload = {
      action: actionOverride || "preview",
      transcripcion: `
        SOLICITUD DE COTIZACIÓN - JS SOLUTIONS
        --------------------------------------
        CLIENTE: ${nombre}
        EMPRESA: ${empresa}
        SECTOR: ${sector.toUpperCase()}
        SERVICIOS: ${selectedServiceNames}
        COMPLEJIDAD: ${complexity.toUpperCase()}
        INVERSIÓN ESTIMADA: $${estimatedRange.min.toLocaleString()} - $${estimatedRange.max.toLocaleString()} COP
        
        REQUERIMIENTOS DETALLADOS:
        ${detalles || "No se proporcionaron detalles adicionales."}
      `.trim(),
      datos_cliente: {
        nombre,
        empresa,
        email,
        sector,
      },
      servicios: selectedServices,
      rango_inversion: estimatedRange,
      id: quoteId || `JS-${Date.now()}`,
      feedback: feedbackText || "",
    };

    // INTENTAMOS CON AMBAS URLS SI UNA FALLA
    const primaryUrl =
      webhookUrl ||
      "https://agencia-n8n.reuctr.easypanel.host/webhook/cotizador_js_solutions";

    console.log("📤 [Cotizador] Enviando a (Directo):", primaryUrl);

    try {
      const response = await fetch(primaryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(
        `📥 [Cotizador] Status: ${response.status} (${Date.now() - start}ms)`,
      );

      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: El servidor de n8n no procesó la solicitud.`,
        );
      }

      // Leemos el texto primero para verificar si está vacío
      const responseText = await response.text();
      let result = null;

      if (responseText) {
        try {
          result = JSON.parse(responseText);
          console.log("✨ [Cotizador] Respuesta JSON:", result);
        } catch (e) {
          console.warn(
            "⚠️ [Cotizador] La respuesta no es un JSON válido, pero el status es OK.",
          );
        }
      }

      const isPreview = payload.action === "preview";
      const urlFromN8n = result?.pdfUrl || result?.driveUrl;

      if (urlFromN8n) {
        // Transformar link de Drive para que sea visible en iframe (/view -> /preview)
        let processedUrl = urlFromN8n;
        if (processedUrl.includes("drive.google.com")) {
          processedUrl = processedUrl.replace(/\/view(\?.*)?$/, "/preview");
        }

        setPreviewPdfUrl(processedUrl);
        setQuoteId(result.id || `JS-${Date.now()}`);
        setShowModal(true);
        setStatus("idle");
      } else if (isPreview) {
        // Si no hay URL pero es preview, abrimos modal con aviso
        setPreviewPdfUrl("");
        setQuoteId(`TEST-${Date.now()}`);
        setShowModal(true);
        setStatus("idle");
      } else {
        setStatus("success");
      }
    } catch (err: any) {
      const duration = Date.now() - start;
      console.error(`💥 [Cotizador] Error tras ${duration}ms:`, err);

      setStatus("error");

      if (err.name === "AbortError" || err.message.includes("aborted")) {
        setErrorMessage(
          "La conexión fue cerrada prematuramente. Esto suele ser un error de n8n (Workflow no activo o error de memoria).",
        );
      } else {
        setErrorMessage(
          `No se pudo conectar con n8n (${duration}ms). \n\n` +
            "Causas posibles:\n" +
            "1. El Workflow en n8n no está en modo 'Active'.\n" +
            "2. n8n tiene el CORS deshabilitado.\n" +
            "3. Estás usando la URL de producción con un flujo de Test.",
        );
      }
    }
  };

  const handleAprobar = () => {
    handleSubmit(undefined, "aprobar");
    setShowModal(false);
  };

  const handleCorregir = () => {
    if (!feedback) return;
    handleSubmit(undefined, "corregir", feedback);
    setIsCorrecting(false);
    setFeedback("");
    setShowModal(false);
  };

  if (status === "success") {
    return (
      <div className="text-center py-20 bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-800 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-4xl mb-8">
          ✅
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
          ¡Propuesta Procesada!
        </h2>
        <p className="text-zinc-500 mb-10">
          Revisa tu canal de contacto para los siguientes pasos.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-all"
        >
          INICIAR OTRO
        </button>
      </div>
    );
  }

  return (
    <div className="relative group/main">
      <div className="space-y-10 bg-white dark:bg-zinc-900 p-10 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 transition-all">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
            Cotizador
            <br />
            <span className="text-zinc-300 dark:text-zinc-700 not-italic">
              INTELIGENTE
            </span>
          </h2>
        </div>

        {status === "error" && (
          <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 text-[11px] font-bold whitespace-pre-line leading-relaxed">
            ⚠️ ERROR DE CONEXIÓN
            <br />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* SECTOR */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              01 / Entidad
            </h3>
            <div className="flex gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl">
              {["pyme", "publico"].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSector(s as any)}
                  className={`flex-1 py-4 text-[11px] font-black rounded-xl transition-all ${sector === s ? "bg-white dark:bg-zinc-700 shadow-xl text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SERVICIOS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              02 / Soluciones
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {SERVICES.map((srv) => (
                <button
                  type="button"
                  key={srv.id}
                  onClick={() => handleServiceToggle(srv.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedServices.includes(srv.id) ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/50" : "border-transparent bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100"}`}
                >
                  <span
                    className={`font-black text-[11px] uppercase tracking-wider ${selectedServices.includes(srv.id) ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}
                  >
                    {srv.name}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedServices.includes(srv.id) ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100" : "border-zinc-100 dark:border-zinc-800"}`}
                  >
                    {selectedServices.includes(srv.id) && (
                      <span className="text-xs font-black text-white dark:text-black">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ESCALA */}
          <div
            className={`space-y-4 transition-all ${selectedServices.length === 0 ? "opacity-20 blur-sm pointer-events-none" : "opacity-100"}`}
          >
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              03 / Escala
            </h3>
            <div className="flex gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl">
              {["baja", "media", "alta"].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setComplexity(lvl as any)}
                  className={`flex-1 py-3 text-[10px] font-black rounded-xl capitalize transition-all ${complexity === lvl ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl" : "text-zinc-400 hover:text-zinc-800"}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* DATOS */}
          <div
            className={`space-y-6 transition-all ${selectedServices.length === 0 ? "opacity-20 blur-sm pointer-events-none" : "opacity-100"}`}
          >
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              04 / Información
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black uppercase tracking-widest placeholder:text-zinc-300"
                placeholder="NOMBRE COMPLETO"
              />
              <input
                type="text"
                required
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black uppercase tracking-widest placeholder:text-zinc-300"
                placeholder="EMPRESA"
              />
              <textarea
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
                rows={3}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black tracking-widest resize-none placeholder:text-zinc-300"
                placeholder="CUÉNTANOS TU NECESIDAD..."
              ></textarea>
            </div>
          </div>

          <div
            className={`p-10 bg-zinc-950 rounded-[3rem] text-center transition-all ${selectedServices.length === 0 ? "opacity-20 scale-95" : "opacity-100 shadow-2xl translate-y-3"}`}
          >
            <div className="text-4xl md:text-5xl font-black text-white mb-10 flex items-center justify-center gap-2 tracking-tighter">
              <span className="text-xl text-zinc-600 font-normal">$</span>
              {estimatedRange.min.toLocaleString()}
              <span className="text-xl text-zinc-600 font-normal">-</span>
              {estimatedRange.max.toLocaleString()}
              <span className="text-[10px] text-zinc-500 font-black ml-3">
                COP
              </span>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || selectedServices.length === 0}
              className="w-full py-6 px-10 bg-white text-black font-black rounded-2xl hover:scale-[1.03] active:scale-95 disabled:opacity-30 transition-all shadow-2xl uppercase tracking-widest text-[11px]"
            >
              {status === "loading"
                ? "CONECTANDO CON IA..."
                : "GENERAR DIAGNÓSTICO ESTRATÉGICO"}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE PREVIEW */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-6xl h-full max-h-[85vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <div className="px-12 py-10 flex justify-between items-center border-b dark:border-zinc-900">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">
                Preview
                <span className="text-zinc-300 dark:text-zinc-700 not-italic ml-2">
                  DOCUMENT
                </span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl font-light"
              >
                ✕
              </button>
            </div>
            {/* Content (PDF o Fallback) */}
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-6 md:p-12 relative overflow-hidden">
              <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center">
                {previewPdfUrl ? (
                  <iframe
                    src={previewPdfUrl}
                    className="w-full h-full border-none"
                    title="Cotización Final"
                  />
                ) : (
                  <div className="text-center p-10 space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full mx-auto flex items-center justify-center text-3xl animate-pulse">
                      📄
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase italic">
                        Esperando Documento
                      </h4>
                      <p className="text-xs text-zinc-400 font-bold leading-relaxed">
                        El Webhook respondió exitosamente (200 OK), pero no se
                        detectó un campo{" "}
                        <code className="text-zinc-600">pdfUrl</code> en el JSON
                        de respuesta.
                      </p>
                    </div>
                    <div className="pt-4 border-t dark:border-zinc-800 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-left space-y-2">
                      <p className="text-zinc-700 dark:text-zinc-300">
                        Checklist para n8n:
                      </p>
                      <p>1. ¿Usaste un nodo "Respond to Webhook"?</p>
                      <p>2. ¿El JSON de salida incluye 'pdfUrl'?</p>
                      <p>3. ¿El flujo terminó de ejecutarse?</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-12 py-10 bg-white dark:bg-zinc-950 border-t dark:border-zinc-900 flex flex-col md:flex-row gap-6">
              <button
                onClick={() => setIsCorrecting(true)}
                className="flex-1 py-5 border-2 border-zinc-100 dark:border-zinc-800 text-zinc-400 font-black rounded-2xl text-[10px] uppercase tracking-widest"
              >
                🔄 AJUSTAR
              </button>
              <button
                onClick={handleAprobar}
                className="flex-[2] py-5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-black rounded-2xl shadow-2xl text-[11px] uppercase tracking-widest italic"
              >
                APROBAR PROYECTO →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
