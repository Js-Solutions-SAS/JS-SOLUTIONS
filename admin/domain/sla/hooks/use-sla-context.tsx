"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

interface SlaContextValue {
  clientTypeFilter: string;
  statusFilter: string;
  priorityFilter: string;
  search: string;
  selectedItemId: string | null;
}

type SlaEvent =
  | { type: "SET_CLIENT_TYPE_FILTER"; value: string }
  | { type: "SET_STATUS_FILTER"; value: string }
  | { type: "SET_PRIORITY_FILTER"; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_SELECTED_ITEM_ID"; value: string | null };

const slaMachine = createMachine({
  types: {} as {
    context: SlaContextValue;
    events: SlaEvent;
  },
  id: "sla_machine",
  initial: "ready",
  context: {
    clientTypeFilter: "Todos",
    statusFilter: "Todos",
    priorityFilter: "Todos",
    search: "",
    selectedItemId: null,
  },
  states: {
    ready: {
      on: {
        SET_CLIENT_TYPE_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_CLIENT_TYPE_FILTER"
              ? { clientTypeFilter: event.value }
              : {},
          ),
        },
        SET_STATUS_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_STATUS_FILTER" ? { statusFilter: event.value } : {},
          ),
        },
        SET_PRIORITY_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_PRIORITY_FILTER" ? { priorityFilter: event.value } : {},
          ),
        },
        SET_SEARCH: {
          actions: assign(({ event }) =>
            event.type === "SET_SEARCH" ? { search: event.value } : {},
          ),
        },
        SET_SELECTED_ITEM_ID: {
          actions: assign(({ event }) =>
            event.type === "SET_SELECTED_ITEM_ID" ? { selectedItemId: event.value } : {},
          ),
        },
      },
    },
  },
});

const split = createSplitContext<SlaContextValue, (event: SlaEvent) => void>("SLA");

export function SlaProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(slaMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useSlaState = split.useStateContext;
export const useSlaDispatch = split.useDispatchContext;
