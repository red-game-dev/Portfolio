import {
  ANY_MODIFIER,
  ARROW_STEPS,
  BROWSER_SHORTCUTS,
  foldKey,
  hasModifier,
  HeldKeys,
  HORIZONTAL_ARROWS,
  isModifierDown,
  KeyMap,
} from "@/packages/interaction/keys";

import { keyPress } from "./fixtures/events";

describe("KeyMap", () => {
  const steering = new KeyMap({ ArrowLeft: "left", ArrowRight: "right", a: "left", d: "right", Escape: "back" });

  test("names the intent of a bound key and nothing for any other", () => {
    expect(steering.intentOf(keyPress("ArrowLeft"))).toBe("left");
    expect(steering.intentOf(keyPress("d"))).toBe("right");
    expect(steering.intentOf(keyPress("Escape"))).toBe("back");
    expect(steering.intentOf(keyPress("q"))).toBeNull();
    expect(steering.intentOf(keyPress("Enter"))).toBeNull();
  });

  test("counts a letter whatever its case unless told not to, and never folds a named key", () => {
    expect(steering.intentOf(keyPress("A"))).toBe("left");
    expect(steering.keyOf({ key: "D" })).toBe("d");
    expect(new KeyMap({ W: "burn" }).intentOf(keyPress("w"))).toBe("burn");

    const exact = new KeyMap({ a: "left" }, { foldCase: false });

    expect(exact.intentOf(keyPress("A"))).toBeNull();
    expect(exact.keyOf({ key: "A" })).toBe("A");
    expect(steering.keyOf({ key: "Escape" })).toBe("Escape");
  });

  test("takes a bound key with any modifier unless the map ignores it", () => {
    expect(steering.intentOf(keyPress("a", { ctrlKey: true }))).toBe("left");

    const voyage = new KeyMap({ h: "hangar" }, { ignore: BROWSER_SHORTCUTS });

    expect(voyage.intentOf(keyPress("h", { ctrlKey: true }))).toBeNull();
    expect(voyage.intentOf(keyPress("h", { metaKey: true }))).toBeNull();
    expect(voyage.intentOf(keyPress("h", { altKey: true }))).toBeNull();
    expect(voyage.intentOf(keyPress("H", { shiftKey: true }))).toBe("hangar");
    expect(new KeyMap({ h: "hangar" }, { ignore: ANY_MODIFIER }).intentOf(keyPress("h", { shiftKey: true }))).toBeNull();
  });

  test("falls back on the physical key where the typed one is not bound", () => {
    const shortcut = new KeyMap({ "`": "open", "/": "open" }, { codes: { Backquote: "open" } });

    expect(shortcut.intentOf(keyPress("`"))).toBe("open");
    expect(shortcut.intentOf(keyPress("/"))).toBe("open");
    expect(shortcut.intentOf(keyPress("Dead", { code: "Backquote" }))).toBe("open");
    expect(shortcut.intentOf(keyPress("Dead", { code: "KeyQ" }))).toBeNull();
  });

  test("leaves alone the presses its skip rules out", () => {
    const field = document.createElement("input");
    const map = new KeyMap(HORIZONTAL_ARROWS, { skip: (event) => event.target === field });

    expect(map.intentOf(keyPress("ArrowLeft", { target: field }))).toBeNull();
    expect(map.intentOf(keyPress("ArrowLeft", { target: document.body }))).toBe(-1);
  });

  test("handles a press by stopping the browser's action and, when asked, keeping it from outer listeners", () => {
    const act = jest.fn();
    const press = keyPress("ArrowRight");

    expect(steering.handle(press, act)).toBe(true);
    expect(act).toHaveBeenCalledWith("right");
    expect(press.preventDefault).toHaveBeenCalledTimes(1);
    expect(press.stopPropagation).not.toHaveBeenCalled();

    const isolated = new KeyMap(HORIZONTAL_ARROWS, { stopPropagation: true });
    const step = keyPress("ArrowLeft");

    isolated.handle(step, act);
    expect(act).toHaveBeenLastCalledWith(-1);
    expect(step.stopPropagation).toHaveBeenCalledTimes(1);

    const quiet = new KeyMap({ Escape: "close" }, { preventDefault: false });
    const escape = keyPress("Escape");

    expect(quiet.handle(escape, act)).toBe(true);
    expect(escape.preventDefault).not.toHaveBeenCalled();
  });

  test("handles nothing for a press that is not the map's", () => {
    const act = jest.fn();
    const press = keyPress("x");

    expect(steering.handle(press, act)).toBe(false);
    expect(act).not.toHaveBeenCalled();
    expect(press.preventDefault).not.toHaveBeenCalled();
  });

  test("leaves a declined offer to the browser and handles a taken one", () => {
    const declined = keyPress("ArrowLeft");

    expect(steering.offer(declined, () => false)).toBe(false);
    expect(declined.preventDefault).not.toHaveBeenCalled();

    const taken = keyPress("ArrowLeft");

    expect(steering.offer(taken, (intent) => intent === "left")).toBe(true);
    expect(taken.preventDefault).toHaveBeenCalledTimes(1);
  });
});

