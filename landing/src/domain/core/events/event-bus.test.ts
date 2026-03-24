import { describe, expect, it, vi } from "vitest";

import {
  createDomainEvent,
  parseVersionedEventName,
  toVersionedEventName,
} from "@/domain/core/events/types";
import { createDualEventBus } from "@/domain/core/events/event-bus";

describe("landing createDualEventBus", () => {
  it("evita eventos duplicados al combinar PubSub + CustomEvent", async () => {
    const bus = createDualEventBus(new EventTarget());
    const handler = vi.fn();

    const unsubscribe = bus.subscribe("lead_submitted", handler);
    bus.publish(createDomainEvent("landing.contact", "lead_submitted", { id: "l-1" }));

    await Promise.resolve();
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("parsea eventos versionados para política de deprecación", () => {
    const name = toVersionedEventName("landing.quote.generated", 3);
    const parsed = parseVersionedEventName(name);

    expect(parsed).toEqual({
      baseName: "landing.quote.generated",
      version: 3,
    });
  });
});
