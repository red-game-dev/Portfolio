import { closestTo, focusLeaves, isInside, isTypingTarget, listenOutside, PressRoot } from "@/packages/interaction/focus";

const build = () => {
  const container = document.createElement("div");
  const inner = document.createElement("button");
  const outer = document.createElement("button");

  container.append(inner);
  document.body.append(container, outer);

  return { container, inner, outer, done: () => document.body.replaceChildren() };
};

describe("isInside and focusLeaves", () => {
  test("count the container itself and whatever is in it as inside", () => {
    const { container, inner, outer, done } = build();

    expect(isInside(container, container)).toBe(true);
    expect(isInside(container, inner)).toBe(true);
    expect(isInside(container, outer)).toBe(false);
    done();
  });

  test("count nothing as inside a container that is not there, or a target that is not a node", () => {
    const { inner, done } = build();

    expect(isInside(null, inner)).toBe(false);
    expect(isInside(undefined, inner)).toBe(false);
    expect(isInside(document.body, null)).toBe(false);
    expect(isInside(document.body, window)).toBe(false);
    done();
  });

  test("treat focus as leaving when it goes outside, or nowhere, but not between the container's own controls", () => {
    const { container, inner, outer, done } = build();

    expect(focusLeaves(container, inner)).toBe(false);
    expect(focusLeaves(container, outer)).toBe(true);
    expect(focusLeaves(container, null)).toBe(true);
    expect(focusLeaves(null, inner)).toBe(true);
    done();
  });
});

describe("isTypingTarget", () => {
  test("knows text fields, text areas and editable content", () => {
    const editable = document.createElement("div");

    editable.contentEditable = "true";
    // jsdom does not work isContentEditable out from the attribute.
    Object.defineProperty(editable, "isContentEditable", { value: true });

    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    expect(isTypingTarget(editable)).toBe(true);
  });

  test("leaves everything else, and no target at all", () => {
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(document.body)).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
  });
});

describe("closestTo", () => {
  test("finds the nearest match from the target outwards", () => {
    const { container, inner, outer, done } = build();

    container.dataset.scrollX = "";
    expect(closestTo(inner, "[data-scroll-x]")).toBe(container);
    expect(closestTo(outer, "[data-scroll-x]")).toBeNull();
    expect(closestTo(null, "[data-scroll-x]")).toBeNull();
    expect(closestTo(window, "[data-scroll-x]")).toBeNull();
    done();
  });
});

describe("listenOutside", () => {
  test("calls back for presses outside, not inside, until stopped", () => {
    const { container, inner, outer, done } = build();
    const onOutside = jest.fn();
    const stop = listenOutside(document, () => container, onOutside);

    inner.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(onOutside).not.toHaveBeenCalled();

    outer.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(onOutside).toHaveBeenCalledTimes(1);

    stop();
    outer.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(onOutside).toHaveBeenCalledTimes(1);
    done();
  });

  test("reads the container at the moment of each press", () => {
    const { container, inner, done } = build();
    const listeners: Array<(event: Event) => void> = [];
    const root: PressRoot = {
      addEventListener: (_type, listener) => listeners.push(listener),
      removeEventListener: jest.fn(),
    };
    const onOutside = jest.fn();
    let current: Node | null = null;

    listenOutside(root, () => current, onOutside);

    const press = new Event("pointerdown");

    inner.dispatchEvent(press);
    listeners[0](press);
    expect(onOutside).toHaveBeenCalledTimes(1);

    current = container;
    listeners[0](press);
    expect(onOutside).toHaveBeenCalledTimes(1);
    done();
  });
});
