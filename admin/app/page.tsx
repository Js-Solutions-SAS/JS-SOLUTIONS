import { Activity, ClipboardCheck, FileSignature, Network } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardMetrics } from "@/lib/admin-data";

const metricConfig = [
  {
    key: "proyectosActivos" as const,
    title: "Proyectos Activos",
    icon: Activity,
    hint: "Flujos actualmente en ejecucion",
  },
  {
    key: "cotizacionesPendientes" as const,
    title: "Cotizaciones Pendientes",
    icon: ClipboardCheck,
    hint: "Leads pendientes por aprobar",
  },
  {
    key: "contratosGenerados" as const,
    title: "Contratos Generados",
    icon: FileSignature,
    hint: "Contratos confirmados por n8n",
  },
  {
    key: "totalSops" as const,
    title: "SOPs Disponibles",
    icon: Network,
    hint: "Procesos operativos documentados",
  },
];

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Operativo</h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Visibilidad consolidada para contratos, cotizaciones y base de conocimiento.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.key} className="relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-gold/10 blur-2xl" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-brand-off-white/75">{metric.title}</CardTitle>
                <div className="rounded-lg border border-white/15 p-2">
                  <Icon className="h-4 w-4 text-brand-gold" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{metrics[metric.key]}</p>
                <p className="mt-1 text-xs text-brand-off-white/60">{metric.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
