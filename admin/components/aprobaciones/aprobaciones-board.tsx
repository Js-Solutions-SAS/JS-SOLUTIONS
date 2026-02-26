"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCheck, CircleAlert, ClipboardCheck, ShieldAlert, Timer } from "lucide-react";
import { toast } from "sonner";

import { approveCheckpointAction } from "@/app/aprobaciones/actions";
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
  isApprovalActionable,
  isApprovalOverdue,
  isApprovalStage,
  isApprovalStatus,
} from "@/lib/approval-utils";
import type { ApprovalItem, ApprovalStage, ApprovalStatus } from "@/lib/types";

interface AprobacionesBoardProps {
  initialItems: ApprovalItem[];
}

const STAGES: ApprovalStage[] = [
  "Brief",
  "Scope",
  "QA",
  "UAT",
  "Contract",
  "Scope Change",
];

const STATUSES: ApprovalStatus[] = [
  "Pending",
  "In Review",
  "Approved",
  "Rejected",
  "Blocked",
];

function stageTone(stage: ApprovalStage): "pending" | "progress" | "success" | "neutral" {
  if (stage === "QA" || stage === "UAT") return "progress";
  if (stage === "Contract" || stage === "Scope Change") return "pending";
  return "neutral";
}

function statusTone(status: ApprovalStatus): "pending" | "progress" | "success" | "neutral" {
  if (status === "Pending") return "pending";
  if (status === "In Review" || status === "Blocked") return "progress";
  if (status === "Approved") return "success";
  return "neutral";
}

