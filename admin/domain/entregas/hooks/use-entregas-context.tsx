"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

export interface DeliveryTask {
  id: string;
  title: string;
  assignee: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

interface EntregasContextValue {
  monthCursor: Date;
  industry: string;
  status: string;
  selectedDate: string | null;
  modalDate: string | null;
  taskMilestoneId: string;
  taskTitle: string;
  taskAssignee: string;
  taskDueDate: string;
  taskNotes: string;
  tasksByMilestone: Record<string, DeliveryTask[]>;
}

type EntregasEvent =
  | { type: "SET_MONTH_CURSOR"; value: Date }
  | { type: "GO_PREV_MONTH" }
  | { type: "GO_NEXT_MONTH" }
  | { type: "SET_INDUSTRY"; value: string }
  | { type: "SET_STATUS"; value: string }
  | { type: "SET_SELECTED_DATE"; value: string | null }
  | { type: "SET_MODAL_DATE"; value: string | null }
  | { type: "SET_TASK_MILESTONE_ID"; value: string }
  | { type: "SET_TASK_TITLE"; value: string }
  | { type: "SET_TASK_ASSIGNEE"; value: string }
  | { type: "SET_TASK_DUE_DATE"; value: string }
  | { type: "SET_TASK_NOTES"; value: string }
  | { type: "ADD_TASK"; milestoneId: string; task: DeliveryTask }
  | { type: "RESET_TASK_FORM" };

const entregasMachine = createMachine({
  types: {} as {
    context: EntregasContextValue;
    events: EntregasEvent;
  },
  id: "entregas_machine",
  initial: "ready",
  context: {
    monthCursor: new Date(),
    industry: "Todas",
    status: "Todos",
    selectedDate: null,
    modalDate: null,
    taskMilestoneId: "",
    taskTitle: "",
    taskAssignee: "",
    taskDueDate: "",
    taskNotes: "",
    tasksByMilestone: {},
  },
  states: {
    ready: {
      on: {
        SET_MONTH_CURSOR: {
          actions: assign(({ event }) =>
            event.type === "SET_MONTH_CURSOR" ? { monthCursor: event.value } : {},
          ),
        },
        GO_PREV_MONTH: {
          actions: assign(({ context }) => ({
            monthCursor: new Date(
              context.monthCursor.getFullYear(),
              context.monthCursor.getMonth() - 1,
              1,
            ),
          })),
        },
        GO_NEXT_MONTH: {
          actions: assign(({ context }) => ({
            monthCursor: new Date(
              context.monthCursor.getFullYear(),
              context.monthCursor.getMonth() + 1,
              1,
            ),
          })),
        },
        SET_INDUSTRY: {
          actions: assign(({ event }) =>
            event.type === "SET_INDUSTRY" ? { industry: event.value } : {},
          ),
        },
        SET_STATUS: {
          actions: assign(({ event }) =>
            event.type === "SET_STATUS" ? { status: event.value } : {},
          ),
        },
        SET_SELECTED_DATE: {
          actions: assign(({ event }) =>
            event.type === "SET_SELECTED_DATE" ? { selectedDate: event.value } : {},
          ),
        },
        SET_MODAL_DATE: {
          actions: assign(({ event }) =>
            event.type === "SET_MODAL_DATE" ? { modalDate: event.value } : {},
          ),
        },
        SET_TASK_MILESTONE_ID: {
          actions: assign(({ event }) =>
            event.type === "SET_TASK_MILESTONE_ID"
              ? { taskMilestoneId: event.value }
              : {},
          ),
        },
        SET_TASK_TITLE: {
          actions: assign(({ event }) =>
            event.type === "SET_TASK_TITLE" ? { taskTitle: event.value } : {},
          ),
        },
        SET_TASK_ASSIGNEE: {
          actions: assign(({ event }) =>
            event.type === "SET_TASK_ASSIGNEE" ? { taskAssignee: event.value } : {},
          ),
        },
        SET_TASK_DUE_DATE: {
          actions: assign(({ event }) =>
            event.type === "SET_TASK_DUE_DATE" ? { taskDueDate: event.value } : {},
          ),
        },
        SET_TASK_NOTES: {
          actions: assign(({ event }) =>
            event.type === "SET_TASK_NOTES" ? { taskNotes: event.value } : {},
          ),
        },
        ADD_TASK: {
          actions: assign(({ context, event }) => {
            if (event.type !== "ADD_TASK") return {};

            const current = context.tasksByMilestone[event.milestoneId] || [];
            return {
              tasksByMilestone: {
                ...context.tasksByMilestone,
                [event.milestoneId]: [event.task, ...current],
              },
            };
          }),
        },
        RESET_TASK_FORM: {
          actions: assign(() => ({
            taskTitle: "",
            taskAssignee: "",
            taskNotes: "",
          })),
        },
      },
    },
  },
});

const split = createSplitContext<EntregasContextValue, (event: EntregasEvent) => void>(
  "Entregas",
);

export function EntregasProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(entregasMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useEntregasState = split.useStateContext;
export const useEntregasDispatch = split.useDispatchContext;
