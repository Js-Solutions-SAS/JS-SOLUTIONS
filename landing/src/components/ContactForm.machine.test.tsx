import { createActor, fromPromise } from "xstate";
import { describe, expect, it } from "vitest";

import { contactFormMachine } from "@/components/ContactForm";

describe("contactFormMachine", () => {
  it("bloquea submit con datos inválidos", () => {
    const actor = createActor(contactFormMachine);
    actor.start();

    actor.send({ type: "SUBMIT" });

    const snapshot = actor.getSnapshot();
    expect(snapshot.matches("failure")).toBe(true);
    expect(snapshot.context.feedbackType).toBe("error");
  });

  it("permite submit válido y termina en success", async () => {
    const machine = contactFormMachine.provide({
      actors: {
        submit: fromPromise(async () => ({ ok: true, message: "ok" })),
      },
    });

    const actor = createActor(machine);
    actor.start();

    actor.send({ type: "SET_NAME", value: "Ada Lovelace" });
    actor.send({ type: "SET_EMAIL", value: "ada@example.com" });
    actor.send({ type: "SET_MESSAGE", value: "Necesito información" });
    actor.send({ type: "SUBMIT" });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const snapshot = actor.getSnapshot();
    expect(snapshot.matches("success")).toBe(true);
    expect(snapshot.context.feedbackType).toBe("ok");
  });
});
