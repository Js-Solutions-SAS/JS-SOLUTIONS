"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  ShieldCheck,
  Siren,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/dialog";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import {
  healthBand,
  healthScore,
  isExecutiveIndustry,
} from "@/lib/executive-portfolio-utils";
import type {
  ExecutiveIndustry,
  ExecutivePortfolioEntry,
  ExecutivePortfolioMetrics,
} from "@/lib/types";

interface PortafolioBoardProps {
  entries: ExecutivePortfolioEntry[];
  metrics: ExecutivePortfolioMetrics;
}

const INDUSTRIES: ExecutiveIndustry[] = [
  "Public Sector",
  "Retail / E-commerce",
  "Luxury",
  "Media Production",
];

function industryLabel(industry: ExecutiveIndustry): string {
  if (industry === "Public Sector") return "Público";
  if (industry === "Retail / E-commerce") return "Retail";
  if (industry === "Luxury") return "Lujo";
  return "Media";
}

function healthLabel(band: "healthy" | "warning" | "critical"): string {
  if (band === "healthy") return "Saludable";
  if (band === "warning") return "En Riesgo";
  return "Crítico";
}

function healthTone(band: "healthy" | "warning" | "critical"): "success" | "progress" | "pending" {
  if (band === "healthy") return "success";
  if (band === "warning") return "progress";
  return "pending";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function progressClass(value: number): string {
  if (value > 100) return "bg-rose-300";
  if (value >= 85) return "bg-amber-200";
  return "bg-emerald-300";
}

export function PortafolioBoard({ entries, metrics }: PortafolioBoardProps) {
  const [industryFilter, setIndustryFilter] = useState("Todas");
  const [healthFilter, setHealthFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<ExecutivePortfolioEntry | null>(null);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const byIndustry =
          industryFilter === "Todas" ||
          (isExecutiveIndustry(industryFilter) && entry.industry === industryFilter);
        const byHealth = healthFilter === "Todas" || healthBand(entry) === healthFilter;
        const query = search.trim().toLowerCase();
        const bySearch =
          !query ||
          `${entry.industry} ${entry.owner}`
            .toLowerCase()
            .includes(query);

        return byIndustry && byHealth && bySearch;
      })
      .sort((a, b) => {
        if (healthScore(a) !== healthScore(b)) {
          return healthScore(a) - healthScore(b);
        }

        if (b.pendingBillingAmount !== a.pendingBillingAmount) {
          return b.pendingBillingAmount - a.pendingBillingAmount;
        }

        return b.activeProjects - a.activeProjects;
      });
  }, [entries, healthFilter, industryFilter, search]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Industrias
              <Building2 className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.industries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.totalProjects}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Saludable
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-100">{metrics.healthyIndustries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              En Riesgo
              <AlertTriangle className="h-4 w-4 text-amber-200" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.warningIndustries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Crítico
              <Siren className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.criticalIndustries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Pendiente Facturar
              <CircleDollarSign className="h-4 w-4 text-orange-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-200">{formatCurrency(metrics.totalPendingBilling)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Salud Promedio
              <TrendingUp className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.avgPortfolioHealth}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-white">Portafolio Ejecutivo por Industria</CardTitle>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar industria o responsable"
              className="xl:col-span-2"
            />

            <Select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}>
              <option value="Todas" className="bg-brand-charcoal text-white">
                Industria: Todas
              </option>
              {INDUSTRIES.map((option) => (
                <option key={option} value={option} className="bg-brand-charcoal text-white">
                  Industria: {industryLabel(option)}
                </option>
              ))}
            </Select>

            <Select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}>
              <option value="Todas" className="bg-brand-charcoal text-white">
                Salud: Todas
              </option>
              <option value="healthy" className="bg-brand-charcoal text-white">
                Salud: Saludable
              </option>
              <option value="warning" className="bg-brand-charcoal text-white">
                Salud: En Riesgo
              </option>
              <option value="critical" className="bg-brand-charcoal text-white">
                Salud: Crítico
              </option>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Industria</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Salud</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Proyectos</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">SLA Promedio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Ejecución</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Pendiente Facturar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Gobernanza</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filtered.map((entry) => {
                  const band = healthBand(entry);
                  const score = healthScore(entry);

                  return (
                    <tr
                      key={entry.id}
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{industryLabel(entry.industry)}</p>
                        <p className="text-xs text-brand-off-white/65">Owner: {entry.owner}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={healthTone(band)}>{healthLabel(band)}</Badge>
                        <p className="mt-1 text-xs text-brand-off-white/70">Score: {score}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-brand-off-white/90">Activos: {entry.activeProjects}</p>
                        <p className="text-xs text-emerald-200">En ruta: {entry.onTrackProjects}</p>
                        <p className="text-xs text-amber-200">Riesgo: {entry.atRiskProjects}</p>
                        <p className="text-xs text-rose-200">Críticos: {entry.criticalProjects}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-off-white/90">{entry.avgSLACompliancePct}%</td>
                      <td className="px-4 py-3">
                        <p className="text-brand-off-white/90">{entry.avgExecutionPct}%</p>
                        <div className="mt-2 h-2 w-28 rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full ${progressClass(entry.avgExecutionPct)}`}
                            style={{ width: `${Math.min(entry.avgExecutionPct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-orange-200">
                        {formatCurrency(entry.pendingBillingAmount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-off-white/80">
                        <p>Aprobaciones: {entry.openApprovals}</p>
                        <p>RAID abierto: {entry.openRaidItems}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedEntry(entry)}>
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
              No hay registros para los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent>
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle Ejecutivo por Industria</DialogTitle>
                <DialogDescription>
                  Esta vista consolida salud operativa y financiera para priorizar decisiones de dirección.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{industryLabel(selectedEntry.industry)}</p>
                  <p className="mt-1 text-xs text-brand-off-white/70">Responsable: {selectedEntry.owner}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={healthTone(healthBand(selectedEntry))}>
                      {healthLabel(healthBand(selectedEntry))}
                    </Badge>
                    <Badge tone="neutral">Health score: {healthScore(selectedEntry)}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Proyectos</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">Activos: {selectedEntry.activeProjects}</p>
                    <p className="text-sm text-emerald-200">En ruta: {selectedEntry.onTrackProjects}</p>
                    <p className="text-sm text-amber-200">En riesgo: {selectedEntry.atRiskProjects}</p>
                    <p className="text-sm text-rose-200">Críticos: {selectedEntry.criticalProjects}</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Finanzas</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">Pendiente facturar: {formatCurrency(selectedEntry.pendingBillingAmount)}</p>
                    <p className="text-sm text-brand-off-white/90">Ejecución promedio: {selectedEntry.avgExecutionPct}%</p>
                    <p className="text-sm text-brand-off-white/90">SLA promedio: {selectedEntry.avgSLACompliancePct}%</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/85">
                  <p>
                    <span className="font-semibold text-white">Cómo se calcula la salud:</span> combina riesgo de
                    proyectos, cumplimiento SLA, ejecución presupuestal y carga de gobernanza (aprobaciones + RAID).
                  </p>
                  <p className="mt-2">
                    Un score alto significa operación estable y predecible. Un score bajo requiere intervención
                    prioritaria en PM, delivery o finanzas.
                  </p>
                  <p className="mt-3 text-xs text-brand-off-white/70">Última actualización: {formatDate(selectedEntry.updatedAt)}</p>
                </div>

                {selectedEntry.externalUrl && (
                  <div className="text-right">
                    <a
                      href={selectedEntry.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-gold hover:underline"
                    >
                      <ChartNoAxesCombined className="h-4 w-4" />
                      Abrir tablero externo
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
