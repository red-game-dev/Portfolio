import { amountShown, approvedAt, checkoutAt, keysFor, QUICK_STORY_MS, storyMs } from "@/packages/graphics/checkout";
import { CheckoutGesture } from "@/packages/graphics/checkout";

const GESTURES: CheckoutGesture[] = ["insert", "tap", "swipe", "wallet", "scan"];

describe("the checkout's keypad", () => {
  it("keys the digits and the separator of an amount, never its currency", () => {
    expect(keysFor("€18.40")).toEqual([0, 7, 9, 3, 10]);
    expect(keysFor("12,05 €")).toEqual([0, 1, 9, 10, 4]);
  });

  it("shows the currency, then each character as it is keyed", () => {
    expect(amountShown("€18.40", 0)).toBe("€");
    expect(amountShown("€18.40", 3)).toBe("€18.");
    expect(amountShown("€18.40", 5)).toBe("€18.40");
  });
});

describe("the checkout's story", () => {
  const keys = keysFor("€18.40");

  it.each(GESTURES)("approves a %s payment once, after the customer reaches the terminal, in both stories", (gesture) => {
    ["full", "quick"].forEach((variant) => {
      const at = approvedAt(variant as "full" | "quick", gesture, 0, keys);

      expect(at).toBeGreaterThan(0.2);
      expect(at).toBeLessThan(0.95);
      expect(checkoutAt(at - 0.01, variant as "full" | "quick", gesture, 0, keys).screen.state).not.toBe("approved");
      expect(checkoutAt(at + 0.01, variant as "full" | "quick", gesture, 0, keys).screen.state).toBe("approved");
    });
  });

  it("has the cashier key the amount, then open the app, before the customer pays", () => {
    const states = Array.from({ length: 101 }, (_, step) => checkoutAt(step / 100, "full", "tap", 2, keys).screen.state);
    const order = states.filter((state, index) => state !== states[index - 1]);

    expect(order.slice(0, 4)).toEqual(["idle", "keying", "apps", "ask"]);
    expect(Math.max(...Array.from({ length: 101 }, (_, step) => checkoutAt(step / 100, "full", "tap", 2, keys).screen.typed))).toBe(keys.length);
  });

  it("asks a chip card for its PIN in the full story, four digits", () => {
    const pins = Array.from({ length: 201 }, (_, step) => checkoutAt(step / 200, "full", "insert", 0, keys));

    expect(pins.some((frame) => frame.screen.state === "pin")).toBe(true);
    expect(Math.max(...pins.map((frame) => frame.screen.pin))).toBe(4);
    expect(pins.some((frame) => frame.customerPoint !== null)).toBe(true);
  });

  it("passes a card behind the terminal only for the readers, and keeps every hand off the scene while waiting", () => {
    expect(checkoutAt(0.6, "full", "insert", 0, keys).isItemBehind).toBe(true);
    expect(checkoutAt(0.6, "full", "tap", 0, keys).isItemBehind).toBe(false);

    const waiting = checkoutAt(null, "full", "tap", 0, keys);

    expect([waiting.cashier, waiting.customerGrip, waiting.customerPoint, waiting.item]).toEqual([null, null, null, null]);
    expect(checkoutAt(null, "quick", "tap", 0, keys).screen.state).toBe("ask");
  });

  it("prints the receipt after the payment is approved, and has it out by the end", () => {
    const at = approvedAt("full", "wallet", 0, keys);

    expect(checkoutAt(at - 0.01, "full", "wallet", 0, keys).receipt).toBe(0);
    expect(checkoutAt(1, "full", "wallet", 0, keys).receipt).toBe(1);
  });

  it("runs at a real counter's pace: a tap approved within 2.5s and over by 3.5s, chip and PIN within 3.6s and 4.6s", () => {
    const tapMs = storyMs("full", "tap", 0, keys);
    const chipMs = storyMs("full", "insert", 0, keys);

    expect(approvedAt("full", "tap", 0, keys) * tapMs).toBeLessThan(2500);
    expect(tapMs).toBeLessThan(3500);
    expect(approvedAt("full", "insert", 0, keys) * chipMs).toBeLessThan(3600);
    expect(chipMs).toBeLessThan(4600);
    GESTURES.forEach((gesture) => expect(storyMs("quick", gesture, 0, keys)).toBe(QUICK_STORY_MS));
  });

  it("pushes the camera in while the cashier keys and pulls back to the whole counter by the end", () => {
    const zooms = Array.from({ length: 101 }, (_, step) => checkoutAt(step / 100, "full", "tap", 0, keys).camera.zoom);

    expect(zooms[0]).toBe(1);
    expect(Math.max(...zooms)).toBeGreaterThan(1.4);
    expect(checkoutAt(1, "full", "tap", 0, keys).camera).toEqual({ x: 150, y: 105, zoom: 1 });
    expect(checkoutAt(null, "full", "tap", 0, keys).camera.zoom).toBe(1);
  });

  it("lifts a fingertip towards the camera over a key and presses it into the glass", () => {
    const scales = Array.from({ length: 401 }, (_, step) => checkoutAt(step / 400, "full", "tap", 0, keys).cashier?.scale)
      .filter((scale): scale is number => scale !== undefined);

    expect(Math.min(...scales)).toBeLessThan(1);
    expect(Math.max(...scales)).toBeGreaterThan(1.03);
  });

  it("keeps where each part was a frame and two frames ago, for its motion blur", () => {
    const frame = checkoutAt(0.4, "full", "tap", 0, keys);

    expect(frame.trail).toHaveLength(2);
    expect(frame.trail[0].item).not.toBeNull();
  });

  it("keeps the camera on the screen while the cashier keys, and every resting hand off the scene", () => {
    const keying = checkoutAt(0.2, "full", "tap", 0, keys);

    expect(keying.customerPoint).toBeNull();
    expect(Math.abs(keying.camera.x - 150)).toBeLessThan(6);
    expect(Math.abs(keying.camera.y - 80)).toBeLessThan(6);
  });
});
