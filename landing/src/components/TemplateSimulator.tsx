import React, { useState } from "react";

interface TemplateSimulatorProps {
  verticalKey: string;
  defaultBusinessName: string;
}

const COLORS = [
  { name: "Dorado Premium", value: "#d4af37", class: "bg-[#d4af37]" },
  { name: "Verde Salud", value: "#10b981", class: "bg-[#10b981]" },
  { name: "Azul Técnico", value: "#0ea5e9", class: "bg-[#0ea5e9]" },
  { name: "Violeta Innovación", value: "#8b5cf6", class: "bg-[#8b5cf6]" },
  { name: "Rojo Fuego", value: "#f43f5e", class: "bg-[#f43f5e]" },
];

export default function TemplateSimulator({
  verticalKey,
  defaultBusinessName,
}: TemplateSimulatorProps) {
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [accentColor, setAccentColor] = useState("#d4af37");

  // Custom preview contents based on the vertical
  const getMockupContent = () => {
    switch (verticalKey) {
      case "restaurantes":
        return {
          eyebrow: "Sabor local y tradición",
          title: `El mejor menú de ${businessName || "tu restaurante"}`,
          desc: "Reserva tu mesa o pide a domicilio en segundos con un solo mensaje de WhatsApp.",
          cta: "Ver Menú y Reservar",
          whatsappPreview: `Hola ${businessName || "Restaurante"}, quiero ver el menú de hoy y reservar una mesa.`,
          bgImage: "url('/images/rubros/restaurantes.png')",
        };
      case "veterinarias":
        return {
          eyebrow: "Cuidado profesional para tu mascota",
          title: `Clínica Veterinaria ${businessName || "VetSalud"}`,
          desc: "Agenda consultas, vacunación y servicios de urgencia médica veterinaria por WhatsApp.",
          cta: "Agendar Cita Médica",
          whatsappPreview: `Hola ${businessName || "Veterinaria"}, quiero agendar una consulta médica para mi mascota.`,
          bgImage: "url('/images/rubros/veterinarias.png')",
        };
      case "oftalmologia":
        return {
          eyebrow: "Cuidado visual avanzado",
          title: `Centro Oftalmológico ${businessName || "Visión"}`,
          desc: "Exámenes de alta precisión, tratamientos oculares y agendamiento de citas médicas.",
          cta: "Agendar Examen de Ojos",
          whatsappPreview: `Hola ${businessName || "Oftalmología"}, me interesa cotizar y agendar un examen de diagnóstico visual.`,
          bgImage: "url('/images/rubros/oftalmologia.png')",
        };
      case "tiendas-celulares":
        return {
          eyebrow: "Equipos y tecnología al mejor precio",
          title: `${businessName || "Tu Tienda Celulares"} - Importaciones`,
          desc: "Compra smartphones de última generación, accesorios y solicita servicio técnico especializado.",
          cta: "Ver Catálogo en WhatsApp",
          whatsappPreview: `Hola ${businessName || "Tienda"}, me gustaría consultar disponibilidad y precio de un smartphone.`,
          bgImage: "url('/images/rubros/tiendas-celulares.png')",
        };
      case "marmolerias":
      default:
        return {
          eyebrow: "Diseños de lujo para tu hogar",
          title: `${businessName || "Marmolería Deluxe"} - Mesones y Acabados`,
          desc: "Diseñamos y fabricamos encimeras de cocina, baños y proyectos especiales en mármol y granito.",
          cta: "Cotizar Proyecto a Medida",
          whatsappPreview: `Hola ${businessName || "Marmolería"}, quiero solicitar una cotización para un mesón de cocina en mármol.`,
          bgImage: "url('/images/rubros/marmolerias.png')",
        };
    }
  };

  const content = getMockupContent();

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      {/* Control Panel */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-off-white/50">
            Nombre de tu Negocio
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
            placeholder="Escribe el nombre aquí..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-off-white/50">
            Color Corporativo
          </label>
          <div className="flex items-center gap-2.5 h-full">
            {COLORS.map((col) => (
              <button
                key={col.value}
                onClick={() => setAccentColor(col.value)}
                className={`size-6 rounded-full transition-transform hover:scale-110 ${col.class} ${
                  accentColor === col.value
                    ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                    : "opacity-80"
                }`}
                title={col.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Simulator Mockup Frame */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-brand-black shadow-inner">
        {/* Browser Header Bar */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#f87171]/80"></span>
            <span className="size-2.5 rounded-full bg-[#facc15]/80"></span>
            <span className="size-2.5 rounded-full bg-[#4ade80]/80"></span>
          </div>
          <div className="mx-auto flex h-5 w-1/2 max-w-xs items-center justify-center rounded bg-black/40 px-3 text-[10px] text-brand-off-white/35 font-mono">
            {businessName ? `${businessName.toLowerCase().replace(/\s+/g, "")}.com.co` : "tu-web.com"}
          </div>
        </div>

        {/* Live Mockup Body */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-cover bg-center" style={{ backgroundImage: content.bgImage }}>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70 bg-gradient-to-r from-black via-black/45 to-transparent"></div>

          {/* Landing Mockup Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 py-4 max-w-[65%]">
            <span
              className="text-[9px] font-black uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              {content.eyebrow}
            </span>
            <h4 className="mt-2 text-balance text-lg font-bold leading-tight text-white md:text-xl">
              {content.title}
            </h4>
            <p className="mt-2 text-[10px] leading-relaxed text-brand-off-white/72">
              {content.desc}
            </p>
            <div className="mt-4 flex">
              <span
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {content.cta}
              </span>
            </div>
          </div>

          {/* Floating WhatsApp CTA Simulator */}
          <div className="absolute bottom-3 right-3 flex items-center justify-center rounded-full bg-[#25d366] p-2 text-white shadow-lg animate-bounce">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.488-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Simulated Incoming WhatsApp Notification Card */}
      <div className="rounded-xl border border-[#25d366]/20 bg-[#25d366]/5 p-3.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#25d366]">
            Mensaje calificado que te llegará a WhatsApp
          </span>
          <span className="size-2 rounded-full bg-[#25d366] animate-pulse"></span>
        </div>
        <div className="rounded-lg bg-black/60 p-2.5 font-mono text-[11px] text-white leading-relaxed border border-white/5">
          {content.whatsappPreview}
        </div>
      </div>
    </div>
  );
}
