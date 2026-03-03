"use client";

import React, { useState } from "react";

export default function BriefWizard({ token }: { token: string }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    objectives: [] as string[],
    urgency: "media",
    currentStack: "",
    designAssets: "none", // none, ideas, figma
    integrations: [] as string[],
    additionalNotes: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const objectivesOptions = [
    { id: "sales", label: "Aumentar Ventas / Leads" },
    { id: "automate", label: "Automatizar Procesos Internos" },
    { id: "app", label: "Crear una App a Medida" },
    { id: "ai", label: "Implementar Asistentes de IA" },
  ];

  const integrationsOptions = [
    { id: "crm", label: "CRM (Hubspot, Salesforce, etc.)" },
    { id: "payments", label: "Pagos (Stripe, Wompi, ePayco)" },
    { id: "erp", label: "ERP / Contabilidad" },
    { id: "sheets", label: "Google Sheets / Airtable" },
  ];

  const handleToggleObj = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.includes(id)
        ? prev.objectives.filter((o) => o !== id)
        : [...prev.objectives, id],
    }));
  };

  const handleToggleInt = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      integrations: prev.integrations.includes(id)
        ? prev.integrations.filter((i) => i !== id)
        : [...prev.integrations, id],
    }));
  };

  const handleSubmit = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/submit-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          technicalBrief: formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar el brief");
      }

      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al conectar con el servidor.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-2xl mx-auto p-12 bg-zinc-900 border border-zinc-800 rounded-[3rem] text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-gold rounded-full mx-auto flex items-center justify-center text-4xl mb-8">
          🚀
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
          ¡Brief Recibido!
        </h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Hemos recibido tus requerimientos de manera exitosa. Nuestro equipo de
          ingeniería analizará los detalles y preparará una cotización exacta
          para tu proyecto.
        </p>
        <a
          href={`/dashboard?token=${token}`}
          className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-xs font-black uppercase tracking-[0.24em] text-black transition hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
        >
          Ir al dashboard
        </a>
        <div className="inline-block px-4 py-2 bg-zinc-800 rounded-full text-xs font-bold text-zinc-500 font-mono">
          TOKEN: {token.substring(0, 8)}...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ProgressBar */}
      <div className="mb-10 flex gap-2">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${idx <= step ? "bg-brand-gold" : "bg-zinc-800"}`}
          />
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 md:p-12 shadow-2xl">
        {status === "error" && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-500 text-sm font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* --- STEP 0: BIENVENIDA --- */}
        {step === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 italic">
                Brief Técnico
              </h2>
              <p className="text-zinc-400 leading-relaxed max-w-xl mx-auto">
                Para entregarte una cotización precisa y un roadmap confiable,
                necesitamos conocer algunos detalles de tu infraestructura
                actual y requerimientos funcionales.
              </p>
            </div>

            <div className="pt-8 flex justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-white/20 transition-all"
              >
                Comenzar Diagnóstico
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 1: OBJETIVOS --- */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">
                Paso 01
              </h3>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                ¿Cuál es tu objetivo principal?
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                Selecciona todos los que apliquen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objectivesOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleToggleObj(opt.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    formData.objectives.includes(opt.id)
                      ? "border-brand-gold bg-brand-gold/10 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                  }`}
                >
                  <div className="font-bold text-sm">{opt.label}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-8">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-4 text-zinc-500 font-bold hover:text-white transition-colors text-sm"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={formData.objectives.length === 0}
                className="px-8 py-4 bg-brand-gold text-black font-black uppercase tracking-widest text-xs rounded-xl disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: STACK Y DISEÑO --- */}
        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">
                Paso 02
              </h3>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                Infraestructura & UI
              </h2>
            </div>

            {/* Current Stack */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                ¿Usas algún software actualmente? (Opcional)
              </label>
              <textarea
                value={formData.currentStack}
                onChange={(e) =>
                  setFormData({ ...formData, currentStack: e.target.value })
                }
                placeholder="Ej: Shopify, WordPress, usamos Excel para todo..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-sm text-white focus:outline-none focus:border-brand-gold resize-none"
                rows={3}
              />
            </div>

            {/* Design Status */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                ¿En qué estado está el diseño?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "none", label: "Solo Idea" },
                  { id: "ideas", label: "Tengo Referencias" },
                  { id: "figma", label: "Diseño Listo (Figma)" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() =>
                      setFormData({ ...formData, designAssets: opt.id })
                    }
                    className={`py-4 px-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                      formData.designAssets === opt.id
                        ? "border-brand-gold bg-brand-gold text-black"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 text-zinc-500 font-bold hover:text-white transition-colors text-sm"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-8 py-4 bg-brand-gold text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-105 transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: INTEGRACIONES Y TÉRMINO --- */}
        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-2">
                Paso 03
              </h3>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                Integraciones Críticas
              </h2>
            </div>

            {/* Integraciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrationsOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleToggleInt(opt.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    formData.integrations.includes(opt.id)
                      ? "border-brand-gold bg-brand-gold/10 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                  }`}
                >
                  <span className="font-bold text-xs uppercase tracking-wide">
                    {opt.label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded border flex items-center justify-center ${formData.integrations.includes(opt.id) ? "bg-brand-gold border-brand-gold" : "border-zinc-700"}`}
                  >
                    {formData.integrations.includes(opt.id) && (
                      <span className="text-black text-xs">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Comentarios Adicionales
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
                placeholder="Algún requerimiento especial de seguridad, servidor, etc..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-sm text-white focus:outline-none focus:border-brand-gold resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-8 border-t border-zinc-800">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 text-zinc-500 font-bold hover:text-white transition-colors text-sm"
                disabled={status === "loading"}
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={status === "loading"}
                className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10 flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                {status === "loading"
                  ? "Enviando..."
                  : "Enviar Brief a Ingeniería"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
