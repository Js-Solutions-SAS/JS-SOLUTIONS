import { createActor } from "xstate";
import { describe, expect, it } from "vitest";

import { aprobacionesMachine } from "@/domain/aprobaciones/hooks/use-aprobaciones-context";
import type { ApprovalItem } from "@/lib/types";

function makeApproval(id: string): ApprovalItem {
  return {
    id,
    projectId: "p-1",
    projectName: "Proyecto Demo",
    clientName: "Cliente Demo",
    industry: "Technology",
    owner: "owner@demo.com",
    stage: "QA",
    status: "Pending",
    requestedAt: "2026-03-24T00:00:00.000Z",
    dueDate: "2026-03-30T00:00:00.000Z",
    title: "Checkpoint QA",
  };
}

describe("aprobacionesMachine", () => {
  it("actualiza estado de aprobación existente", () => {
    const actor = createActor(aprobacionesMachine);
    actor.start();

    actor.send({ type: "INIT_ITEMS", items: [makeApproval("a-1")] });
    actor.send({
      type: "MARK_APPROVED",
      approvalId: "a-1",
      status: "Approved",
      approvedAt: "2026-03-24T10:00:00.000Z",
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.items[0]?.status).toBe("Approved");
    expect(snapshot.context.items[0]?.approvedAt).toBe("2026-03-24T10:00:00.000Z");
  });

  it("ignora MARK_APPROVED para id inexistente", () => {
    const actor = createActor(aprobacionesMachine);
    actor.start();

    actor.send({ type: "INIT_ITEMS", items: [makeApproval("a-1")] });
    actor.send({
      type: "MARK_APPROVED",
      approvalId: "a-404",
      status: "Approved",
    });

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.items[0]?.status).toBe("Pending");
  });
});
