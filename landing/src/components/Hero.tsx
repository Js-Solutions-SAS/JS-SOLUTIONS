import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import DataFlowBackground from "./DataFlowBackground";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <DataFlowBackground />

      {/* Decorative Glows */}
      <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 py-1 px-3 border border-brand-gold/30 rounded-full bg-brand-gold/5 text-brand-gold text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
            Next-Gen Automation
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold font-heading text-white leading-tight mb-8 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Inteligencia Artificial <br />
          <span className="text-transparent bg-clip-text bg-gold-gradient filter drop-shadow-lg">
            Para Empresas Reales
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-brand-off-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          No vendemos humo. Construimos sistemas inteligentes que automatizan
          tus procesos, reducen costos operativos y escalan tus ventas.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a
            href="#contact"
            className="group relative px-8 py-4 bg-gold-gradient text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span className="relative z-10 flex items-center gap-2">
              Diagnóstico Gratuito
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>
          <a
            href="#services"
            className="px-8 py-4 border border-white/10 hover:border-brand-gold/50 text-white font-medium text-lg rounded-full bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-brand-gold"
          >
            Explorar Servicios
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/30">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          ></path>
        </svg>
      </div>
    </section>
  );
}
