import { describe, expect, it } from "vitest";

import { createGuardedReducer } from "@/domain/core/fsm/reducer";

type State = {
  value: number;
};

type Event =
  | { type: "INC" }
  | { type: "DEC" };

const reducer = createGuardedReducer<State, Event>((state, event) => {
  if (event.type === "INC") {
    return { value: state.value + 1 };
  }

  if (event.type === "DEC" && state.value > 0) {
    return { value: state.value - 1 };
  }

  return state;
});

describe("landing createGuardedReducer", () => {
  it("incrementa cuando el evento es válido", () => {
    expect(reducer({ value: 0 }, { type: "INC" })).toEqual({ value: 1 });
  });

  it("bloquea decremento debajo de cero", () => {
    expect(reducer({ value: 0 }, { type: "DEC" })).toEqual({ value: 0 });
  });
});
