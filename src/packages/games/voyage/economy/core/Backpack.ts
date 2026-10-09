import { ITEMS } from "../config/catalog";
import { ItemSpec, ItemStack } from "../domain/items";

// A ship's hold: things by kind and count, limited by the room each takes, never by how many kinds. What does
// not fit is left behind; what is taken goes all at once or not at all.
export class Backpack {
  private readonly stacks = new Map<string, number>();

  constructor(private room: number, stacks: readonly ItemStack[] = [], private readonly catalog: Readonly<Record<string, ItemSpec>> = ITEMS) {
    stacks.forEach((stack) => this.put(stack.id, stack.count));
  }

  public get capacity(): number {
    return this.room;
  }

  public get used(): number {
    let used = 0;

    this.stacks.forEach((count, id) => {
      used += (this.catalog[id]?.volume ?? 0) * count;
    });

    return used;
  }

  public get free(): number {
    return Math.max(0, this.room - this.used);
  }

  // A bigger hull: more room. A smaller one never throws anything out; it only stops new things coming in.
  public resize(room: number): void {
    this.room = room;
  }

  public count(id: string): number {
    return this.stacks.get(id) ?? 0;
  }

  // What is short of `needs`, kind by kind.
  public missing(needs: readonly ItemStack[]): ItemStack[] {
    return merge(needs).map(({ id, count }) => ({ id, count: count - this.count(id) }))
.filter((short) => short.count > 0);
  }

  public has(needs: readonly ItemStack[]): boolean {
    return this.missing(needs).length === 0;
  }

  // Stows as many of a kind as fit; returns how many did.
  public add(id: string, count: number): number {
    const spec = this.catalog[id];

    if (!spec || count <= 0) {
      return 0;
    }

    const fits = spec.volume > 0 ? Math.min(count, Math.floor(this.free / spec.volume)) : count;

    this.put(id, fits);

    return fits;
  }

  // Takes everything in `needs`, or nothing if any of it is short.
  public take(needs: readonly ItemStack[]): boolean {
    if (!this.has(needs)) {
      return false;
    }

    merge(needs).forEach(({ id, count }) => this.put(id, -count));

    return true;
  }

  // Everything in the hold, in the catalogue's order.
  public toStacks(): ItemStack[] {
    const order = Object.keys(this.catalog);

    return [...this.stacks.entries()].map(([id, count]) => ({ id, count })).sort((first, second) => order.indexOf(first.id) - order.indexOf(second.id));
  }

  private put(id: string, change: number): void {
    if (!this.catalog[id] || !Number.isFinite(change)) {
      return;
    }

    const count = Math.max(0, Math.floor(this.count(id) + change));

    if (count > 0) {
      this.stacks.set(id, count);
    } else {
      this.stacks.delete(id);
    }
  }
}

// The same kinds added together, so a need listed twice counts twice.
const merge = (stacks: readonly ItemStack[]): ItemStack[] => {
  const totals = new Map<string, number>();

  stacks.forEach(({ id, count }) => totals.set(id, (totals.get(id) ?? 0) + count));

  return [...totals.entries()].map(([id, count]) => ({ id, count }));
};
