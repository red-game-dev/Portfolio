import { Entity } from "../domain/types";

// One kind of component for every entity that has it, as a sparse set: values packed in a dense array (fast to
// walk, friendly to the cache), a map from entity to slot (fast to look up), and removal by swapping the last
// value into the hole, so it costs the same however many there are.
export class ComponentStore<T> {
  private readonly packed: T[] = [];
  private readonly owners: Entity[] = [];
  private readonly slots = new Map<Entity, number>();

  public get size(): number {
    return this.packed.length;
  }

  // Walked by systems directly; do not change while walking, despawn through the world instead.
  public get entities(): readonly Entity[] {
    return this.owners;
  }

  public get values(): readonly T[] {
    return this.packed;
  }

  public has(entity: Entity): boolean {
    return this.slots.has(entity);
  }

  public get(entity: Entity): T | undefined {
    const slot = this.slots.get(entity);

    return slot === undefined ? undefined : this.packed[slot];
  }

  public set(entity: Entity, value: T): T {
    const slot = this.slots.get(entity);

    if (slot === undefined) {
      this.slots.set(entity, this.packed.length);
      this.packed.push(value);
      this.owners.push(entity);
    } else {
      this.packed[slot] = value;
    }

    return value;
  }

  public remove(entity: Entity): void {
    const slot = this.slots.get(entity);

    if (slot === undefined) {
      return;
    }

    const last = this.packed.length - 1;

    if (slot !== last) {
      this.packed[slot] = this.packed[last];
      this.owners[slot] = this.owners[last];
      this.slots.set(this.owners[slot], slot);
    }

    this.packed.pop();
    this.owners.pop();
    this.slots.delete(entity);
  }

  public clear(): void {
    this.packed.length = 0;
    this.owners.length = 0;
    this.slots.clear();
  }
}
