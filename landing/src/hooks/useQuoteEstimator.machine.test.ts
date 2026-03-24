import { createActor, fromPromise } from "xstate";
import { describe, expect, it } from "vitest";

import { quoteEstimatorMachine } from "@/hooks/useQuoteEstimator";

describe("quoteEstimatorMachine", () => {
  it("rechaza preview sin servicios seleccionados", () => {
    const actor = createActor(quoteEstimatorMachine);
    actor.start();

    actor.send({ type: "SET_EMAIL", value: "demo@example.com" });
    actor.send({ type: "SUBMIT_PREVIEW" });

    const snapshot = actor.getSnapshot();
    expect(snapshot.matches("failure")).toBe(true);
    expect(snapshot.context.formMessage).toContain("Selecciona al menos un servicio");
  });

  it("genera preview en flujo válido", async () => {
    const machine = quoteEstimatorMachine.provide({
      actors: {
        submit: fromPromise(async () => ({
          nextLeadId: "lead-1",
          quoteId: "quote-1",
          previewPdfUrl: "https://example.com/preview",
          mode: "preview" as const,
        })),
      },
    });

    const actor = createActor(machine);
    actor.start();

    actor.send({ type: "TOGGLE_SERVICE", serviceId: "autom" });
    actor.send({ type: "SET_EMAIL", value: "demo@example.com" });
    actor.send({ type: "SUBMIT_PREVIEW" });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const snapshot = actor.getSnapshot();
    expect(snapshot.matches("preview_ready")).toBe(true);
    expect(snapshot.context.quoteId).toBe("quote-1");
  });
});
