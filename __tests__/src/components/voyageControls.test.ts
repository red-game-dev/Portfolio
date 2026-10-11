import { PHOTO_PAN, slotOf, VOYAGE_KEYS, voyageKeyAction, VoyageKeyState } from "@/components/Finale/Voyage/controls";

import { keyPress } from "../packages/interaction/fixtures/events";

const state = (overrides: Partial<VoyageKeyState> = {}): VoyageKeyState => ({
  isFlying: true,
  isPaused: false,
  hasRun: true,
  isHangarOpen: false,
  isPhoto: false,
  hasHangar: true,
  hasSuggestion: true,
  hasGame: true,
  ...overrides,
});

describe("the voyage's keys", () => {
  test("name a command for every key the voyage answers, in either case", () => {
    expect(VOYAGE_KEYS.intentOf(keyPress("ArrowLeft"))).toBe("left");
    expect(VOYAGE_KEYS.intentOf(keyPress("D"))).toBe("right");
    expect(VOYAGE_KEYS.intentOf(keyPress("w"))).toBe("burn");
    expect(VOYAGE_KEYS.intentOf(keyPress("ArrowDown"))).toBe("brake");
    expect(VOYAGE_KEYS.intentOf(keyPress("p"))).toBe("pause");
    expect(VOYAGE_KEYS.intentOf(keyPress("M"))).toBe("map");
    expect(VOYAGE_KEYS.intentOf(keyPress("f"))).toBe("guns");
    expect(VOYAGE_KEYS.intentOf(keyPress("h"))).toBe("hangar");
    expect(VOYAGE_KEYS.intentOf(keyPress("c"))).toBe("photo");
    expect(VOYAGE_KEYS.intentOf(keyPress("u"))).toBe("follow");
    expect(VOYAGE_KEYS.intentOf(keyPress("+"))).toBe("zoomIn");
    expect(VOYAGE_KEYS.intentOf(keyPress("="))).toBe("zoomIn");
    expect(VOYAGE_KEYS.intentOf(keyPress("-"))).toBe("zoomOut");
    expect(VOYAGE_KEYS.intentOf(keyPress("Escape"))).toBe("back");
    expect(VOYAGE_KEYS.intentOf(keyPress("1"))).toBe("slot1");
    expect(VOYAGE_KEYS.intentOf(keyPress("4"))).toBe("slot4");
    expect(VOYAGE_KEYS.intentOf(keyPress("6"))).toBe("slot6");
    expect(VOYAGE_KEYS.intentOf(keyPress("7"))).toBeNull();
    expect(VOYAGE_KEYS.intentOf(keyPress("q"))).toBeNull();
  });

  test("leave the browser's own shortcuts to the browser, but not Shift", () => {
    expect(VOYAGE_KEYS.intentOf(keyPress("h", { ctrlKey: true }))).toBeNull();
    expect(VOYAGE_KEYS.intentOf(keyPress("u", { metaKey: true }))).toBeNull();
    expect(VOYAGE_KEYS.intentOf(keyPress("ArrowLeft", { altKey: true }))).toBeNull();
    expect(VOYAGE_KEYS.intentOf(keyPress("+", { shiftKey: true }))).toBe("zoomIn");
    expect(VOYAGE_KEYS.intentOf(keyPress("1", { metaKey: true }))).toBeNull();
  });

  test("look round photo mode with the arrows only, against the arrow", () => {
    expect(PHOTO_PAN.intentOf(keyPress("ArrowLeft"))).toEqual({ x: 60, y: 0 });
    expect(PHOTO_PAN.intentOf(keyPress("ArrowDown"))).toEqual({ x: 0, y: -60 });
    expect(PHOTO_PAN.intentOf(keyPress("a"))).toBeNull();
  });
});

