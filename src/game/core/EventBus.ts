type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<T = any>(event: string, callback: EventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<T = any>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (set) {
      // iterate over a copy to allow listeners to unsubscribe during event handling
      const callbacks = Array.from(set);
      for (const cb of callbacks) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in EventBus handler for event "${event}":`, err);
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const globalEvents = new EventBus();
