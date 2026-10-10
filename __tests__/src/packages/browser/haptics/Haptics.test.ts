import {
  canVibrate,
  HAPTIC_PATTERNS,
  Haptics,
  isHapticsEnabled,
  setHapticsEnabled,
  setHapticsGap,
  stopHaptics,
  vibrate,
  Vibrator,
} from "@/packages/browser/haptics";

// Haptics on a fake device and a clock the test moves.
const setup = (device: Vibrator | null, minGapMs?: number) => {
  let now = 1000;
  const haptics = new Haptics({ device: () => device, now: () => now, minGapMs });

  return { haptics, wait: (ms: number) => (now += ms) };
};

const motor = () => ({ vibrate: jest.fn((pattern: unknown) => pattern !== undefined) });

describe("Haptics", () => {
  test("buzzes through the device's motor", () => {
    const device = motor();
    const { haptics } = setup(device);

    expect(haptics.isSupported).toBe(true);
    expect(haptics.vibrate(HAPTIC_PATTERNS.bigHit)).toBe(true);
    expect(device.vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.bigHit);
  });

  test("drops a buzz asked for within the least gap of the last, so rapid hits stay apart", () => {
    const device = motor();
    const { haptics, wait } = setup(device);

    expect(haptics.vibrate(HAPTIC_PATTERNS.hit)).toBe(true);
    wait(30);
    expect(haptics.vibrate(HAPTIC_PATTERNS.hit)).toBe(false);
    wait(30);
    expect(haptics.vibrate(HAPTIC_PATTERNS.hit)).toBe(true);
    expect(device.vibrate).toHaveBeenCalledTimes(2);

    haptics.setMinGap(200);
    wait(100);
    expect(haptics.vibrate(HAPTIC_PATTERNS.hit)).toBe(false);
    wait(100);
    expect(haptics.vibrate(HAPTIC_PATTERNS.hit)).toBe(true);
  });

  test("takes a gap of the host's own, or none", () => {
    const device = motor();
    const { haptics } = setup(device, 0);

    haptics.vibrate(HAPTIC_PATTERNS.tap);
    haptics.vibrate(HAPTIC_PATTERNS.tap);
    expect(device.vibrate).toHaveBeenCalledTimes(2);
  });

  test("buzzes nothing while switched off, and stops what is playing when switched off", () => {
    const device = motor();
    const { haptics, wait } = setup(device);

    haptics.setEnabled(false);
    expect(haptics.isEnabled).toBe(false);
    expect(device.vibrate).toHaveBeenCalledWith(0);
    expect(haptics.vibrate(HAPTIC_PATTERNS.explosion)).toBe(false);
    expect(device.vibrate).toHaveBeenCalledTimes(1);

    haptics.setEnabled(true);
    wait(100);
    expect(haptics.vibrate(HAPTIC_PATTERNS.explosion)).toBe(true);
    expect(new Haptics({ device: () => device, isEnabled: false }).vibrate(1)).toBe(false);
  });

  test("waits for the reader to use the page, where the browser says", () => {
    const device = { ...motor(), userActivation: { hasBeenActive: false } };
    const { haptics } = setup(device);

    expect(haptics.vibrate(HAPTIC_PATTERNS.tap)).toBe(false);
    expect(device.vibrate).not.toHaveBeenCalled();

    device.userActivation.hasBeenActive = true;
    expect(haptics.vibrate(HAPTIC_PATTERNS.tap)).toBe(true);
  });

  test("asks for nothing on a silent pattern", () => {
    const device = motor();
    const { haptics } = setup(device);

    expect(haptics.vibrate(0)).toBe(false);
    expect(haptics.vibrate([])).toBe(false);
    expect(device.vibrate).not.toHaveBeenCalled();
  });

  test("does nothing, and breaks nothing, without a motor", () => {
    for (const device of [null, {}]) {
      const { haptics } = setup(device);

      expect(haptics.isSupported).toBe(false);
      expect(haptics.vibrate(HAPTIC_PATTERNS.warning)).toBe(false);
      expect(() => haptics.stop()).not.toThrow();
      expect(() => haptics.setEnabled(false)).not.toThrow();
    }
  });

  test("survives a motor that throws or refuses, and a refusal does not start the gap", () => {
    const throwing = {
      vibrate: jest.fn(() => {
        throw new Error("blocked");
      }),
    };
    const { haptics } = setup(throwing);

    expect(haptics.vibrate(HAPTIC_PATTERNS.pickup)).toBe(false);
    expect(() => haptics.stop()).not.toThrow();

    const refuseOnce = jest.fn()
      .mockReturnValueOnce(false)
      .mockReturnValue(true);
    const refusing = { vibrate: refuseOnce };
    const second = setup(refusing).haptics;

    expect(second.vibrate(HAPTIC_PATTERNS.levelUp)).toBe(false);
    expect(second.vibrate(HAPTIC_PATTERNS.levelUp)).toBe(true);
  });
});

describe("HAPTIC_PATTERNS", () => {
  test("gives every moment a buzz of positive lengths", () => {
    expect(Object.keys(HAPTIC_PATTERNS).sort()).toEqual(["bigHit", "explosion", "hit", "levelUp", "pickup", "tap", "warning"]);

    Object.values(HAPTIC_PATTERNS).forEach((pattern) => {
      const lengths = typeof pattern === "number" ? [pattern] : pattern;

      expect(lengths.length).toBeGreaterThan(0);
      lengths.forEach((ms) => expect(ms).toBeGreaterThan(0));
    });
  });
});

describe("page haptics", () => {
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, "vibrate");
    setHapticsEnabled(true);
  });

  test("does nothing where the browser has no Vibration API", () => {
    expect(canVibrate()).toBe(false);
    expect(vibrate(HAPTIC_PATTERNS.tap)).toBe(false);
    expect(() => stopHaptics()).not.toThrow();
  });

  test("buzzes through the navigator, behind one switch for the page", () => {
    const buzz = jest.fn(() => true);

    Object.defineProperty(window.navigator, "vibrate", { configurable: true, value: buzz });
    setHapticsGap(0);

    expect(canVibrate()).toBe(true);
    expect(vibrate(HAPTIC_PATTERNS.tap)).toBe(true);
    expect(buzz).toHaveBeenCalledWith(HAPTIC_PATTERNS.tap);

    setHapticsEnabled(false);
    expect(isHapticsEnabled()).toBe(false);
    expect(vibrate(HAPTIC_PATTERNS.tap)).toBe(false);
    expect(buzz).toHaveBeenLastCalledWith(0);
  });
});
