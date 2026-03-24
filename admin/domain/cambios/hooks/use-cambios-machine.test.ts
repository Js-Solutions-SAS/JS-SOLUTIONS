import { createActor } from "xstate";
import { describe, expect, it } from "vitest";

import { cambiosMachine } from "@/domain/cambios/hooks/use-cambios-context";
import type { ChangeRequest } from "@/lib/types";

function makeChange(id: string): ChangeRequest {
  return {
    id,
    projectId: "p-1",
    projectName: "Proyecto Demo",
    clientName: "Cliente Demo",
    industry: "Technology",
    owner: "owner@demo.com",
    type: "Technical",
    status: "Pending Review",
    title: "Cambio de arquitectura",
    description: "Ajustar integración y contratos internos",
    requestedAt: "2026-03-24T00:00:00.000Z",
    baselineCost: 1000000,
    proposedCost: 1300000,
    baselineDueDate: "2026-04-01",
    proposedDueDate: "2026-04-05",
  };
}

describe("cambiosMachine", () => {
  it("actualiza decisión de solicitud existente", () => {
    const actor = createActor(cambiosMachine);
    actor.start();

    actor.send({ type: "INIT_ITEMS", items: [makeChange("c-1")] });
    actor.send({
      type: "MARK_DECISION",
      changeRequestId: "c-1",
      status: "Approved",
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.items[0]?.status).toBe("Approved");
  });

  it("mantiene estado cuando la solicitud no existe", () => {
    const actor = createActor(cambiosMachine);
    actor.start();

    actor.send({ type: "INIT_ITEMS", items: [makeChange("c-1")] });
    actor.send({
      type: "MARK_DECISION",
      changeRequestId: "c-404",
      status: "Rejected",
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.items[0]?.status).toBe("Pending Review");
  });
});
