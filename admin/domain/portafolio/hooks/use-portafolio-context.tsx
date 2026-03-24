"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

interface PortafolioContextValue {
  industryFilter: string;
  healthFilter: string;
  search: string;
  selectedEntryId: string | null;
}

type PortafolioEvent =
  | { type: "SET_INDUSTRY_FILTER"; value: string }
  | { type: "SET_HEALTH_FILTER"; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_SELECTED_ENTRY_ID"; value: string | null };

const portafolioMachine = createMachine({
  types: {} as {
    context: PortafolioContextValue;
    events: PortafolioEvent;
  },
  id: "portafolio_machine",
  initial: "ready",
  context: {
    industryFilter: "Todas",
    healthFilter: "Todas",
    search: "",
    selectedEntryId: null,
  },
  states: {
    ready: {
      on: {
        SET_INDUSTRY_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_INDUSTRY_FILTER"
              ? { industryFilter: event.value }
              : {},
          ),
        },
        SET_HEALTH_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_HEALTH_FILTER" ? { healthFilter: event.value } : {},
          ),
        },
        SET_SEARCH: {
          actions: assign(({ event }) =>
            event.type === "SET_SEARCH" ? { search: event.value } : {},
          ),
        },
        SET_SELECTED_ENTRY_ID: {
          actions: assign(({ event }) =>
            event.type === "SET_SELECTED_ENTRY_ID" ? { selectedEntryId: event.value } : {},
          ),
        },
      },
    },
  },
});

const split = createSplitContext<PortafolioContextValue, (event: PortafolioEvent) => void>(
  "Portafolio",
);

export function PortafolioProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(portafolioMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const usePortafolioState = split.useStateContext;
export const usePortafolioDispatch = split.useDispatchContext;
