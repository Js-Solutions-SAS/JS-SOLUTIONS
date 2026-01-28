import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Landmark, ChevronRight, CheckCircle2 } from "lucide-react";

const content = {
  pymes: {
    title: "Para PyMES y Empresas Privadas",
    description:
      "Automatización ágil para escalar ventas y operaciones sin aumentar la plantilla. Enfócate en crecer, nosotros nos encargamos de la repetición.",
    features: [
      "Chatbots de ventas y soporte 24/7",
      "Automatización de facturación y cobros",
      "Lead scoring y nutrición automática de clientes",
      "Integración con CRM y WhatsApp Business",
    ],
    icon: "business",
  },
  publico: {
    title: "Para Sector Público",
    description:
      "Modernización administrativa, transparencia y atención ciudadana eficiente. Tecnología para servir mejor.",
    features: [
      "Ventanilla única virtual con IA",
      "Procesamiento masivo de documentos y expedientes",
      "Análisis de datos para políticas públicas",
      "Sistemas de turnos y citas inteligentes",
    ],
    icon: "government",
  },
};

export default function SegmentToggle() {
  const [active, setActive] = useState<"pymes" | "publico">("pymes");

  return (
    <section className="py-24 relative overflow-hidden bg-brand-black">
      {/* Background glow effect */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[120px] transition-all duration-1000 opacity-20 ${
          active === "pymes" ? "bg-brand-gold" : "bg-slate-700"
        }`}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-brand-off-white/60 text-sm tracking-widest uppercase font-bold mb-4 block">
            Adaptabilidad Total
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-10">
            Soluciones para cada <span className="text-brand-gold">Sector</span>
          </h2>

          <div className="inline-flex p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActive("pymes")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                active === "pymes"
                  ? "bg-brand-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  : "text-white hover:text-brand-gold"
              }`}
            >
              Sector Privado
            </button>
            <button
              onClick={() => setActive("publico")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                active === "publico"
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  : "text-white hover:text-white/80"
              }`}
            >
              Sector Público
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-brand-charcoal/80 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div
                  className={`p-8 rounded-3xl border border-white/10 shadow-lg transform -rotate-3 ${
                    active === "pymes"
                      ? "bg-brand-black text-brand-gold"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  {active === "pymes" ? (
                    <Building2 className="w-20 h-20" />
                  ) : (
                    <Landmark className="w-20 h-20" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {content[active].title}
                  </h3>
                  <p className="text-brand-off-white/80 text-lg mb-8 leading-relaxed">
                    {content[active].description}
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    {content[active].features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-brand-off-white/90"
                      >
                        <div
                          className={`mt-1 p-0.5 rounded-full ${
                            active === "pymes"
                              ? "bg-brand-gold text-black"
                              : "bg-white text-black"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs text-white/40 font-mono">
                      {"// "}
                      {active === "pymes"
                        ? "OPTIMIZACIÓN_COMERCIAL"
                        : "GESTIÓN_GUBERNAMENTAL"}
                    </div>
                    <a
                      href="#contact"
                      className={`inline-flex items-center gap-2 font-bold transition-colors group ${
                        active === "pymes"
                          ? "text-brand-gold hover:text-white"
                          : "text-white hover:text-brand-gold"
                      }`}
                    >
                      Agendar Asesoría
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
