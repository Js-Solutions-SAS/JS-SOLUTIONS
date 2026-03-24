import type { DomainEvent, DomainEventHandler } from "./types";

interface DomainEventBus {
  publish: (event: DomainEvent) => void;
  subscribe: (eventName: string, handler: DomainEventHandler) => () => void;
}

class PubSubBus implements DomainEventBus {
  private handlers = new Map<string, Set<DomainEventHandler>>();

  publish(event: DomainEvent) {
    const entries = this.handlers.get(event.eventName);
    if (!entries) return;

    entries.forEach((handler) => handler(event));
  }

  subscribe(eventName: string, handler: DomainEventHandler) {
    const current = this.handlers.get(eventName) ?? new Set<DomainEventHandler>();
    current.add(handler);
    this.handlers.set(eventName, current);

    return () => {
      const entries = this.handlers.get(eventName);
      if (!entries) return;
      entries.delete(handler);
      if (entries.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }
}

class CustomEventBus implements DomainEventBus {
  private target: EventTarget;

  constructor(target: EventTarget = window) {
    this.target = target;
  }

  publish(event: DomainEvent) {
    this.target.dispatchEvent(new CustomEvent(event.eventName, { detail: event }));
  }

  subscribe(eventName: string, handler: DomainEventHandler) {
    const listener = (incoming: Event) => {
      const custom = incoming as CustomEvent<DomainEvent>;
      if (!custom.detail) return;
      handler(custom.detail);
    };

    this.target.addEventListener(eventName, listener as EventListener);

    return () => {
      this.target.removeEventListener(eventName, listener as EventListener);
    };
  }
}

export function createDualEventBus(target?: EventTarget): DomainEventBus {
  const pubsub = new PubSubBus();
  const custom =
    typeof window !== "undefined" ? new CustomEventBus(target ?? window) : null;

  return {
    publish(event) {
      pubsub.publish(event);
      custom?.publish(event);
    },
    subscribe(eventName, handler) {
      const recentlySeen = new Set<string>();
      const dedupedHandler: DomainEventHandler = (event) => {
        const fingerprint = `${event.eventName}:${event.correlationId}:${event.timestamp}`;
        if (recentlySeen.has(fingerprint)) {
          return;
        }

        recentlySeen.add(fingerprint);
        queueMicrotask(() => {
          recentlySeen.delete(fingerprint);
        });

        handler(event);
      };

      const unsubscribers: Array<() => void> = [pubsub.subscribe(eventName, dedupedHandler)];
      if (custom) {
        unsubscribers.push(custom.subscribe(eventName, dedupedHandler));
      }

      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    },
  };
}

export type { DomainEventBus };
