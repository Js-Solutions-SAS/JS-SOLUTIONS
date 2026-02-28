"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Headset,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  elapsedHours,
  isTicketClientType,
  isTicketPriority,
  isTicketStatus,
  resolutionBreached,
  resolutionHours,
  resolutionState,
  responseBreached,
  responseHours,
  responseState,
} from "@/lib/ticket-sla-utils";
import type {
  TicketClientType,
  TicketPriority,
  TicketSLAClientSummary,
  TicketSLAEntry,
  TicketSLAMetrics,
  TicketSLAStatus,
} from "@/lib/types";

interface TicketsSLABoardProps {
  entries: TicketSLAEntry[];
  metrics: TicketSLAMetrics;
  summaries: TicketSLAClientSummary[];
}

const CLIENT_TYPES: TicketClientType[] = [
  "Public Sector",
  "Retail / E-commerce",
  "Luxury",
  "Media Production",
  "Technology",
];

const STATUSES: TicketSLAStatus[] = [
  "Open",
  "In Progress",
  "Pending Customer",
  "Resolved",
  "Closed",
];

const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Critical"];

function clientTypeLabel(type: TicketClientType): string {
  if (type === "Public Sector") return "Sector Público";
  if (type === "Retail / E-commerce") return "Retail / E-commerce";
  if (type === "Luxury") return "Lujo";
  if (type === "Media Production") return "Producción de Medios";
  return "Tecnología";
}

function statusLabel(status: TicketSLAStatus): string {
  if (status === "Open") return "Abierto";
  if (status === "In Progress") return "En Progreso";
  if (status === "Pending Customer") return "Esperando Cliente";
  if (status === "Resolved") return "Resuelto";
  return "Cerrado";
}

function priorityLabel(priority: TicketPriority): string {
  if (priority === "Low") return "Baja";
  if (priority === "Medium") return "Media";
  if (priority === "High") return "Alta";
  return "Crítica";
}

function priorityTone(priority: TicketPriority): "pending" | "progress" | "success" | "neutral" {
  if (priority === "Critical") return "pending";
  if (priority === "High") return "progress";
  if (priority === "Medium") return "neutral";
  return "success";
}

function statusTone(status: TicketSLAStatus): "pending" | "progress" | "success" | "neutral" {
  if (status === "Open") return "pending";
  if (status === "In Progress" || status === "Pending Customer") return "progress";
  if (status === "Resolved" || status === "Closed") return "success";
  return "neutral";
}

function stateTone(state: "ok" | "breached" | "pending"): "pending" | "progress" | "success" {
  if (state === "breached") return "pending";
  if (state === "pending") return "progress";
  return "success";
}

