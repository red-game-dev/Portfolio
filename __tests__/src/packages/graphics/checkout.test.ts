import { amountShown, approvedAt, checkoutAt, keysFor } from "@/packages/graphics/checkout";
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
});
