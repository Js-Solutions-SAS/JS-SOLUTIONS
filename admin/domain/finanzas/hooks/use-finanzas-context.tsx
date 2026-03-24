"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

interface FinanzasContextValue {
  clientTypeFilter: string;
  billingFilter: string;
  search: string;
  selectedEntryId: string | null;
}

type FinanzasEvent =
  | { type: "SET_CLIENT_TYPE_FILTER"; value: string }
  | { type: "SET_BILLING_FILTER"; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_SELECTED_ENTRY_ID"; value: string | null };

const finanzasMachine = createMachine({
  types: {} as {
    context: FinanzasContextValue;
    events: FinanzasEvent;
  },
  id: "finanzas_machine",
  initial: "ready",
  context: {
    clientTypeFilter: "Todos",
    billingFilter: "Todos",
    search: "",
    selectedEntryId: null,
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
        SET_BILLING_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_BILLING_FILTER" ? { billingFilter: event.value } : {},
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

const split = createSplitContext<FinanzasContextValue, (event: FinanzasEvent) => void>(
  "Finanzas",
);

export function FinanzasProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(finanzasMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useFinanzasState = split.useStateContext;
export const useFinanzasDispatch = split.useDispatchContext;