function stateLabel(state: "ok" | "breached" | "pending"): string {
  if (state === "breached") return "Fuera de SLA";
  if (state === "pending") return "En ventana";
  return "Cumplido";
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

function formatHours(value: number): string {
  return `${value.toFixed(1)} h`;
}

function priorityScore(priority: TicketPriority): number {
  if (priority === "Critical") return 4;
  if (priority === "High") return 3;
  if (priority === "Medium") return 2;
  return 1;
}

export function TicketsSLABoard({ entries, metrics, summaries }: TicketsSLABoardProps) {
  const [clientTypeFilter, setClientTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<TicketSLAEntry | null>(null);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const byClientType =
          clientTypeFilter === "Todos" ||
          (isTicketClientType(clientTypeFilter) && entry.clientType === clientTypeFilter);
        const byStatus =
          statusFilter === "Todos" ||
          (isTicketStatus(statusFilter) && entry.status === statusFilter);
        const byPriority =
          priorityFilter === "Todos" ||
          (isTicketPriority(priorityFilter) && entry.priority === priorityFilter);

        const query = search.trim().toLowerCase();
        const bySearch =
          !query ||
          `${entry.ticketId} ${entry.projectName} ${entry.clientName} ${entry.summary} ${entry.owner}`
            .toLowerCase()
            .includes(query);

        return byClientType && byStatus && byPriority && bySearch;
      })
      .sort((a, b) => {
        const breachA = Number(responseBreached(a) || resolutionBreached(a));
        const breachB = Number(responseBreached(b) || resolutionBreached(b));
        if (breachB !== breachA) return breachB - breachA;

        const priorityDiff = priorityScore(b.priority) - priorityScore(a.priority);
        if (priorityDiff !== 0) return priorityDiff;

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [clientTypeFilter, entries, priorityFilter, search, statusFilter]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card className="flex h-full min-h-[148px] flex-col justify-between">
          <CardHeader className="min-h-[64px]">
            <CardTitle className="flex items-start justify-between gap-2 text-sm text-brand-off-white/75">
              <span className="leading-5">Tickets SLA</span>
              <Headset className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-white">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[148px] flex-col justify-between">
          <CardHeader className="min-h-[64px]">
            <CardTitle className="flex items-start justify-between gap-2 text-sm text-brand-off-white/75">
              <span className="leading-5">Tickets Abiertos</span>
              <span aria-hidden className="h-4 w-4 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-amber-100">{metrics.open}</p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[148px] flex-col justify-between">
          <CardHeader className="min-h-[64px]">
            <CardTitle className="flex items-start justify-between gap-2 text-sm text-brand-off-white/75">
              <span className="leading-5">Incumplimiento Respuesta</span>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-rose-200">{metrics.breachedResponse}</p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[148px] flex-col justify-between">
          <CardHeader className="min-h-[64px]">
            <CardTitle className="flex items-start justify-between gap-2 text-sm text-brand-off-white/75">
              <span className="leading-5">Incumplimiento Resolución</span>
              <TimerReset className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-orange-200">{metrics.breachedResolution}</p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[148px] flex-col justify-between">
          <CardHeader className="min-h-[64px]">
            <CardTitle className="flex items-start justify-between gap-2 text-sm text-brand-off-white/75">
              <span className="leading-5">Dentro de SLA</span>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-emerald-100">{metrics.withinSLA}</p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[148px] flex-col justify-between">
          <CardHeader className="min-h-[64px]">
            <CardTitle className="flex items-start justify-between gap-2 text-sm text-brand-off-white/75">
              <span className="leading-5">Promedio de Resolución</span>
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-white">{formatHours(metrics.avgResolutionHours)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Cumplimiento por Tipo de Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaries.map((summary) => {
              const percent = summary.total
                ? Math.round((summary.withinSLA / summary.total) * 100)
                : 0;

              return (
                <div key={summary.clientType} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{clientTypeLabel(summary.clientType)}</p>
                    <Badge tone={percent >= 80 ? "success" : percent >= 60 ? "progress" : "pending"}>
                      {percent}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-brand-off-white/70">
                    {summary.withinSLA}/{summary.total} tickets dentro de SLA
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gold-gradient" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-off-white/75">
                    <p>Resp. fuera SLA: {summary.breachedResponse}</p>
                    <p>Res. fuera SLA: {summary.breachedResolution}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-white">Control Operativo de Tickets</CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar ticket, proyecto, cliente o responsable"
                className="md:col-span-2"
              />

              <Select value={clientTypeFilter} onChange={(event) => setClientTypeFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Tipo de Cliente: Todos
                </option>
                {CLIENT_TYPES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Tipo de Cliente: {clientTypeLabel(option)}
                  </option>
                ))}
              </Select>

              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Estado: Todos
                </option>
                {STATUSES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Estado: {statusLabel(option)}
                  </option>
                ))}
              </Select>

              <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Prioridad: Todas
                </option>
                {PRIORITIES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Prioridad: {priorityLabel(option)}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Proyecto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">SLA Respuesta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">SLA Resolución</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((entry) => {
                    const response = responseHours(entry) ?? elapsedHours(entry.createdAt);
                    const resolution = resolutionHours(entry) ?? elapsedHours(entry.createdAt);
                    const responseBadge = responseState(entry);
                    const resolutionBadge = resolutionState(entry);

                    return (
                      <tr
                        key={entry.id}
                        className="cursor-pointer hover:bg-white/5"
                        onClick={() => setSelectedItem(entry)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{entry.ticketId}</p>
                          <p className="text-xs text-brand-off-white/65">Canal: {entry.channel}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-brand-off-white">{entry.projectName}</p>
                          <p className="text-xs text-brand-off-white/65">{entry.owner}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-brand-off-white/90">{entry.clientName}</p>
                          <p className="text-xs text-brand-off-white/65">{clientTypeLabel(entry.clientType)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <Badge tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Badge>
                            <Badge tone={priorityTone(entry.priority)}>{priorityLabel(entry.priority)}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={stateTone(responseBadge)}>{stateLabel(responseBadge)}</Badge>
                          <p className="mt-1 text-xs text-brand-off-white/70">
                            {formatHours(response)} / {formatHours(entry.targetResponseHours)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={stateTone(resolutionBadge)}>{stateLabel(resolutionBadge)}</Badge>
                          <p className="mt-1 text-xs text-brand-off-white/70">
                            {formatHours(resolution)} / {formatHours(entry.targetResolutionHours)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedItem(entry)}>
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
                No hay tickets SLA para los filtros seleccionados.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de SLA del Ticket {selectedItem.ticketId}</DialogTitle>
                <DialogDescription>
                  Aquí puedes ver tiempos reales vs tiempos objetivo para respuesta y resolución.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{selectedItem.summary}</p>
                  <p className="mt-1 text-xs text-brand-off-white/70">
                    {selectedItem.projectName} · {selectedItem.clientName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={statusTone(selectedItem.status)}>{statusLabel(selectedItem.status)}</Badge>
                    <Badge tone={priorityTone(selectedItem.priority)}>{priorityLabel(selectedItem.priority)}</Badge>
                    <Badge tone="neutral">{clientTypeLabel(selectedItem.clientType)}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">SLA de Respuesta</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">
                      Objetivo: {formatHours(selectedItem.targetResponseHours)}
                    </p>
                    <p className="text-sm text-brand-off-white/90">
                      Real: {formatHours(responseHours(selectedItem) ?? elapsedHours(selectedItem.createdAt))}
                    </p>
                    <Badge className="mt-2" tone={stateTone(responseState(selectedItem))}>
                      {stateLabel(responseState(selectedItem))}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">SLA de Resolución</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">
                      Objetivo: {formatHours(selectedItem.targetResolutionHours)}
                    </p>
                    <p className="text-sm text-brand-off-white/90">
                      Real: {formatHours(resolutionHours(selectedItem) ?? elapsedHours(selectedItem.createdAt))}
                    </p>
                    <Badge className="mt-2" tone={stateTone(resolutionState(selectedItem))}>
                      {stateLabel(resolutionState(selectedItem))}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/85">
                  <p>
                    <span className="font-semibold text-white">¿Qué significa SLA de respuesta?</span> Tiempo máximo
                    para dar la primera respuesta al cliente.
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-white">¿Qué significa SLA de resolución?</span> Tiempo máximo
                    para resolver el ticket o dejarlo en estado cerrado.
                  </p>
                  <p className="mt-3 text-xs text-brand-off-white/70">Creado: {formatDate(selectedItem.createdAt)}</p>
                  {selectedItem.firstResponseAt && (
                    <p className="text-xs text-brand-off-white/70">
                      Primera respuesta: {formatDate(selectedItem.firstResponseAt)}
                    </p>
                  )}
                  {selectedItem.resolvedAt && (
                    <p className="text-xs text-brand-off-white/70">Resuelto: {formatDate(selectedItem.resolvedAt)}</p>
                  )}
                </div>

                {selectedItem.externalUrl && (
                  <div className="text-right">
                    <a
                      href={selectedItem.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-brand-gold hover:underline"
                    >
                      Abrir ticket externo
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
