import { isMotionReduced, MOTION_ATTRIBUTE, motionScript, prefersReducedMotion, toggledMotion } from "@/packages/accessibility/motion";

import { matchMediaBy } from "../../fixtures/dom";

const KEY = "test.preferences";

const withSystem = (reduced: boolean) => {
  window.matchMedia = matchMediaBy((query) => reduced && query.includes("reduce"));
};

describe("motion", () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
    window.localStorage.clear();
    document.documentElement.removeAttribute(MOTION_ATTRIBUTE);
  });

  it("keeps still where the reader asks, or leaves it to the device", () => {
    expect(isMotionReduced("reduced", false)).toBe(true);
    expect(isMotionReduced("full", true)).toBe(false);
    expect(isMotionReduced("system", true)).toBe(true);
    expect(isMotionReduced("system", false)).toBe(false);
  });

  it("switches between still and moving, back to the device's choice or in full where the device asks for less", () => {
    expect(toggledMotion(false, false)).toBe("reduced");
    expect(toggledMotion(true, false)).toBe("system");
    expect(toggledMotion(true, true)).toBe("full");
  });

  it("reads the root's attribute once it is set, and the device's setting before", () => {
    withSystem(true);
    expect(prefersReducedMotion()).toBe(true);

    document.documentElement.setAttribute(MOTION_ATTRIBUTE, "full");
    expect(prefersReducedMotion()).toBe(false);

    document.documentElement.setAttribute(MOTION_ATTRIBUTE, "reduced");
    expect(prefersReducedMotion()).toBe(true);
  });

  it("sets the root's attribute before the first paint from the kept setting and the device", () => {
    // The head script is a string by nature; running it as the browser would is the test.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const run = () => new Function(motionScript(KEY))();

    withSystem(true);
    run();
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe("reduced");

    window.localStorage.setItem(KEY, JSON.stringify({ motion: "full" }));
    run();
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe("full");

    withSystem(false);
    window.localStorage.setItem(KEY, JSON.stringify({ motion: "reduced" }));
    run();
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe("reduced");

    // Broken storage falls back to the device.
    window.localStorage.setItem(KEY, "{not json");
    run();
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe("full");
  });
});
