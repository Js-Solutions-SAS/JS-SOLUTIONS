"use client";

import { type PropsWithChildren, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";
import type { ChangeRequest, ChangeRequestStatus } from "@/lib/types";

interface CambiosContextValue {
  items: ChangeRequest[];
  workerFilteredItems: ChangeRequest[];
  projectFilter: string;
  statusFilter: string;
  typeFilter: string;
  search: string;
  runningId: string | null;
  selectedItemId: string | null;
}

type CambiosEvent =
  | { type: "INIT_ITEMS"; items: ChangeRequest[] }
  | { type: "SET_WORKER_FILTERED_ITEMS"; items: ChangeRequest[] }
  | { type: "SET_PROJECT_FILTER"; value: string }
  | { type: "SET_STATUS_FILTER"; value: string }
  | { type: "SET_TYPE_FILTER"; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_RUNNING_ID"; value: string | null }
  | { type: "SET_SELECTED_ITEM_ID"; value: string | null }
  | {
      type: "MARK_DECISION";
      changeRequestId: string;
      status: ChangeRequestStatus;
    };

export const cambiosMachine = createMachine({
  types: {} as {
    context: CambiosContextValue;
    events: CambiosEvent;
  },
  id: "cambios_machine",
  initial: "ready",
  context: {
    items: [],
    workerFilteredItems: [],
    projectFilter: "Todos",
    statusFilter: "Todos",
    typeFilter: "Todos",
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
        SET_STATUS_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_STATUS_FILTER" ? { statusFilter: event.value } : {},
          ),
        },
        SET_TYPE_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_TYPE_FILTER" ? { typeFilter: event.value } : {},
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
        MARK_DECISION: {
          actions: assign(({ context, event }) => {
            if (event.type !== "MARK_DECISION") return {};

            return {
              items: context.items.map((item) =>
                item.id === event.changeRequestId
                  ? {
                      ...item,
                      status: event.status,
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

const split = createSplitContext<CambiosContextValue, (event: CambiosEvent) => void>("Cambios");

export function CambiosProvider({
  initialItems,
  children,
}: PropsWithChildren<{ initialItems: ChangeRequest[] }>) {
  const [state, send] = useMachine(cambiosMachine);

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

export const useCambiosState = split.useStateContext;
export const useCambiosDispatch = split.useDispatchContext;
