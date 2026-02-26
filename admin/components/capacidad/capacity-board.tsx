"use client";

import { useMemo, useState } from "react";
import { Gauge, Mail, ShieldAlert, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  utilizationBand,
  utilizationPercent,
} from "@/lib/capacity-utils";
import type { CapacityMetrics, TeamCapacityEntry } from "@/lib/types";

interface CapacityBoardProps {
  entries: TeamCapacityEntry[];
  metrics: CapacityMetrics;
}

function bandLabel(entry: TeamCapacityEntry): string {
  const band = utilizationBand(entry);
  if (band === "over") return "Sobrecargado";
  if (band === "warning") return "Al limite";
  return "Saludable";
}

function bandTone(entry: TeamCapacityEntry): "pending" | "progress" | "success" {
  const band = utilizationBand(entry);
  if (band === "over") return "pending";
  if (band === "warning") return "progress";
  return "success";
}

function barColor(entry: TeamCapacityEntry): string {
  const band = utilizationBand(entry);
  if (band === "over") return "bg-rose-300";
  if (band === "warning") return "bg-amber-200";
  return "bg-emerald-300";
}

export function CapacityBoard({ entries, metrics }: CapacityBoardProps) {
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [bandFilter, setBandFilter] = useState("Todos");

  const roles = useMemo(() => {
    const values = new Set(entries.map((entry) => entry.role || "Sin rol"));
    return ["Todos", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const byRole = roleFilter === "Todos" || entry.role === roleFilter;
        const byBand =
          bandFilter === "Todos" ||
          utilizationBand(entry) === bandFilter;
        return byRole && byBand;
      })
      .sort((a, b) => utilizationPercent(b) - utilizationPercent(a));
  }, [bandFilter, entries, roleFilter]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Personas
              <Users2 className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.people}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Sobrecargados
              <ShieldAlert className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.overallocated}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Al Límite
              <Gauge className="h-4 w-4 text-amber-200" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.atRisk}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Saludables
              <Gauge className="h-4 w-4 text-emerald-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-100">{metrics.healthy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Utilización Promedio
              <Gauge className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.avgUtilization}%</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roles.map((option) => (
                <option key={option} value={option} className="bg-brand-charcoal text-white">
                  Rol: {option}
                </option>
              ))}
            </Select>

            <Select value={bandFilter} onChange={(event) => setBandFilter(event.target.value)}>
              <option value="Todos" className="bg-brand-charcoal text-white">
                Estado: Todos
              </option>
              <option value="healthy" className="bg-brand-charcoal text-white">
                Estado: Saludable
              </option>
              <option value="warning" className="bg-brand-charcoal text-white">
                Estado: Al limite
              </option>
              <option value="over" className="bg-brand-charcoal text-white">
                Estado: Sobrecargado
              </option>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Persona</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Semana</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Carga</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Accion</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filtered.map((entry) => {
                  const utilization = utilizationPercent(entry);

                  return (
                    <tr key={entry.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white">
                        <p className="font-semibold">{entry.personName}</p>
                        <p className="text-xs text-brand-off-white/60">{entry.focusArea}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-off-white/85">{entry.role}</td>
                      <td className="px-4 py-3 text-brand-off-white/80">{entry.weekLabel}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-brand-off-white/80">
                          {entry.assignedHours}h / {entry.capacityHours}h · {entry.projectCount} proyecto(s)
                        </p>
                        <div className="mt-2 h-2 w-48 rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full ${barColor(entry)}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-brand-off-white/70">{utilization}%</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={bandTone(entry)}>{bandLabel(entry)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {entry.ownerEmail ? (
                          <a
                            href={`mailto:${entry.ownerEmail}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Contactar
                          </a>
                        ) : (
                          <span className="text-xs text-brand-off-white/55">Sin contacto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
              No hay registros de capacidad para los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
