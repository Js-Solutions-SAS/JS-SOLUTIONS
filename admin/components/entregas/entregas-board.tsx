"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

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
import { daysUntil, isMilestoneDone, milestoneRiskLevel } from "@/lib/milestone-utils";
import type { DeliveryMetrics, Milestone } from "@/lib/types";

interface EntregasBoardProps {
  milestones: Milestone[];
  metrics: DeliveryMetrics;
}

interface DeliveryTask {
  id: string;
  title: string;
  assignee: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function statusBadgeTone(status: string): "pending" | "progress" | "success" | "neutral" {
  const value = status.toLowerCase();

  if (value.includes("complet") || value.includes("done")) return "success";
  if (value.includes("progreso") || value.includes("curso") || value.includes("progress")) return "progress";
  if (value.includes("pend") || value.includes("qa") || value.includes("review")) return "pending";
  return "neutral";
}

function statusLabel(status: string): string {
  const value = status.toLowerCase();
  if (value.includes("pend")) return "Pending";
  if (value.includes("progreso") || value.includes("progress") || value.includes("curso")) {
    return "In Progress";
  }
  if (value.includes("bloq") || value.includes("block")) return "Blocked";
  if (value.includes("complet") || value.includes("done") || value.includes("cerr")) {
    return "Completed";
  }
  if (value.includes("review") || value.includes("revision")) return "In Review";
  return status;
}

function riskLabel(risk: "high" | "medium" | "low" | "none"): string {
  if (risk === "high") return "Critical";
  if (risk === "medium") return "Watch";
  return "Stable";
}

export function EntregasBoard({ milestones, metrics }: EntregasBoardProps) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [industry, setIndustry] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [taskMilestoneId, setTaskMilestoneId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [tasksByMilestone, setTasksByMilestone] = useState<Record<string, DeliveryTask[]>>({});

  const industries = useMemo(() => {
    const values = new Set(milestones.map((milestone) => milestone.industry || "General"));
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [milestones]);

  const statuses = useMemo(() => {
    const values = new Set(milestones.map((milestone) => milestone.status || "Pending"));
    return ["All", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [milestones]);

  const filtered = useMemo(() => {
    return milestones.filter((milestone) => {
      const byIndustry = industry === "All" || milestone.industry === industry;
      const byStatus = status === "All" || milestone.status === status;
      return byIndustry && byStatus;
    });
  }, [industry, milestones, status]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Milestone[]>();

    for (const milestone of filtered) {
      const key = getDayKey(new Date(milestone.dueDate));
      const list = map.get(key) || [];
      list.push(milestone);
      map.set(key, list);
    }

    return map;
  }, [filtered]);

  const monthData = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();

    const cells: Array<{ key: string; day: number | null; date: Date | null }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ key: `offset-${i}`, day: null, date: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ key: `day-${day}`, day, date });
    }

