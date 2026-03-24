"use client";

import { type PropsWithChildren, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";
import type { ApprovalItem, ApprovalStatus } from "@/lib/types";

interface AprobacionesContextValue {
  items: ApprovalItem[];
  workerFilteredItems: ApprovalItem[];
  projectFilter: string;
  stageFilter: string;
  statusFilter: string;
  search: string;
  runningId: string | null;
  selectedItemId: string | null;
}

type AprobacionesEvent =
  | { type: "INIT_ITEMS"; items: ApprovalItem[] }
  | { type: "SET_WORKER_FILTERED_ITEMS"; items: ApprovalItem[] }
  | { type: "SET_PROJECT_FILTER"; value: string }
  | { type: "SET_STAGE_FILTER"; value: string }
  | { type: "SET_STATUS_FILTER"; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_RUNNING_ID"; value: string | null }
  | { type: "SET_SELECTED_ITEM_ID"; value: string | null }
  | {
      type: "MARK_APPROVED";
      approvalId: string;
      status: ApprovalStatus;
      approvedAt?: string;
    };

export const aprobacionesMachine = createMachine({
  types: {} as {
    context: AprobacionesContextValue;
    events: AprobacionesEvent;
  },
  id: "aprobaciones_machine",
  initial: "ready",
  context: {
    items: [],
    workerFilteredItems: [],
    projectFilter: "Todos",
    stageFilter: "Todos",
    statusFilter: "Todos",
    search: "",
    runningId: null,
    selectedItemId: null,
  },
  states: {
    ready: {
      on: {
        INIT_ITEMS: {
          actions: assign(({ context, event }) => {
            if (event.type !== "INIT_ITEMS") return {};

            const ids = new Set(event.items.map((item) => item.id));
            const selectedItemId =
              context.selectedItemId && ids.has(context.selectedItemId)
                ? context.selectedItemId
                : null;

            return {
              items: event.items,
              workerFilteredItems: event.items,
              selectedItemId,
            };
          }),
        },
        SET_WORKER_FILTERED_ITEMS: {
          actions: assign(({ event }) =>
            event.type === "SET_WORKER_FILTERED_ITEMS"
              ? { workerFilteredItems: event.items }
              : {},
          ),
        },
        SET_PROJECT_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_PROJECT_FILTER" ? { projectFilter: event.value } : {},
          ),
        },
        SET_STAGE_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_STAGE_FILTER" ? { stageFilter: event.value } : {},
          ),
        },
        SET_STATUS_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_STATUS_FILTER" ? { statusFilter: event.value } : {},
          ),
        },
        SET_SEARCH: {
          actions: assign(({ event }) =>
            event.type === "SET_SEARCH" ? { search: event.value } : {},
          ),
        },
        SET_RUNNING_ID: {
          actions: assign(({ event }) =>
            event.type === "SET_RUNNING_ID" ? { runningId: event.value } : {},
          ),
        },
        SET_SELECTED_ITEM_ID: {
          actions: assign(({ event }) =>
            event.type === "SET_SELECTED_ITEM_ID" ? { selectedItemId: event.value } : {},
          ),
        },
        MARK_APPROVED: {
          actions: assign(({ context, event }) => {
            if (event.type !== "MARK_APPROVED") return {};

            return {
              items: context.items.map((item) =>
                item.id === event.approvalId
                  ? {
                      ...item,
                      status: event.status,
                      approvedAt: event.approvedAt,
                    }
                  : item,
              ),
            };
          }),
        },
      },
    },
  },
});

const split = createSplitContext<AprobacionesContextValue, (event: AprobacionesEvent) => void>(
  "Aprobaciones",
);

export function AprobacionesProvider({
  initialItems,
  children,
}: PropsWithChildren<{ initialItems: ApprovalItem[] }>) {
  const [state, send] = useMachine(aprobacionesMachine);

  useEffect(() => {
    send({
      type: "INIT_ITEMS",
      items: initialItems,
    });
  }, [initialItems, send]);

  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useAprobacionesState = split.useStateContext;
export const useAprobacionesDispatch = split.useDispatchContext;
