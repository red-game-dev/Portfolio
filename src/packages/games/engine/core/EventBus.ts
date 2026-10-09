// Typed events between systems, and from the game to its renderer and its UI: each event name has one payload
// type, checked at compile time on both ends. Delivery is immediate; a handler that changes the world should
// go through deferred operations (despawn) so it never disturbs a system mid walk.
export class EventBus<TEvents extends object> {
  private readonly handlers: { [K in keyof TEvents]?: Array<(payload: TEvents[K]) => void> } = {};

  public on<K extends keyof TEvents>(type: K, handler: (payload: TEvents[K]) => void): () => void {
    const list = this.handlers[type] ?? [];

    list.push(handler);
    this.handlers[type] = list;

    return () => {
      const current = this.handlers[type];

      if (current) {
        this.handlers[type] = current.filter((candidate) => candidate !== handler);
      }
    };
  }

  public emit<K extends keyof TEvents>(type: K, payload: TEvents[K]): void {
    this.handlers[type]?.forEach((handler) => handler(payload));
  }
}
