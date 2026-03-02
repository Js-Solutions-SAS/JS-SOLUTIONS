"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { createQuoteAction } from "@/app/cotizaciones/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface QuoteIntakeFormProps {
  enabled: boolean;
}

type Complexity = "baja" | "media" | "alta";
type Sector = "pyme" | "publico";

interface QuoteDraft {
  nombre: string;
  empresa: string;
  email: string;
  detalles: string;
}

const INITIAL_DRAFT: QuoteDraft = {
  nombre: "",
  empresa: "",
  email: "",
  detalles: "",
};

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

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")} COP`;
}

function inferIndustryFromSector(sector: Sector): string {
  return sector === "publico" ? "Sector Público" : "General";
}

export function QuoteIntakeForm({ enabled }: QuoteIntakeFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<Complexity>("media");
  const [sector, setSector] = useState<Sector>("pyme");
  const [isPending, startTransition] = useTransition();

  const estimatedRange = useMemo(() => {
    if (selectedServices.length === 0) {
      return { min: 0, max: 0 };
    }

    let min = 0;
    let max = 0;

    selectedServices.forEach((serviceId) => {
      const service = SERVICES.find((item) => item.id === serviceId);
      if (!service) {
        return;
      }

      if (complexity === "baja") {
        min += service.prices.baja;
        max += service.prices.media;
        return;
      }

      if (complexity === "media") {
        min += service.prices.media;
        max += (service.prices.media + service.prices.alta) / 2;
        return;
      }

      min += service.prices.alta;
      max += service.prices.alta * 1.5;
    });

    if (sector === "publico") {
      min *= 1.2;
      max *= 1.3;
    }

    return { min, max };
  }, [complexity, sector, selectedServices]);

  const estimatedLabel =
    estimatedRange.min > 0
      ? `${formatCurrency(estimatedRange.min)} - ${formatCurrency(estimatedRange.max)}`
      : "Selecciona al menos un servicio";

  const handleDraftChange =
    (field: keyof QuoteDraft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setDraft((prev) => ({ ...prev, [field]: value }));
    };

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((item) => item !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedServices.length === 0) {
      toast.error("Selecciona servicios", {
        description: "Debes marcar al menos un servicio para estimar la cotización.",
      });
      return;
    }

    startTransition(async () => {
      const selectedServiceNames = selectedServices
        .map((serviceId) => SERVICES.find((item) => item.id === serviceId)?.name)
        .filter(Boolean)
        .join(", ");

      const result = await createQuoteAction({
        nombre: draft.nombre,
        empresa: draft.empresa,
        email: draft.email,
        servicio: selectedServiceNames,
        monto: estimatedLabel,
        industria: inferIndustryFromSector(sector),
        detalles: draft.detalles,
        sector,
        complejidad: complexity,
        servicios: selectedServices,
        rangoInversion: estimatedRange,
        estado: "Diagnóstico Capturado",
      });

      if (result.ok) {
        toast.success("Diagnóstico registrado", {
          description: result.briefUrl
            ? `Brief listo: ${result.briefUrl}`
            : result.message,
        });
        setDraft(INITIAL_DRAFT);
        setSelectedServices([]);
        setComplexity("media");
        setSector("pyme");
        router.refresh();
        return;
      }

      toast.error("No se pudo registrar", {
        description: result.message,
      });
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Diagnóstico Inicial
            </h2>
            <p className="mt-1 text-sm text-brand-off-white/70">
              Este flujo replica el cotizador de `landing`: primero capturas contexto, rango estimado y datos del prospecto; después controlas brief y contrato desde la tabla.
            </p>
          </div>
          <Badge tone={enabled ? "success" : "pending"}>
            {enabled ? "Registro conectado" : "Falta webhook"}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={sector} onChange={(event) => setSector(event.target.value as Sector)}>
              <option value="pyme" className="bg-brand-charcoal text-white">
                PYME / Privado
              </option>
              <option value="publico" className="bg-brand-charcoal text-white">
                Sector Público
              </option>
            </Select>

            <Select
              value={complexity}
              onChange={(event) => setComplexity(event.target.value as Complexity)}
            >
              <option value="baja" className="bg-brand-charcoal text-white">
                Complejidad Baja
              </option>
              <option value="media" className="bg-brand-charcoal text-white">
                Complejidad Media
              </option>
              <option value="alta" className="bg-brand-charcoal text-white">
                Complejidad Alta
              </option>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICES.map((service) => {
              const active = selectedServices.includes(service.id);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleToggleService(service.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-brand-gold/60 bg-brand-gold/10 text-white"
                      : "border-white/10 bg-black/20 text-brand-off-white/80 hover:bg-white/5"
                  }`}
                >
                  {service.name}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-off-white/60">
              <Sparkles className="h-4 w-4 text-brand-gold" />
              Rango Estimado
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{estimatedLabel}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={draft.nombre}
              onChange={handleDraftChange("nombre")}
              placeholder="Nombre del lead"
              required
            />
            <Input
              value={draft.empresa}
              onChange={handleDraftChange("empresa")}
              placeholder="Empresa"
              required
            />
          </div>

          <Input
            value={draft.email}
            onChange={handleDraftChange("email")}
            placeholder="Email del prospecto"
            type="email"
          />

          <textarea
            value={draft.detalles}
            onChange={handleDraftChange("detalles")}
            placeholder="Objetivo, alcance, restricciones, referencias o notas relevantes"
            className="min-h-28 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-brand-off-white/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/20"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-brand-off-white/60">
              Requiere `N8N_CREATE_QUOTE_URL` para persistir el diagnóstico y reflejarlo en la tabla.
            </p>
            <Button type="submit" disabled={!enabled || isPending}>
              {isPending ? "Registrando..." : "Registrar Diagnóstico"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