describe("HeldKeys", () => {
  const map = new KeyMap({ ArrowLeft: "left", a: "left", ArrowRight: "right", ArrowUp: "burn", p: "pause" });

  test("holds a bound key until it comes up, and ignores keys the map does not know", () => {
    const held = new HeldKeys(map);

    expect(held.press(keyPress("ArrowUp"))).toBe("burn");
    expect(held.press(keyPress("q"))).toBeNull();
    expect(held.isHeld("burn")).toBe(true);
    expect(held.size).toBe(1);
    expect(held.release(keyPress("q"))).toBe(false);
    expect(held.release(keyPress("ArrowUp"))).toBe(true);
    expect(held.isHeld("burn")).toBe(false);
    expect(held.size).toBe(0);
  });

  test("counts a repeating key once", () => {
    const held = new HeldKeys(map);

    held.press(keyPress("ArrowUp"));
    held.press(keyPress("ArrowUp"));
    held.press(keyPress("ArrowUp"));
    held.release(keyPress("ArrowUp"));
    expect(held.isHeld("burn")).toBe(false);
  });

  test("keeps an intent held until every key bound to it is up", () => {
    const held = new HeldKeys(map);

    held.press(keyPress("ArrowLeft"));
    held.press(keyPress("a"));
    held.release(keyPress("ArrowLeft"));
    expect(held.isHeld("left")).toBe(true);
    held.release(keyPress("a"));
    expect(held.isHeld("left")).toBe(false);
  });

  test("matches a release to its press whatever the case or the modifiers by then", () => {
    const held = new HeldKeys(new KeyMap({ w: "burn" }, { ignore: BROWSER_SHORTCUTS }));

    held.press(keyPress("W", { shiftKey: true }));
    expect(held.release(keyPress("w", { ctrlKey: true }))).toBe(true);
    expect(held.press(keyPress("w", { ctrlKey: true }))).toBeNull();
  });

  test("reads opposite intents as one axis", () => {
    const held = new HeldKeys(map);

    expect(held.axis("left", "right")).toBe(0);
    held.press(keyPress("ArrowRight"));
    expect(held.axis("left", "right")).toBe(1);
    held.press(keyPress("a"));
    expect(held.axis("left", "right")).toBe(0);
    held.release(keyPress("ArrowRight"));
    expect(held.axis("left", "right")).toBe(-1);
  });

  test("lets everything go at once", () => {
    const held = new HeldKeys(map);

    held.press(keyPress("ArrowLeft"));
    held.press(keyPress("ArrowUp"));
    held.clear();
    expect(held.size).toBe(0);
    expect(held.isHeld("left")).toBe(false);
    expect(held.release(keyPress("ArrowLeft"))).toBe(false);
  });
});

describe("key helpers", () => {
  test("fold letters to lower case and leave named keys alone", () => {
    expect(foldKey("W")).toBe("w");
    expect(foldKey("+")).toBe("+");
    expect(foldKey(" ")).toBe(" ");
    expect(foldKey("ArrowUp")).toBe("ArrowUp");
  });

  test("read each modifier and any of a list", () => {
    const press = keyPress("x", { altKey: true });

    expect(isModifierDown(press, "alt")).toBe(true);
    expect(isModifierDown(press, "shift")).toBe(false);
    expect(hasModifier(press, ["ctrl", "alt"])).toBe(true);
    expect(hasModifier(press, ["ctrl", "meta"])).toBe(false);
    expect(hasModifier(press, [])).toBe(false);
    expect(hasModifier(keyPress("x", { shiftKey: true }), ANY_MODIFIER)).toBe(true);
    expect(hasModifier(keyPress("x", { shiftKey: true }), BROWSER_SHORTCUTS)).toBe(false);
  });

  test("give each arrow one step on the screen's axes", () => {
    expect(ARROW_STEPS.ArrowLeft).toEqual({ x: -1, y: 0 });
    expect(ARROW_STEPS.ArrowDown).toEqual({ x: 0, y: 1 });
    expect(HORIZONTAL_ARROWS).toEqual({ ArrowLeft: -1, ArrowRight: 1 });
  });
});
