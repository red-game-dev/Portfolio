import { KeyInput } from "../domain/types";
import { KeyMap } from "./KeyMap";

// Which of a map's keys are down, for input that lasts as long as a key is held (turning, thrust, braking). A key
// counts once however often the keyboard repeats it, two keys bound to one intent (an arrow and a letter) hold it
// until both are up, and a key is let go whatever modifiers are down by the time it comes up. Pressing, letting go
// and reading allocate nothing.
export class HeldKeys<I extends NonNullable<unknown>> {
  private readonly map: KeyMap<I>;
  private readonly held = new Map<string, I>();
  private readonly counts = new Map<I, number>();

  constructor(map: KeyMap<I>) {
    this.map = map;
  }

  // How many keys are down.
  public get size(): number {
    return this.held.size;
  }

  // A key going down. Returns the intent it holds, or null when it is not one of the map's.
  public press(event: KeyInput): I | null {
    const intent = this.map.intentOf(event);

    if (intent === null) {
      return null;
    }

    const key = this.map.keyOf(event);

    if (!this.held.has(key)) {
      this.held.set(key, intent);
      this.counts.set(intent, (this.counts.get(intent) ?? 0) + 1);
    }

    return intent;
  }

  // A key coming up. Returns whether it was held.
  public release(event: Pick<KeyInput, "key">): boolean {
    const key = this.map.keyOf(event);
    const intent = this.held.get(key);

    if (intent === undefined) {
      return false;
    }

    const count = (this.counts.get(intent) ?? 1) - 1;

    this.held.delete(key);

    if (count > 0) {
      this.counts.set(intent, count);
    } else {
      this.counts.delete(intent);
    }

    return true;
  }

  public isHeld(intent: I): boolean {
    return this.counts.has(intent);
  }

  // Which of two opposite intents is held: -1 for `negative`, 1 for `positive`, 0 for neither or both.
  public axis(negative: I, positive: I): number {
    return (this.isHeld(positive) ? 1 : 0) - (this.isHeld(negative) ? 1 : 0);
  }

  // Lets every key go, as when a run starts afresh.
  public clear(): void {
    this.held.clear();
    this.counts.clear();
  }
}
