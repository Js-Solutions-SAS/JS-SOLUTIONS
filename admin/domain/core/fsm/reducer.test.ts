import { describe, expect, it } from "vitest";

import { createGuardedReducer } from "@/domain/core/fsm/reducer";

type State = {
  status: "idle" | "running";
};

type Event =
  | { type: "START" }
  | { type: "STOP" };

const reducer = createGuardedReducer<State, Event>((state, event) => {
  if (state.status === "idle" && event.type === "START") {
    return { status: "running" };
  }

  if (state.status === "running" && event.type === "STOP") {
    return { status: "idle" };
  }

  return state;
});

describe("createGuardedReducer", () => {
  it("aplica transición válida", () => {
    expect(reducer({ status: "idle" }, { type: "START" })).toEqual({ status: "running" });
  });

  it("bloquea transición inválida", () => {
    expect(reducer({ status: "idle" }, { type: "STOP" })).toEqual({ status: "idle" });
  });
});
