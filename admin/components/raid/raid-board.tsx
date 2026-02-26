"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Link2, ShieldCheck, Siren, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { isCriticalOpen, isRaidStatus, isRaidType } from "@/lib/raid-utils";
import type {
  RaidItem,
  RaidMetrics,
  RaidProjectSummary,
  RaidStatus,
  RaidType,
} from "@/lib/types";

interface RaidBoardProps {
  items: RaidItem[];
  metrics: RaidMetrics;
  summaries: RaidProjectSummary[];
}

function typeTone(type: RaidType): "pending" | "progress" | "success" | "neutral" {
  if (type === "Risk" || type === "Issue") return "pending";
  if (type === "Dependency") return "progress";
  if (type === "Assumption") return "neutral";
  return "neutral";
}

function statusTone(status: RaidStatus): "pending" | "progress" | "success" | "neutral" {
  if (status === "Open") return "pending";
  if (status === "Blocked") return "progress";
  if (status === "Mitigated") return "neutral";
  return "success";
}

function priorityTone(priority: RaidItem["priority"]): "pending" | "progress" | "success" | "neutral" {
  if (priority === "Critical" || priority === "High") return "pending";
  if (priority === "Medium") return "progress";
  return "neutral";
}

function formatDate(date?: string): string {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function RaidBoard({ items, metrics, summaries }: RaidBoardProps) {
  const [projectFilter, setProjectFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [ownerFilter, setOwnerFilter] = useState("Todos");

  const projects = useMemo(() => {
    const values = new Set(items.map((item) => item.projectName));
    return ["Todos", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const owners = useMemo(() => {
    const values = new Set(items.map((item) => item.owner));
    return ["Todos", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const byProject = projectFilter === "Todos" || item.projectName === projectFilter;
        const byOwner = ownerFilter === "Todos" || item.owner === ownerFilter;
        const byType = typeFilter === "Todos" || (isRaidType(typeFilter) && item.type === typeFilter);
        const byStatus =
          statusFilter === "Todos" || (isRaidStatus(statusFilter) && item.status === statusFilter);

        return byProject && byOwner && byType && byStatus;
      })
      .sort((a, b) => {
        if (Number(isCriticalOpen(b)) !== Number(isCriticalOpen(a))) {
          return Number(isCriticalOpen(b)) - Number(isCriticalOpen(a));
        }

        if ((a.dueDate && b.dueDate) || a.dueDate || b.dueDate) {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        return a.projectName.localeCompare(b.projectName);
      });
  }, [items, ownerFilter, projectFilter, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Registros RAID
              <Target className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Abiertos/Bloqueados
              <AlertTriangle className="h-4 w-4 text-amber-200" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.open}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Críticos Activos
              <Siren className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.criticalOpen}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-off-white">{metrics.risks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-off-white">{metrics.issues}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-off-white">{metrics.dependencies}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4 text-brand-gold" />
              RAID por Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaries.map((summary) => (
              <div
                key={summary.projectId}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{summary.projectName}</p>
                    <p className="text-xs text-brand-off-white/65">
                      {summary.clientName} · {summary.industry}
                    </p>
                  </div>
                  <Badge tone={summary.critical > 0 ? "pending" : "neutral"}>
                    {summary.critical} críticos
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-brand-off-white/80">
                  <p>Open: {summary.open}</p>
                  <p>Risks: {summary.risks}</p>
                  <p>Assumptions: {summary.assumptions}</p>
                  <p>Issues: {summary.issues}</p>
                  <p className="col-span-2">Dependencies: {summary.dependencies}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-white">RAID Log Detallado</CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                {projects.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Proyecto: {option}
                  </option>
                ))}
              </Select>

              <Select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                {owners.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Owner: {option}
                  </option>
                ))}
              </Select>

              <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Tipo: Todos
                </option>
                <option value="Risk" className="bg-brand-charcoal text-white">
                  Tipo: Risk
                </option>
                <option value="Assumption" className="bg-brand-charcoal text-white">
                  Tipo: Assumption
                </option>
                <option value="Issue" className="bg-brand-charcoal text-white">
                  Tipo: Issue
                </option>
                <option value="Dependency" className="bg-brand-charcoal text-white">
                  Tipo: Dependency
                </option>
              </Select>

              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Estado: Todos
                </option>
                <option value="Open" className="bg-brand-charcoal text-white">
                  Estado: Open
                </option>
                <option value="Blocked" className="bg-brand-charcoal text-white">
                  Estado: Blocked
                </option>
                <option value="Mitigated" className="bg-brand-charcoal text-white">
                  Estado: Mitigated
                </option>
                <option value="Closed" className="bg-brand-charcoal text-white">
                  Estado: Closed
                </option>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Proyecto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Registro</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Prioridad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Due</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{item.projectName}</p>
                        <p className="text-xs text-brand-off-white/60">{item.owner}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-off-white">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-brand-off-white/65">{item.detail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={typeTone(item.type)}>{item.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                      </td>
                      <td className="px-4 py-3 text-brand-off-white/80">{formatDate(item.dueDate)}</td>
                      <td className="px-4 py-3 text-right">
                        {item.externalUrl ? (
                          <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:underline"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            Abrir
                          </a>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-brand-off-white/60">
                            Sin enlace
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
                No hay elementos RAID para los filtros seleccionados.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
