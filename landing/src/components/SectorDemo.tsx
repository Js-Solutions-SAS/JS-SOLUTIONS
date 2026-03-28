import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { createWhatsAppHref, type SectorKey } from "@/lib/whatsapp";
import type { DemoStep } from "@/data/sector-content";

interface SectorDemoProps {
  sector: SectorKey;
  name: string;
  description: string;
  ctaLabel: string;
  ctaMessage: string;
  steps: DemoStep[];
}

function track(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("js_tracking", {
      detail: {
        event: eventName,
        source: "sector_demo",
        ...payload,
      },
    }),
  );
}

export default function SectorDemo({
  sector,
  name,
  description,
  ctaLabel,
  ctaMessage,
  steps,
}: SectorDemoProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [autoplayStarted, setAutoplayStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenStepsRef = useRef<Set<string>>(new Set());

  const currentStep = steps[activeStep];
  const ctaHref = useMemo(() => createWhatsAppHref(ctaMessage), [ctaMessage]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            track("demo_view", {
              sector,
              demo_type: name,
            });
          }
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [name, sector]);

  useEffect(() => {
    if (!isVisible || steps.length <= 1) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAutoplayStarted(true);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [isVisible, steps.length]);

  useEffect(() => {
    if (!autoplayStarted || steps.length <= 1) {
      return;
    }

    track("demo_autoplay_start", {
      sector,
      demo_type: name,
    });

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, [autoplayStarted, name, sector, steps.length]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const stepKey = `${sector}:${currentStep.id}`;
    if (seenStepsRef.current.has(stepKey)) {
      return;
    }

    seenStepsRef.current.add(stepKey);
    track("demo_step_view", {
      sector,
      demo_type: name,
      step_id: currentStep.id,
      step_index: activeStep + 1,
    });
  }, [activeStep, currentStep.id, isVisible, name, sector]);

  const handleDemoCta = () => {
    track("demo_cta_click", {
      sector,
      demo_type: name,
      step_id: currentStep.id,
      label: ctaLabel,
    });
    track("sector_whatsapp_click", {
      sector,
      location: "demo",
      label: ctaLabel,
      href: ctaHref,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f0f11]/88 p-5 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-md md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_32%),radial-gradient(circle_at_18%_18%,rgba(96,165,250,0.12),transparent_28%)] opacity-80" />
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-gold/75">
            {name}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-off-white/72">
            {description}
          </p>
        </div>
        <div className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-off-white/42 md:block">
          Demo simulada
        </div>
      </div>

      <div className="relative mt-5 grid gap-5 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            return (
              <motion.button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(index)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full min-h-[102px] rounded-2xl border px-4 py-3 text-left transition-[border-color,background-color,color,transform] duration-300 ${
                  isActive
                    ? "border-brand-gold/50 bg-brand-gold/10 text-white"
                    : "border-white/8 bg-white/[0.02] text-brand-off-white/66 hover:border-white/15 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.28em]">
                    {step.label}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-brand-gold" : "bg-white/15"
                    }`}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug">
                  {step.title}
                </p>
              </motion.button>
            );
          })}
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-brand-black">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-off-white/42">
                {currentStep.eyebrow}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.985 }}
                transition={{ duration: 0.34, ease: "easeOut" }}
                className="grid min-h-[520px] gap-4 px-4 py-5 2xl:min-h-[350px] 2xl:grid-cols-[1.04fr_0.96fr]"
              >
                <div className="rounded-[1.4rem] border border-white/10 bg-[#131316] p-4 2xl:h-full">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-off-white/45">
                    Conversacion
                  </p>
                  <div className="mt-4 flex min-h-[252px] flex-col gap-3 text-sm leading-relaxed">
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05, duration: 0.28 }}
                      className="self-start rounded-[1.25rem] rounded-bl-md bg-white/6 px-4 py-3 text-brand-off-white/88"
                    >
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-brand-off-white/42">
                        {currentStep.customerLabel}
                      </p>
                      {currentStep.customerMessage}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.14, duration: 0.28 }}
                      className="self-end rounded-[1.25rem] rounded-br-md bg-brand-gold/14 px-4 py-3 text-white"
                    >
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold">
                        {currentStep.assistantLabel}
                      </p>
                      {currentStep.assistantMessage}
                    </motion.div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-[#151518] p-4 2xl:h-full">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-off-white/45">
                    Operacion por debajo
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.28 }}
                    className="mt-4 min-h-[128px] rounded-[1.25rem] border border-brand-gold/18 bg-brand-gold/8 p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-gold">
                      {currentStep.automationLabel}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-off-white/82">
                      {currentStep.automationDetail}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16, duration: 0.28 }}
                    className="mt-4 min-h-[126px] rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-off-white/45">
                      Valor de negocio
                    </p>
                    <p className="mt-2 text-base font-semibold leading-snug text-white">
                      {currentStep.businessValue}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-gold/72">
                Siguiente paso
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-off-white/70">
                Si este flujo se parece a tu operacion, el siguiente paso es ver
                como se adapta a tus reglas, tu equipo y tus canales reales.
              </p>
            </div>
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDemoCta}
              className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-6 py-3 text-center text-sm font-black uppercase tracking-[0.15em] text-black transition-transform duration-300 hover:scale-[1.02]"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
