import { amountOf, amountShown, approvedAt, checkoutAt, customerPoseAt, decimalOf, keysFor, QUICK_STORY_MS, STILL_CUSTOMER, storyMs } from "@/packages/graphics/checkout";
import { CheckoutGesture } from "@/packages/graphics/checkout";

const GESTURES: CheckoutGesture[] = ["insert", "tap", "swipe", "wallet", "scan", "face"];

describe("the checkout's keypad", () => {
  it("keys the digits and the decimal mark of an amount, never its currency or its grouping", () => {
    expect(keysFor(amountOf("€18.40"))).toEqual([0, 7, 9, 3, 10]);
    expect(keysFor(amountOf("12,05 €"))).toEqual([0, 1, 9, 10, 4]);
    expect(keysFor({ text: "₱1,250.00", prefix: "₱", suffix: "", keyed: "1250.00" })).toEqual([0, 1, 4, 10, 9, 10, 10]);
  });

  it("shows the currency where its language puts it, each character as it is keyed, then the amount as it is written", () => {
    expect(amountShown(amountOf("€18.40"), 0)).toBe("€");
    expect(amountShown(amountOf("€18.40"), 3)).toBe("€18.");
    expect(amountShown(amountOf("€18.40"), 5)).toBe("€18.40");
    expect(amountShown(amountOf("18,40 €"), 2)).toBe("18 €");

    const grouped = { text: "₱1,250.00", prefix: "₱", suffix: "", keyed: "1250.00" };

    expect(amountShown(grouped, 4)).toBe("₱1250");
    expect(amountShown(grouped, 7)).toBe("₱1,250.00");
  });

  it("marks the decimal key as the amount's language does", () => {
    expect(decimalOf(amountOf("18,40 €"))).toBe(",");
    expect(decimalOf(amountOf("$18.40"))).toBe(".");
    expect(decimalOf({ text: "¥1,280", prefix: "¥", suffix: "", keyed: "1280" })).toBe(".");
  });
});

describe("the checkout's story", () => {
  const keys = keysFor(amountOf("€18.40"));

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

  it("runs at a person's pace, neither rushed nor slow: a tap approved in 3.5 to 5s and over by 6.5s, chip and PIN in 6 to 8s", () => {
    const tapMs = storyMs("full", "tap", 0, keys);
    const chipMs = storyMs("full", "insert", 0, keys);
    const tapApproved = approvedAt("full", "tap", 0, keys) * tapMs;
    const chipApproved = approvedAt("full", "insert", 0, keys) * chipMs;

    expect(tapApproved).toBeGreaterThan(3500);
    expect(tapApproved).toBeLessThan(5000);
    expect(tapMs).toBeLessThan(6500);
    expect(chipApproved).toBeGreaterThan(6000);
    expect(chipApproved).toBeLessThan(8000);
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

  it("guides a swiped card straight down the stripe, never swinging it into the terminal's side", () => {
    const xs = Array.from({ length: 401 }, (_, step) => checkoutAt(step / 400, "full", "swipe", 0, keys).item)
      .filter((item): item is NonNullable<typeof item> => item !== null && item.y > 40 && item.y < 150)
      .map((item) => item.x);

    expect(xs.length).toBeGreaterThan(10);
    expect(Math.min(...xs)).toBeGreaterThan(198);
  });

  it("pays by face with nothing held: the screen frames the face, the camera matches it, and the payment is approved", () => {
    const states = Array.from({ length: 201 }, (_, step) => checkoutAt(step / 200, "full", "face", 0, keys));
    const scanning = states.filter((frame) => frame.screen.state === "face");

    expect(scanning.length).toBeGreaterThan(10);
    expect(Math.max(...scanning.map((frame) => frame.sweep))).toBeGreaterThan(0.8);
    expect(states.every((frame) => frame.item === null && frame.customerGrip === null)).toBe(true);
    // No hand shows: the button lights as she taps it.
    expect(states.every((frame) => frame.customerPoint === null)).toBe(true);
    expect(states.some((frame) => frame.screen.state === "ask" && frame.screen.pressed !== null)).toBe(true);
    expect(states[states.length - 1].screen.state).toBe("approved");
  });

  it("keeps where each part was a moment and two moments ago, for its motion blur", () => {
    const frame = checkoutAt(approvedAt("full", "tap", 0, keys) - 0.1, "full", "tap", 0, keys);

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

describe("the customer paying by face", () => {
  const moments = { asked: 3000, press: 4300, looked: 4900, matched: 6400, approved: 6850 };
  const sample = (from: number, to: number, step = 20) =>
    Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, index) => customerPoseAt(from + index * step, moments));
  const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
  const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

  it("is never still, yet moves as a person standing does: millimetres and degrees, never a jolt", () => {
    const idle = sample(0, 2900);

    expect(spread(idle.map((pose) => pose.side))).toBeGreaterThan(2);
    expect(spread(idle.map((pose) => pose.lean))).toBeGreaterThan(2);
    expect(spread(idle.map((pose) => pose.turn))).toBeGreaterThan(0.005);

    const whole = sample(0, 9000, 10);

    whole.forEach((pose) => {
      expect(Math.abs(pose.side)).toBeLessThan(30);
      expect(Math.abs(pose.lean)).toBeLessThan(50);
      expect(Math.abs(pose.turn) + Math.abs(pose.nod) + Math.abs(pose.roll)).toBeLessThan(0.3);
    });
    // Ten milliseconds apart, no part of her moves more than a person can.
    whole.slice(1).forEach((pose, index) => {
      expect(Math.hypot(pose.side - whole[index].side, pose.lean - whole[index].lean, pose.rise - whole[index].rise)).toBeLessThan(1.5);
    });
  });

  it("breathes about fifteen times a minute", () => {
    const rises = sample(0, 8400, 10).map((pose) => pose.rise);
    const peaks = rises.filter((rise, index) => index > 0 && index < rises.length - 1 && rise > rises[index - 1] && rise >= rises[index + 1]);

    expect(peaks.length).toBe(2);
  });

  it("leans in to the screen as it asks, holds still while her face is read, and nods as it is approved", () => {
    expect(mean(sample(3600, 4200).map((pose) => pose.lean))).toBeGreaterThan(mean(sample(1000, 2900).map((pose) => pose.lean)) + 6);
    expect(spread(sample(5200, 6300).map((pose) => pose.side))).toBeLessThan(spread(sample(0, 2900).map((pose) => pose.side)) / 2);
    expect(Math.max(...sample(6850, 7550).map((pose) => pose.nod))).toBeGreaterThan(Math.max(...sample(5200, 6300).map((pose) => pose.nod)) + 0.05);
  });

  it("blinks every few seconds, each blink over in a fifth of a second", () => {
    const blinks = sample(0, 20000, 10).map((pose) => pose.blink);
    const shut = blinks.filter((blink) => blink > 0.5).length * 10;
    const starts = blinks.filter((blink, index) => blink > 0 && index > 0 && blinks[index - 1] === 0).length;

    expect(starts).toBeGreaterThanOrEqual(4);
    expect(starts).toBeLessThanOrEqual(8);
    expect(shut / starts).toBeLessThan(200);
  });

  it("moves through the face story, and stands still in no other", () => {
    const keys = keysFor(amountOf("€18.40"));
    const poses = [0.3, 0.31, 0.6].map((t) => checkoutAt(t, "full", "face", 0, keys).customer);

    expect(poses[0]).not.toEqual(poses[1]);
    expect(checkoutAt(0.5, "full", "tap", 0, keys).customer).toEqual(STILL_CUSTOMER);
  });
});
