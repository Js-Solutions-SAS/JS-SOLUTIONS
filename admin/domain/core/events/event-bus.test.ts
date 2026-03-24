import { describe, expect, it, vi } from "vitest";

import {
  createDomainEvent,
  parseVersionedEventName,
  toVersionedEventName,
} from "@/domain/core/events/types";
import { createDualEventBus } from "@/domain/core/events/event-bus";

describe("createDualEventBus", () => {
  it("publica una sola vez por evento al suscriptor", async () => {
    const bus = createDualEventBus(new EventTarget());
    const handler = vi.fn();

    const unsubscribe = bus.subscribe("quote.generated", handler);
    bus.publish(
      createDomainEvent("admin.cotizaciones", "quote.generated", { id: "q-1" }),
    );

    await Promise.resolve();
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("deja de emitir tras unsubscribe", async () => {
    const bus = createDualEventBus(new EventTarget());
    const handler = vi.fn();

    const unsubscribe = bus.subscribe("lead.created", handler);
    unsubscribe();

    bus.publish(createDomainEvent("admin.cotizaciones", "lead.created", { id: "l-1" }));

    await Promise.resolve();
    expect(handler).not.toHaveBeenCalled();
  });

  it("soporta nombres de evento versionados", () => {
    const eventName = toVersionedEventName("quotes.generated", 2);
    const parsed = parseVersionedEventName(eventName);

    expect(parsed).toEqual({
      baseName: "quotes.generated",
      version: 2,
    });
  });
});
