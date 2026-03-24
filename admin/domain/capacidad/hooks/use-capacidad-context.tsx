"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

interface CapacidadContextValue {
  roleFilter: string;
  bandFilter: string;
  selectedEntryId: string | null;
}

type CapacidadEvent =
  | { type: "SET_ROLE_FILTER"; value: string }
  | { type: "SET_BAND_FILTER"; value: string }
  | { type: "SET_SELECTED_ENTRY_ID"; value: string | null };

const capacidadMachine = createMachine({
  types: {} as {
    context: CapacidadContextValue;
    events: CapacidadEvent;
  },
  id: "capacidad_machine",
  initial: "ready",
  context: {
    roleFilter: "Todos",
    bandFilter: "Todos",
    selectedEntryId: null,
  },
  states: {
    ready: {
      on: {
        SET_ROLE_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_ROLE_FILTER" ? { roleFilter: event.value } : {},
          ),
        },
        SET_BAND_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_BAND_FILTER" ? { bandFilter: event.value } : {},
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

const split = createSplitContext<CapacidadContextValue, (event: CapacidadEvent) => void>(
  "Capacidad",
);

export function CapacidadProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(capacidadMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useCapacidadState = split.useStateContext;
export const useCapacidadDispatch = split.useDispatchContext;
