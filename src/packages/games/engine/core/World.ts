import { Entity } from "../domain/types";
import { ComponentStore } from "./ComponentStore";

// The game's entities and one store per kind of component, typed by the stores it is made with, so
// `world.stores.body.get(id)` is a `Body` with no casting anywhere. Despawning is deferred to `flush`, which the
// host calls once a step: systems can despawn freely while others walk the same stores.
export class World<TStores extends Record<string, ComponentStore<unknown>>> {
  public readonly stores: TStores;
  private readonly doomed = new Set<Entity>();
  private readonly alive = new Set<Entity>();
  private nextId = 1;

  constructor(stores: TStores) {
    this.stores = stores;
  }

  public get count(): number {
    return this.alive.size;
  }

  public spawn(): Entity {
    const entity = this.nextId;

    this.nextId += 1;
    this.alive.add(entity);

    return entity;
  }

  public isAlive(entity: Entity): boolean {
    return this.alive.has(entity) && !this.doomed.has(entity);
  }

  public despawn(entity: Entity): void {
    if (this.alive.has(entity)) {
      this.doomed.add(entity);
    }
  }

  public flush(): void {
    if (this.doomed.size === 0) {
      return;
    }

    const stores = Object.values(this.stores);

    this.doomed.forEach((entity) => {
      stores.forEach((store) => store.remove(entity));
      this.alive.delete(entity);
    });
    this.doomed.clear();
  }

  public clear(): void {
    Object.values(this.stores).forEach((store) => store.clear());
    this.alive.clear();
    this.doomed.clear();
  }
}
