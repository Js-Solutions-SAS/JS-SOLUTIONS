import React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Workflow,
  BarChart3,
  ArrowUpRight,
  Cpu,
  Database,
  Zap,
} from "lucide-react";

const services = [
  {
    title: "Chatbots IA",
    description:
      "Asistentes inteligentes que entienden el contexto, no solo palabras clave. Atención 24/7 que se siente humana.",
    icon: <Bot className="w-8 h-8 text-brand-gold" />,
    colSpan: "col-span-12 md:col-span-7",
    height: "min-h-[300px]",
  },
  {
    title: "Automatización",
    description:
      "Workflows que conectan todo tu ecosistema digital. De leads a ventas sin intervención manual.",
    icon: <Workflow className="w-8 h-8 text-brand-gold" />,
    colSpan: "col-span-12 md:col-span-5",
    height: "min-h-[300px]",
  },
  {
    title: "Data Analytics",
    description:
      "Paneles de control en tiempo real y predicción de tendencias para tomar decisiones basadas en datos reales.",
    icon: <BarChart3 className="w-8 h-8 text-brand-gold" />,
    colSpan: "col-span-12 md:col-span-4",
    height: "min-h-[250px]",
  },
  {
    title: "Consultoría IA",
    description:
      "Auditoría de procesos y roadmap de implementación de IA para tu empresa.",
    icon: <Cpu className="w-8 h-8 text-brand-gold" />,
    colSpan: "col-span-12 md:col-span-4",
    height: "min-h-[250px]",
  },
  {
    title: "Sistemas RAG",
    description:
      "Entrena a la IA con los datos de tu propia empresa para respuestas precisas.",
    icon: <Database className="w-8 h-8 text-brand-gold" />,
    colSpan: "col-span-12 md:col-span-4",
    height: "min-h-[250px]",
  },
];

export default function ServicesBento() {
  return (
    <section
      id="services"
      data-track-section="services"
      className="py-24 relative bg-brand-charcoal/30"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="text-brand-gold font-bold tracking-widest text-sm uppercase mb-2 block">
              Nuestros Servicios
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-white">
              Soluciones <br />
              <span className="text-brand-off-white/50">Escalables</span>
            </h2>
          </div>
          <p className="text-brand-off-white/70 max-w-md text-lg text-right md:text-left">
            Tecnología de punta adaptada a tus necesidades de negocio. Sin
            complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className={`${service.colSpan} ${service.height} group relative rounded-3xl p-8 border border-white/5 bg-brand-black overflow-hidden hover:border-brand-gold/30 transition-all duration-500`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/5 w-fit rounded-2xl border border-white/10 group-hover:bg-brand-gold/10 group-hover:border-brand-gold/20 transition-colors duration-300">
                    {service.icon}
                  </div>
                  <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 text-brand-gold">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-gold transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-brand-off-white/60 leading-relaxed group-hover:text-brand-off-white/90 transition-colors">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