function formatDate(value?: string): string {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function stageDescription(stage: ApprovalStage): string {
  if (stage === "Brief") return "Validates business goals, constraints, and expected outcomes.";
  if (stage === "Scope") return "Confirms project boundaries, effort, and delivery commitments.";
  if (stage === "QA") return "Confirms technical quality, testing evidence, and release readiness.";
  if (stage === "UAT") return "Confirms end-user acceptance from business stakeholders.";
  if (stage === "Contract") return "Confirms legal/commercial documents are accepted.";
  return "Captures and approves approved scope modifications.";
}

export function AprobacionesBoard({ initialItems }: AprobacionesBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [projectFilter, setProjectFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const projects = useMemo(() => {
    const values = new Set(items.map((item) => item.projectName));
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const byProject = projectFilter === "All" || item.projectName === projectFilter;
        const byStage =
          stageFilter === "All" || (isApprovalStage(stageFilter) && item.stage === stageFilter);
        const byStatus =
          statusFilter === "All" || (isApprovalStatus(statusFilter) && item.status === statusFilter);
        const query = search.toLowerCase().trim();
        const bySearch =
          !query ||
          `${item.projectName} ${item.clientName} ${item.title} ${item.owner}`
            .toLowerCase()
            .includes(query);

        return byProject && byStage && byStatus && bySearch;
      })
      .sort((a, b) => {
        if (Number(isApprovalOverdue(b)) !== Number(isApprovalOverdue(a))) {
          return Number(isApprovalOverdue(b)) - Number(isApprovalOverdue(a));
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      });
  }, [items, projectFilter, search, stageFilter, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "Pending").length,
      inReview: items.filter((item) => item.status === "In Review").length,
      blocked: items.filter((item) => item.status === "Blocked").length,
      approved: items.filter((item) => item.status === "Approved").length,
      overdue: items.filter((item) => isApprovalOverdue(item)).length,
    };
  }, [items]);

  const stageCoverage = useMemo(() => {
    return STAGES.map((stage) => {
      const entries = items.filter((item) => item.stage === stage);
      return {
        stage,
        total: entries.length,
        approved: entries.filter((item) => item.status === "Approved").length,
      };
    });
  }, [items]);

  const handleApprove = (item: ApprovalItem) => {
    setRunningId(item.id);
    startTransition(async () => {
      const result = await approveCheckpointAction({
        approvalId: item.id,
        projectId: item.projectId,
        stage: item.stage,
      });

      if (!result.ok) {
        toast.error("Connection error", { description: result.message });
        setRunningId(null);
        return;
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "Approved", approvedAt: new Date().toISOString() }
            : entry,
        ),
      );
      toast.success("Checkpoint approved", { description: result.message });
      setRunningId(null);
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Requests
              <ClipboardCheck className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-100">{metrics.inReview}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-200">{metrics.blocked}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-100">{metrics.approved}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Overdue
              <Timer className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.overdue}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCheck className="h-4 w-4 text-brand-gold" />
              Stage Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageCoverage.map((entry) => (
              <div key={entry.stage} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <Badge tone={stageTone(entry.stage)}>{entry.stage}</Badge>
                  <p className="text-xs text-brand-off-white/70">
                    {entry.approved}/{entry.total} approved
                  </p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gold-gradient"
                    style={{
                      width: `${entry.total ? Math.round((entry.approved / entry.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-white">Approval Matrix</CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search project, client, owner, or checkpoint"
                className="md:col-span-2"
              />

              <Select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                {projects.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Project: {option}
                  </option>
                ))}
              </Select>

              <Select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                <option value="All" className="bg-brand-charcoal text-white">
                  Stage: All
                </option>
                {STAGES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Stage: {option}
                  </option>
                ))}
              </Select>

              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All" className="bg-brand-charcoal text-white">
                  Status: All
                </option>
                {STATUSES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Status: {option}
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Checkpoint</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Dates</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((item) => {
                    const isRunning = runningId === item.id && isPending;
                    const canApprove = isApprovalActionable(item.status);
                    const overdue = isApprovalOverdue(item);

                    return (
                      <tr
                        key={item.id}
                        className="cursor-pointer hover:bg-white/5"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{item.projectName}</p>
                          <p className="text-xs text-brand-off-white/65">{item.owner}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-brand-off-white">{item.title}</p>
                          {item.notes && (
                            <p className="line-clamp-2 text-xs text-brand-off-white/65">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={stageTone(item.stage)}>{item.stage}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                            {overdue && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-200">
                                <CircleAlert className="h-3.5 w-3.5" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-off-white/80">
                          <p>Requested: {formatDate(item.requestedAt)}</p>
                          <p>Due: {formatDate(item.dueDate)}</p>
                          {item.approvedAt && <p>Approved: {formatDate(item.approvedAt)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                              View
                            </Button>
                            {canApprove ? (
                              <Button
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleApprove(item);
                                }}
                                disabled={isRunning}
                              >
                                {isRunning ? "Processing..." : "Approve"}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                {item.status === "Approved" ? "Approved" : "Not actionable"}
                              </Button>
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
                No approval checkpoints match your current filters.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {metrics.overdue > 0 && (
        <Card className="border-rose-300/25">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-rose-100">
            <ShieldAlert className="h-4 w-4 text-rose-200" />
            {metrics.overdue} approval checkpoint(s) are overdue. Escalate in the operations committee.
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>Checkpoint Detail</DialogTitle>
                <DialogDescription>
                  This view explains what this checkpoint means and what must happen next.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{selectedItem.title}</p>
                  <p className="mt-1 text-xs text-brand-off-white/70">
                    {selectedItem.projectName} · {selectedItem.clientName}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={stageTone(selectedItem.stage)}>{selectedItem.stage}</Badge>
                    <Badge tone={statusTone(selectedItem.status)}>{selectedItem.status}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Owner</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">{selectedItem.owner}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-brand-off-white/50">Dates</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">Requested: {formatDate(selectedItem.requestedAt)}</p>
                    <p className="text-sm text-brand-off-white/90">Due: {formatDate(selectedItem.dueDate)}</p>
                    {selectedItem.approvedAt && (
                      <p className="text-sm text-brand-off-white/90">Approved: {formatDate(selectedItem.approvedAt)}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Stage Meaning</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">{stageDescription(selectedItem.stage)}</p>
                  </div>
                </div>

                {selectedItem.notes && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Notes</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">{selectedItem.notes}</p>
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