    return {
      monthLabel: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(firstDay),
      cells,
    };
  }, [monthCursor]);

  const selectedDateMilestones = useMemo(() => {
    if (!selectedDate) return [];
    return groupedByDate.get(selectedDate) || [];
  }, [groupedByDate, selectedDate]);

  const modalMilestones = useMemo(() => {
    if (!modalDate) return [];
    return groupedByDate.get(modalDate) || [];
  }, [groupedByDate, modalDate]);

  const selectedModalMilestone = useMemo(() => {
    return modalMilestones.find((milestone) => milestone.id === taskMilestoneId) || modalMilestones[0];
  }, [modalMilestones, taskMilestoneId]);

  const activeTasks = useMemo(() => {
    if (!selectedModalMilestone) return [];
    return tasksByMilestone[selectedModalMilestone.id] || [];
  }, [selectedModalMilestone, tasksByMilestone]);

  const riskMilestones = useMemo(() => {
    return filtered
      .filter((milestone) => {
        const risk = milestoneRiskLevel(milestone);
        return !isMilestoneDone(milestone) && (risk === "high" || risk === "medium");
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filtered]);

  const openDayModal = (dayKey: string, dayMilestones: Milestone[], preferredMilestoneId?: string) => {
    setSelectedDate(dayKey);
    setModalDate(dayKey);

    if (dayMilestones.length > 0) {
      const selected =
        dayMilestones.find((milestone) => milestone.id === preferredMilestoneId) || dayMilestones[0];
      setTaskMilestoneId(selected.id);
      setTaskDueDate(selected.dueDate.slice(0, 10));
    } else {
      setTaskMilestoneId("");
      setTaskDueDate("");
    }
  };

  const assignTask = () => {
    if (!selectedModalMilestone || !taskTitle.trim() || !taskAssignee.trim()) {
      toast.error("Missing fields", {
        description: "Task title and assignee are required.",
      });
      return;
    }

    const newTask: DeliveryTask = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      assignee: taskAssignee.trim(),
      dueDate: taskDueDate || undefined,
      notes: taskNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setTasksByMilestone((previous) => ({
      ...previous,
      [selectedModalMilestone.id]: [newTask, ...(previous[selectedModalMilestone.id] || [])],
    }));

    setTaskTitle("");
    setTaskAssignee("");
    setTaskNotes("");
    toast.success("Task assigned", {
      description: `Task linked to ${selectedModalMilestone.title}.`,
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Active Deliverables
              <CalendarDays className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Overdue
              <AlertTriangle className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.overdue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Due in 7 Days
              <Clock3 className="h-4 w-4 text-amber-200" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.dueIn7Days}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Blocked
              <ShieldAlert className="h-4 w-4 text-orange-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-200">{metrics.blocked}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-white">Delivery Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-40 text-center text-sm font-semibold capitalize text-brand-off-white/80">
                  {monthData.monthLabel}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                {industries.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Industry: {option}
                  </option>
                ))}
              </Select>

              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Status: {option === "All" ? "All" : statusLabel(option)}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-off-white/45">
              {WEEK_DAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthData.cells.map((cell) => {
                if (!cell.date || !cell.day) {
                  return <div key={cell.key} className="h-24 rounded-lg border border-transparent" />;
                }

                const key = getDayKey(cell.date);
                const hits = groupedByDate.get(key) || [];
                const isSelected = selectedDate === key;
                const hasHighRisk = hits.some((milestone) => milestoneRiskLevel(milestone) === "high");

                return (
                  <button
                    key={cell.key}
                    onClick={() => openDayModal(key, hits)}
                    className={`h-24 rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-brand-gold bg-brand-gold/10"
                        : "border-white/10 bg-white/5 hover:border-brand-gold/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{cell.day}</span>
                      {hits.length > 0 && (
                        <span className={`h-2.5 w-2.5 rounded-full ${hasHighRisk ? "bg-rose-300" : "bg-brand-gold"}`} />
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-[11px] text-brand-off-white/70">
                      {hits.length > 0 ? `${hits.length} deliverable(s)` : "No deliverables"}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/45">
                  {formatDate(selectedDate)}
                </p>

                <div className="mt-3 space-y-2">
                  {selectedDateMilestones.length === 0 ? (
                    <p className="text-sm text-brand-off-white/65">No milestones on this date.</p>
                  ) : (
                    selectedDateMilestones.map((milestone) => (
                      <button
                        key={milestone.id}
                        onClick={() =>
                          openDayModal(selectedDate, selectedDateMilestones, milestone.id)
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-brand-gold/30"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{milestone.title}</p>
                          <Badge tone={statusBadgeTone(milestone.status)}>{statusLabel(milestone.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-brand-off-white/65">
                          {milestone.projectName} · {milestone.owner}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Risk Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskMilestones.length === 0 && (
              <p className="text-sm text-brand-off-white/70">No critical alerts for the selected filters.</p>
            )}

            {riskMilestones.map((milestone) => {
              const remainingDays = daysUntil(milestone.dueDate);
              const risk = milestoneRiskLevel(milestone);

              return (
                <div key={milestone.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{milestone.title}</p>
                      <p className="text-xs text-brand-off-white/65">{milestone.projectName}</p>
                    </div>
                    <Badge tone={risk === "high" ? "pending" : "progress"}>{riskLabel(risk)}</Badge>
                  </div>

                  <p className="mt-2 text-xs text-brand-off-white/65">
                    Owner: {milestone.owner} · Due: {formatDate(milestone.dueDate)}
                  </p>

                  <p className="mt-2 text-xs text-brand-off-white/80">
                    {remainingDays < 0 ? `Overdue by ${Math.abs(remainingDays)} day(s)` : `Due in ${remainingDays} day(s)`}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDayModal(getDayKey(new Date(milestone.dueDate)), [milestone])}
                    >
                      Open details
                    </Button>

                    {milestone.externalUrl && milestone.externalUrl !== "#" && (
                      <a
                        href={milestone.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-xs font-semibold text-brand-gold hover:underline"
                      >
                        Open workflow
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(modalDate)} onOpenChange={(open) => !open && setModalDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery Detail & Task Assignment</DialogTitle>
            <DialogDescription>
              Review delivery checkpoints and assign execution tasks in one flow.
            </DialogDescription>
          </DialogHeader>

          {modalDate && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                Date: {formatDate(modalDate)}
              </p>

              {modalMilestones.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
                  No deliverables found for this date.
                </div>
              ) : (
                <>
                  <Select
                    value={taskMilestoneId || modalMilestones[0].id}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setTaskMilestoneId(nextId);
                      const hit = modalMilestones.find((milestone) => milestone.id === nextId);
                      if (hit?.dueDate) setTaskDueDate(hit.dueDate.slice(0, 10));
                    }}
                  >
                    {modalMilestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id} className="bg-brand-charcoal text-white">
                        {milestone.projectName} · {milestone.title}
                      </option>
                    ))}
                  </Select>

                  {selectedModalMilestone && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                      <p className="font-semibold text-white">{selectedModalMilestone.title}</p>
                      <p className="mt-1 text-brand-off-white/75">
                        {selectedModalMilestone.projectName} · Owner: {selectedModalMilestone.owner}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={statusBadgeTone(selectedModalMilestone.status)}>
                          {statusLabel(selectedModalMilestone.status)}
                        </Badge>
                        <Badge tone="neutral">
                          {selectedModalMilestone.industry}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="Task title"
                    />
                    <Input
                      value={taskAssignee}
                      onChange={(event) => setTaskAssignee(event.target.value)}
                      placeholder="Assignee"
                    />
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(event) => setTaskDueDate(event.target.value)}
                    />
                    <Button onClick={assignTask}>Assign Task</Button>
                  </div>

                  <textarea
                    value={taskNotes}
                    onChange={(event) => setTaskNotes(event.target.value)}
                    placeholder="Task notes (optional)"
                    className="min-h-20 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-brand-off-white/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/20"
                  />

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                      Assigned Tasks ({activeTasks.length})
                    </p>
                    {activeTasks.length === 0 ? (
                      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-brand-off-white/70">
                        No tasks assigned yet.
                      </p>
                    ) : (
                      activeTasks.map((task) => (
                        <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                          <p className="font-semibold text-white">{task.title}</p>
                          <p className="text-brand-off-white/75">
                            {task.assignee} · Due {task.dueDate ? formatDate(task.dueDate) : "TBD"}
                          </p>
                          {task.notes && <p className="mt-1 text-brand-off-white/65">{task.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
