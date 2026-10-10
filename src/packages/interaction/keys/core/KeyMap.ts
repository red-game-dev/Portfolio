import { KeyEvent, KeyInput, KeyMapOptions, Modifier } from "../domain/types";
import { foldKey, hasModifier } from "../utils/modifiers";

// Turns key presses into what they ask for. Bindings name an intent per key (and, where a layout needs it, per
// physical key), so a component asks the map instead of comparing keys itself, and every place that reads keys
// follows the same rules: letters in either case, modifiers left to the browser where the map says so, and presses
// it should not take (typing in a field) left alone. Intents are anything but null: a name, a step, a vector.
export class KeyMap<I extends NonNullable<unknown>> {
  private readonly keys = new Map<string, I>();
  private readonly codes = new Map<string, I>();
  private readonly ignore: readonly Modifier[];
  private readonly isFolded: boolean;
  private readonly skip: ((event: KeyInput) => boolean) | null;
  private readonly isPrevented: boolean;
  private readonly isStopped: boolean;

  constructor(bindings: Readonly<Record<string, I>>, options: KeyMapOptions<I> = {}) {
    this.isFolded = options.foldCase ?? true;
    this.ignore = options.ignore ?? [];
    this.skip = options.skip ?? null;
    this.isPrevented = options.preventDefault ?? true;
    this.isStopped = options.stopPropagation ?? false;
    Object.entries(bindings).forEach(([key, intent]) => this.keys.set(this.fold(key), intent));

    if (options.codes) {
      Object.entries(options.codes).forEach(([code, intent]) => this.codes.set(code, intent));
    }
  }

  // A press's key as this map compares it, which is also how a key's release is matched to its press.
  public keyOf(event: Pick<KeyInput, "key">): string {
    return this.fold(event.key);
  }

  // What a press asks for, or null when it is not one of the map's.
  public intentOf(event: KeyInput): I | null {
    const intent = this.keys.get(this.keyOf(event)) ?? (event.code === undefined ? undefined : this.codes.get(event.code));

    if (intent === undefined || hasModifier(event, this.ignore) || this.skip?.(event) === true) {
      return null;
    }

    return intent;
  }

  // Hands every press the map knows to `act`, then handles the event as the map was set up to. Returns whether
  // the press was the map's.
  public handle(event: KeyEvent, act: (intent: I) => void): boolean {
    return this.offer(event, (intent) => {
      act(intent);

      return true;
    });
  }

  // Offers a press to `act`, which answers whether it took it. A key that means nothing right now (steering while
  // the ship is landed) is declined and the browser keeps it. Returns whether the press was taken.
  public offer(event: KeyEvent, act: (intent: I) => boolean): boolean {
    const intent = this.intentOf(event);

    if (intent === null || !act(intent)) {
      return false;
    }

    if (this.isPrevented) {
      event.preventDefault();
    }

    if (this.isStopped) {
      event.stopPropagation();
    }

    return true;
  }

  private fold(key: string): string {
    return this.isFolded ? foldKey(key) : key;
  }
}
