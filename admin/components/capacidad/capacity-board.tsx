"use client";

import { useMemo, useState } from "react";
import { Gauge, Mail, ShieldAlert, Users2 } from "lucide-react";

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
import { Select } from "@/components/ui/select";
import { utilizationBand, utilizationPercent } from "@/lib/capacity-utils";
import type { CapacityMetrics, TeamCapacityEntry } from "@/lib/types";

interface CapacityBoardProps {
  entries: TeamCapacityEntry[];
  metrics: CapacityMetrics;
}

function bandLabel(entry: TeamCapacityEntry): string {
  const band = utilizationBand(entry);
  if (band === "over") return "Overallocated";
  if (band === "warning") return "At Risk";
  return "Healthy";
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
  const [roleFilter, setRoleFilter] = useState("All");
  const [bandFilter, setBandFilter] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState<TeamCapacityEntry | null>(null);

  const roles = useMemo(() => {
    const values = new Set(entries.map((entry) => entry.role || "Unassigned Role"));
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const byRole = roleFilter === "All" || entry.role === roleFilter;
        const byBand =
          bandFilter === "All" || utilizationBand(entry) === bandFilter;
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
              Team Members
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
              Overallocated
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
              At Risk
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
              Healthy
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
              Avg Utilization
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
                  Role: {option}
                </option>
              ))}
            </Select>

            <Select value={bandFilter} onChange={(event) => setBandFilter(event.target.value)}>
              <option value="All" className="bg-brand-charcoal text-white">
                Status: All
              </option>
              <option value="healthy" className="bg-brand-charcoal text-white">
                Status: Healthy
              </option>
              <option value="warning" className="bg-brand-charcoal text-white">
                Status: At Risk
              </option>
              <option value="over" className="bg-brand-charcoal text-white">
                Status: Overallocated
              </option>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Person</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Week</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Load</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filtered.map((entry) => {
                  const utilization = utilizationPercent(entry);

                  return (
                    <tr
                      key={entry.id}
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="px-4 py-3 text-white">
                        <p className="font-semibold">{entry.personName}</p>
                        <p className="text-xs text-brand-off-white/60">{entry.focusArea}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-off-white/85">{entry.role}</td>
                      <td className="px-4 py-3 text-brand-off-white/80">{entry.weekLabel}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-brand-off-white/80">
                          {entry.assignedHours}h / {entry.capacityHours}h · {entry.projectCount} project(s)
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
                        <div className="inline-flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          {entry.ownerEmail ? (
                            <a
                              href={`mailto:${entry.ownerEmail}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Contact
                            </a>
                          ) : (
                            <span className="text-xs text-brand-off-white/55">No contact</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
              No capacity records match your current filters.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent>
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle>Capacity Detail</DialogTitle>
                <DialogDescription>
                  Use this detail to understand workload, risk level, and recommended actions for this teammate.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Person</p>
                  <p className="mt-1 text-sm font-semibold text-white">{selectedEntry.personName}</p>
                  <p className="text-xs text-brand-off-white/70">{selectedEntry.role}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Utilization</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {utilizationPercent(selectedEntry)}% ({selectedEntry.assignedHours}h / {selectedEntry.capacityHours}h)
                  </p>
                  <Badge className="mt-2" tone={bandTone(selectedEntry)}>
                    {bandLabel(selectedEntry)}
                  </Badge>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Planning Context</p>
                  <p className="mt-1 text-sm text-brand-off-white/85">Week: {selectedEntry.weekLabel}</p>
                  <p className="text-sm text-brand-off-white/85">Projects: {selectedEntry.projectCount}</p>
                  <p className="text-sm text-brand-off-white/85">Focus: {selectedEntry.focusArea}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Guidance</p>
                  <p className="mt-1 text-sm text-brand-off-white/85">
                    Over 100% means this person is overbooked. Rebalance deliverables or shift ownership before deadlines are impacted.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
