import React, { useEffect, useRef } from "react";

import { useQuoteEstimator } from "@/hooks/useQuoteEstimator";

export default function CotizadorInteractivo({
  apiBaseUrl,
}: {
  apiBaseUrl: string;
}) {
  const {
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
  } = useQuoteEstimator(apiBaseUrl);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showModal) {
      return;
    }

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showModal, closeModal]);

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
          <div
            className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 text-[11px] font-bold whitespace-pre-line leading-relaxed"
            role="alert"
          >
            ⚠️ ERROR DE CONEXION
            <br />
            {errorMessage}
          </div>
        )}

        {formMessage && status !== "error" && (
          <div
            className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 text-xs font-semibold"
            role="status"
            aria-live="polite"
          >
            {formMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              01 / Entidad
            </h3>
            <div className="flex gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl">
              {["pyme", "publico"].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSector(value as "pyme" | "publico")}
                  aria-pressed={sector === value}
                  className={`flex-1 py-4 text-[11px] font-black rounded-xl transition-all ${
                    sector === value
                      ? "bg-white dark:bg-zinc-700 shadow-xl text-zinc-900 dark:text-white"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              02 / Soluciones
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {SERVICES.map((service) => {
                const selected = selectedServices.includes(service.id);
                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    aria-pressed={selected}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      selected
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/50"
                        : "border-transparent bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100"
                    }`}
                  >
                    <span
                      className={`font-black text-[11px] uppercase tracking-wider ${
                        selected
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-400"
                      }`}
                    >
                      {service.name}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected
                          ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                          : "border-zinc-100 dark:border-zinc-800"
                      }`}
                    >
                      {selected && (
                        <span className="text-xs font-black text-white dark:text-black">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`space-y-4 transition-all ${
              selectedServices.length === 0
                ? "opacity-20 blur-sm pointer-events-none"
                : "opacity-100"
            }`}
          >
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              03 / Escala
            </h3>
            <div className="flex gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl">
              {["baja", "media", "alta"].map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setComplexity(level as "baja" | "media" | "alta")}
                  aria-pressed={complexity === level}
                  className={`flex-1 py-3 text-[10px] font-black rounded-xl capitalize transition-all ${
                    complexity === level
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl"
                      : "text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`space-y-6 transition-all ${
              selectedServices.length === 0
                ? "opacity-20 blur-sm pointer-events-none"
                : "opacity-100"
            }`}
          >
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">
              04 / Informacion
            </h3>
            <div className="space-y-3">
              <label htmlFor="quote-full-name" className="sr-only">
                Nombre completo
              </label>
              <input
                id="quote-full-name"
                type="text"
                required
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black uppercase tracking-widest placeholder:text-zinc-300"
                placeholder="NOMBRE COMPLETO"
                autoComplete="name"
              />

              <label htmlFor="quote-company" className="sr-only">
                Empresa
              </label>
              <input
                id="quote-company"
                type="text"
                required
                value={empresa}
                onChange={(event) => setEmpresa(event.target.value)}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black uppercase tracking-widest placeholder:text-zinc-300"
                placeholder="EMPRESA"
                autoComplete="organization"
              />

              <label htmlFor="quote-email" className="sr-only">
                Correo electronico
              </label>
              <input
                id="quote-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black tracking-widest placeholder:text-zinc-300"
                placeholder="EMAIL DE CONTACTO"
                autoComplete="email"
              />

              <label htmlFor="quote-details" className="sr-only">
                Necesidad principal
              </label>
              <textarea
                id="quote-details"
                value={detalles}
                onChange={(event) => setDetalles(event.target.value)}
                rows={3}
                className="w-full px-8 py-5 border-2 border-transparent rounded-2xl focus:border-zinc-900 dark:focus:border-zinc-100 outline-none bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-white transition-all text-xs font-black tracking-widest resize-none placeholder:text-zinc-300"
                placeholder="CUENTANOS TU NECESIDAD..."
              />
            </div>
          </div>

          <div
            className={`p-10 bg-zinc-950 rounded-[3rem] text-center transition-all ${
              selectedServices.length === 0
                ? "opacity-20 scale-95"
                : "opacity-100 shadow-2xl translate-y-3"
            }`}
          >
            <div className="text-4xl md:text-5xl font-black text-white mb-10 flex items-center justify-center gap-2 tracking-tighter">
              <span className="text-xl text-zinc-600 font-normal">$</span>
              {estimatedRange.min.toLocaleString()}
              <span className="text-xl text-zinc-600 font-normal">-</span>
              {estimatedRange.max.toLocaleString()}
              <span className="text-[10px] text-zinc-500 font-black ml-3">COP</span>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || selectedServices.length === 0}
              className="w-full py-6 px-10 bg-white text-black font-black rounded-2xl hover:scale-[1.03] active:scale-95 disabled:opacity-30 transition-all shadow-2xl uppercase tracking-widest text-[11px]"
            >
              {status === "loading"
                ? "CONECTANDO CON IA..."
                : "GENERAR DIAGNOSTICO ESTRATEGICO"}
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-modal-title"
            className="bg-white dark:bg-zinc-950 w-full max-w-6xl h-full max-h-[85vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-100 dark:border-zinc-800"
          >
            <div className="px-12 py-10 flex justify-between items-center border-b dark:border-zinc-900">
              <h3
                id="quote-modal-title"
                className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic"
              >
                Preview
                <span className="text-zinc-300 dark:text-zinc-700 not-italic ml-2">
                  DOCUMENT
                </span>
              </h3>
              <button
                ref={closeButtonRef}
                onClick={closeModal}
                className="text-2xl font-light"
                aria-label="Cerrar previsualizacion"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-6 md:p-12 relative overflow-hidden">
              <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center">
                {previewPdfUrl ? (
                  <iframe
                    src={previewPdfUrl}
                    className="w-full h-full border-none"
                    title="Cotizacion Final"
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
                        El flujo respondio sin URL de PDF. Revisa la salida del
                        workflow y vuelve a generar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-12 py-8 bg-white dark:bg-zinc-950 border-t dark:border-zinc-900 space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                Quote ID: {quoteId}
              </p>

              {isCorrecting ? (
                <div className="space-y-4">
                  <label htmlFor="quote-feedback" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Ajustes solicitados
                  </label>
                  <textarea
                    id="quote-feedback"
                    rows={3}
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="w-full px-6 py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                    placeholder="Describe cambios de alcance, tiempos o entregables..."
                  />
                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      onClick={() => setIsCorrecting(false)}
                      className="flex-1 py-4 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-500 font-black rounded-2xl text-[10px] uppercase tracking-widest"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCorregir}
                      className="flex-[2] py-4 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest"
                    >
                      Regenerar Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6">
                  <button
                    onClick={() => setIsCorrecting(true)}
                    className="flex-1 py-5 border-2 border-zinc-100 dark:border-zinc-800 text-zinc-400 font-black rounded-2xl text-[10px] uppercase tracking-widest"
                  >
                    AJUSTAR
                  </button>
                  <button
                    onClick={handleAprobar}
                    className="flex-[2] py-5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-black rounded-2xl shadow-2xl text-[11px] uppercase tracking-widest italic"
                  >
                    APROBAR PROYECTO
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