describe("voyageKeyAction", () => {
  test("steers, pauses and turns the guns only in flight", () => {
    expect(voyageKeyAction("left", state())).toBe("steer");
    expect(voyageKeyAction("brake", state())).toBe("steer");
    expect(voyageKeyAction("pause", state())).toBe("pause");
    expect(voyageKeyAction("guns", state())).toBe("guns");
    expect(voyageKeyAction("left", state({ isFlying: false }))).toBeNull();
    expect(voyageKeyAction("pause", state({ isFlying: false }))).toBeNull();
    expect(voyageKeyAction("guns", state({ isFlying: false }))).toBeNull();
  });

  test("opens the map and photo mode once a run has begun, flying or over", () => {
    expect(voyageKeyAction("map", state({ isFlying: false }))).toBe("map");
    expect(voyageKeyAction("photo", state({ isFlying: false }))).toBe("photo");
    expect(voyageKeyAction("map", state({ hasRun: false, isFlying: false }))).toBeNull();
    expect(voyageKeyAction("photo", state({ hasRun: false, isFlying: false }))).toBeNull();
  });

  test("opens the hangar once it has loaded, follows a suggestion only when there is one, and zooms once there is a game", () => {
    expect(voyageKeyAction("hangar", state({ isFlying: false, hasRun: false }))).toBe("hangar");
    expect(voyageKeyAction("hangar", state({ hasHangar: false }))).toBeNull();
    expect(voyageKeyAction("follow", state())).toBe("follow");
    expect(voyageKeyAction("follow", state({ hasSuggestion: false }))).toBeNull();
    expect(voyageKeyAction("zoomIn", state({ isFlying: false, hasRun: false }))).toBe("zoomIn");
    expect(voyageKeyAction("zoomOut", state())).toBe("zoomOut");
    expect(voyageKeyAction("zoomIn", state({ hasGame: false }))).toBeNull();
  });

  test("uses the ability bar's slots only in flight with the hangar loaded, each key its own slot", () => {
    expect(voyageKeyAction("slot1", state())).toBe("slot1");
    expect(voyageKeyAction("slot3", state())).toBe("slot3");
    expect(voyageKeyAction("slot1", state({ isFlying: false }))).toBeNull();
    expect(voyageKeyAction("slot2", state({ hasHangar: false }))).toBeNull();
    expect(voyageKeyAction("slot3", state({ isPaused: true }))).toBeNull();
    expect(voyageKeyAction("slot4", state({ isHangarOpen: true }))).toBeNull();
    expect(voyageKeyAction("slot4", state({ isPhoto: true }))).toBeNull();
    expect([slotOf("slot1"), slotOf("slot4"), slotOf("pause"), slotOf(null)]).toEqual([0, 3, -1, -1]);
  });

  test("keeps to the hangar's own keys while it is open", () => {
    const open = state({ isHangarOpen: true });

    expect(voyageKeyAction("hangar", open)).toBe("hangar");
    expect(voyageKeyAction("follow", open)).toBe("follow");
    expect(voyageKeyAction("back", open)).toBe("closeHangar");
    (["left", "pause", "map", "guns", "photo", "zoomIn", "zoomOut"] as const).forEach((command) => expect(voyageKeyAction(command, open)).toBeNull());
  });

  test("keeps to photo mode's own keys while it is on", () => {
    const photo = state({ isPhoto: true });

    expect(voyageKeyAction("photo", photo)).toBe("photo");
    expect(voyageKeyAction("back", photo)).toBe("photo");
    expect(voyageKeyAction("zoomIn", photo)).toBe("zoomIn");
    expect(voyageKeyAction("zoomOut", photo)).toBe("zoomOut");
    (["left", "burn", "pause", "map", "guns", "hangar", "follow"] as const).forEach((command) => expect(voyageKeyAction(command, photo)).toBeNull());
  });

  test("steps back out of the hangar before photo mode, and leaves Escape alone with neither open", () => {
    expect(voyageKeyAction("back", state({ isHangarOpen: true, isPhoto: true }))).toBe("closeHangar");
    expect(voyageKeyAction("back", state())).toBeNull();
  });
});
