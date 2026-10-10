import { STANDARD_BUTTONS } from "../config/buttons";
import { GamepadBindings, GamepadButtonName, GamepadState } from "../domain/types";

// Turns a controller's buttons into what they ask for, the way a KeyMap does keys: the host names an intent per
// button, then asks the map which intents were pressed this poll, so each acts once per press, or whether one is
// held, for what lasts as long as a button is down. Two buttons may share an intent. Intents are anything but
// null: a name, a step, a vector.
export class GamepadMap<I extends NonNullable<unknown>> {
  private readonly names: GamepadButtonName[] = [];
  private readonly intents: I[] = [];
  // The list `pressed` answers with, emptied and filled again on each call.
  private readonly pressedNow: I[] = [];

  constructor(bindings: GamepadBindings<I>) {
    this.bind(bindings);
  }

  // What a button asks for, or null when it is not one of the map's.
  public intentOf(button: GamepadButtonName): I | null {
    const index = this.names.indexOf(button);

    return index < 0 ? null : this.intents[index];
  }

  // The intents whose buttons went down this poll, each once, in the order of the standard layout. The list is the
  // map's own and is filled again by the next call, so a poll allocates nothing; read it before then.
  public pressed(state: GamepadState): readonly I[] {
    this.pressedNow.length = 0;

    for (let index = 0; index < this.names.length; index += 1) {
      const intent = this.intents[index];

      if (state.buttons[this.names[index]].wentDown && !this.pressedNow.includes(intent)) {
        this.pressedNow.push(intent);
      }
    }

    return this.pressedNow;
  }

  // Whether any button bound to `intent` is held.
  public isHeld(state: GamepadState, intent: I): boolean {
    for (let index = 0; index < this.names.length; index += 1) {
      if (this.intents[index] === intent && state.buttons[this.names[index]].isDown) {
        return true;
      }
    }

    return false;
  }

  private bind(bindings: GamepadBindings<I>): void {
    for (const name of STANDARD_BUTTONS) {
      const intent = bindings[name];

      if (intent !== undefined) {
        this.names.push(name);
        this.intents.push(intent);
      }
    }
  }
}
