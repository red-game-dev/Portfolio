import { useRef } from "react";

import { act, fireEvent, render, renderHook, waitFor } from "@testing-library/react";

import useCanvasEngine from "@/hooks/useCanvasEngine";
import useFocusLeave from "@/hooks/useFocusLeave";
import useHashState, { useHashValue } from "@/hooks/useHashState";
import useInView from "@/hooks/useInView";
import useModalDialog from "@/hooks/useModalDialog";
import useScrollLock, { usePageHeld } from "@/hooks/useScrollLock";
import useSettledAnchors from "@/hooks/useSettledAnchors";

import { OnScreenObserver, rect, stubCanvases } from "../fixtures/dom";
import { instanceOf } from "../fixtures/guards";

const root = () => document.documentElement.style.overflow;

describe("useScrollLock", () => {
  it("holds the page until the last holder lets go, then restores what was there", () => {
    document.documentElement.style.overflow = "clip";

    const first = renderHook(({ isActive }) => useScrollLock(isActive), { initialProps: { isActive: true } });
    const second = renderHook(() => useScrollLock(true));
    const held = renderHook(() => usePageHeld());

    expect(root()).toBe("hidden");
    expect(held.result.current).toBe(true);

    first.rerender({ isActive: false });
    expect(root()).toBe("hidden");

    second.unmount();
    expect(root()).toBe("clip");
    expect(held.result.current).toBe(false);

    first.unmount();
    document.documentElement.style.overflow = "";
  });
});

const Modal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const onClick = useModalDialog(ref, isOpen);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog ref={ref} onClick={onClick} onClose={onClose} aria-label="modal">
      <p>inside</p>
    </dialog>
  );
};

describe("useModalDialog", () => {
  it("opens and closes with its prop, holding the page while open", () => {
    const onClose = jest.fn();
    const { getByLabelText, rerender, unmount } = render(<Modal isOpen={false} onClose={onClose} />);
    const dialog = instanceOf(getByLabelText("modal"), HTMLDialogElement);

    expect(dialog.open).toBe(false);

    rerender(<Modal isOpen onClose={onClose} />);
    expect(dialog.open).toBe(true);
    expect(root()).toBe("hidden");

    rerender(<Modal isOpen={false} onClose={onClose} />);
    expect(dialog.open).toBe(false);
    expect(root()).toBe("");
    unmount();
  });

  it("closes on a press on the backdrop, not on its content, nor on a drag out of it that lets go over the backdrop", () => {
    const onClose = jest.fn();
    const { getByLabelText, getByText, unmount } = render(<Modal isOpen onClose={onClose} />);

    const press = (down: HTMLElement, up: HTMLElement, clicked: HTMLElement) => {
      fireEvent.pointerDown(down);
      fireEvent.pointerUp(up);
      fireEvent.click(clicked);
    };

    press(getByText("inside"), getByText("inside"), getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();

    // Text selected inside and let go over the backdrop, or pressed on the backdrop and let go inside: the browser
    // clicks the dialog itself either way.
    press(getByText("inside"), getByLabelText("modal"), getByLabelText("modal"));
    press(getByLabelText("modal"), getByText("inside"), getByLabelText("modal"));
    expect(onClose).not.toHaveBeenCalled();

    press(getByLabelText("modal"), getByLabelText("modal"), getByLabelText("modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });
});

interface FakeEngine {
  stop: jest.Mock;
  sizes: Array<{ width: number; pixelRatio: number }>;
}

const fakeEngine = (): FakeEngine => ({ stop: jest.fn(), sizes: [] });

const Canvas = ({ create, isEnabled = true, seed = 0 }: { create: () => FakeEngine | Promise<FakeEngine>; isEnabled?: boolean; seed?: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useCanvasEngine(ref, { create, isEnabled, resize: (built, { width, pixelRatio }) => built.sizes.push({ width, pixelRatio }) }, [seed]);

  return <canvas ref={ref} data-built={engine ? "yes" : "no"} />;
};

describe("useCanvasEngine", () => {
  let restoreCanvases: () => void = () => undefined;

  beforeAll(() => {
    // The engines are fakes; any context will do.
    restoreCanvases = stubCanvases();
  });

  afterAll(() => restoreCanvases());

  it("builds once near the screen, sizes it, and stops it on the way out", async () => {
    const engine = fakeEngine();
    const { container, unmount } = render(<Canvas create={() => engine} />);

    await waitFor(() => expect(container.querySelector("canvas")?.dataset.built).toBe("yes"));
    expect(engine.sizes).toHaveLength(1);

    unmount();
    expect(engine.stop).toHaveBeenCalled();
  });

  it("builds nothing while disabled", async () => {
    const create = jest.fn(fakeEngine);

    render(<Canvas create={create} isEnabled={false} />).unmount();
    await act(() => Promise.resolve());
    expect(create).not.toHaveBeenCalled();
  });

  it("stops an engine that finishes building after the component has gone", async () => {
    const engine = fakeEngine();
    let finish: (built: FakeEngine) => void = () => undefined;
    const { unmount } = render(<Canvas create={() => new Promise((resolve) => {
      finish = resolve;
    })} />);

    unmount();
    await act(async () => finish(engine));
    expect(engine.stop).toHaveBeenCalled();
  });

  it("rebuilds when its dependencies change", async () => {
    const engines = [fakeEngine(), fakeEngine()];
    let built = 0;
    const create = () => engines[built++];
    const { container, rerender, unmount } = render(<Canvas create={create} seed={1} />);

    await waitFor(() => expect(container.querySelector("canvas")?.dataset.built).toBe("yes"));
    rerender(<Canvas create={create} seed={2} />);
    await waitFor(() => expect(built).toBe(2));
    expect(engines[0].stop).toHaveBeenCalled();
    unmount();
  });
});

describe("useHashState", () => {
  const parse = (hash: string) => (hash.startsWith("#pick-") ? hash.slice(6) : null);
  const anchorOf = (value: string) => `pick-${value}`;

  afterEach(() => window.history.replaceState(null, "", "/"));

  it("starts from the hash, and every reader follows a change made by one of them", () => {
    window.history.replaceState(null, "", "/#pick-a");

    const writer = renderHook(() => useHashState(parse, anchorOf));
    const reader = renderHook(() => useHashValue(parse));

    expect(writer.result.current[0]).toBe("a");
    expect(reader.result.current).toBe("a");

    act(() => writer.result.current[1]("b"));
    expect(window.location.hash).toBe("#pick-b");
    expect(reader.result.current).toBe("b");

    act(() => writer.result.current[1](null));
    expect(window.location.hash).toBe("");
    expect(reader.result.current).toBeNull();
  });
});

describe("useInView", () => {
  const Observer = window.IntersectionObserver;

  beforeAll(() => {
    window.IntersectionObserver = OnScreenObserver;
  });

  afterAll(() => {
    window.IntersectionObserver = Observer;
  });

  // The list only exists in one branch, as the dealt cards do once a view without the live table is chosen.
  const Later = ({ isShown }: { isShown: boolean }) => {
    const ref = useRef<HTMLUListElement>(null);
    const isInView = useInView(ref, { threshold: 0 });

    return (
      <>
        <output>{isInView ? "seen" : "unseen"}</output>
        {isShown && <ul ref={ref} />}
      </>
    );
  };

  it("watches an element that appears after the first render", () => {
    const { getByText, rerender } = render(<Later isShown={false} />);

    expect(getByText("unseen")).toBeInTheDocument();
    rerender(<Later isShown />);
    expect(getByText("seen")).toBeInTheDocument();
  });
});

describe("useSettledAnchors", () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.useRealTimers();
    document.body.replaceChildren();
  });

  // A settle starts by listening for the scroll the jump begins.
  const settles = (listen: jest.SpyInstance) => listen.mock.calls.some(([type]) => type === "scroll");

  it("settles the target of a same page link however deep inside it the click lands, and of no other link", () => {
    const { unmount } = renderHook(() => useSettledAnchors({ isReadable: true, canLand: false }));
    const target = document.createElement("section");
    const local = document.createElement("a");
    const inner = document.createElement("span");
    const away = document.createElement("a");

    target.id = "far";
    local.href = "#far";
    away.href = "https://example.com/elsewhere#far";
    away.addEventListener("click", (event) => event.preventDefault());
    local.append(inner);
    document.body.append(target, local, away);

    const listen = jest.spyOn(window, "addEventListener");

    away.click();
    expect(settles(listen)).toBe(false);

    inner.click();
    expect(settles(listen)).toBe(true);

    listen.mockRestore();
    jest.runOnlyPendingTimers();
    unmount();
  });

  it("lands a page opened at a link to a place on it, once it may and only once", () => {
    const target = document.createElement("section");
    const scroll = jest.fn();

    target.id = "for-payments";
    target.getBoundingClientRect = () => rect({ top: 640 });
    target.scrollIntoView = scroll;
    document.body.append(target);
    window.history.replaceState(null, "", "#for-payments");

    const { rerender, unmount } = renderHook(({ canLand }) => useSettledAnchors({ isReadable: true, canLand }), { initialProps: { canLand: false } });

    expect(scroll).not.toHaveBeenCalled();

    rerender({ canLand: true });
    expect(scroll).toHaveBeenCalledWith({ behavior: "instant", block: "start" });

    scroll.mockClear();
    rerender({ canLand: false });
    rerender({ canLand: true });
    expect(scroll).not.toHaveBeenCalled();

    unmount();
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("leaves the page where the reader took it, but not for picking a view before it was readable", () => {
    const target = document.createElement("section");
    const scroll = jest.fn();

    target.id = "for-payments";
    target.getBoundingClientRect = () => rect({ top: 640 });
    target.scrollIntoView = scroll;
    document.body.append(target);
    window.history.replaceState(null, "", "#for-payments");

    // Picking a view on the character select, before the page can be read, does not count.
    const picked = renderHook((props) => useSettledAnchors(props), { initialProps: { isReadable: false, canLand: false } });

    window.dispatchEvent(new Event("pointerdown"));
    picked.rerender({ isReadable: true, canLand: true });
    expect(scroll).toHaveBeenCalled();
    picked.unmount();

    // Scrolling once the page can be read does.
    scroll.mockClear();
    const read = renderHook((props) => useSettledAnchors(props), { initialProps: { isReadable: true, canLand: false } });

    window.dispatchEvent(new Event("wheel"));
    read.rerender({ isReadable: true, canLand: true });
    expect(scroll).not.toHaveBeenCalled();
    read.unmount();
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("never throws on a hash with a broken escape", () => {
    window.history.replaceState(null, "", "#100%");

    const { rerender, unmount } = renderHook(({ canLand }) => useSettledAnchors({ isReadable: true, canLand }), { initialProps: { canLand: false } });

    expect(() => rerender({ canLand: true })).not.toThrow();
    unmount();
    window.history.replaceState(null, "", window.location.pathname);
  });
});

const Group = ({ onLeave }: { onLeave: () => void }) => {
  const onBlur = useFocusLeave(onLeave);

  return (
    <>
      <div onBlur={onBlur}>
        <button type="button">first</button>
        <button type="button">second</button>
      </div>
      <button type="button">outside</button>
    </>
  );
};

describe("useFocusLeave", () => {
  it("calls back when focus leaves the container or the page, not when it moves inside it", () => {
    const onLeave = jest.fn();
    const { getByText } = render(<Group onLeave={onLeave} />);

    fireEvent.blur(getByText("first"), { relatedTarget: getByText("second") });
    expect(onLeave).not.toHaveBeenCalled();

    fireEvent.blur(getByText("second"), { relatedTarget: getByText("outside") });
    expect(onLeave).toHaveBeenCalledTimes(1);

    fireEvent.blur(getByText("first"), { relatedTarget: null });
    expect(onLeave).toHaveBeenCalledTimes(2);
  });

  it("calls the latest callback", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { getByText, rerender } = render(<Group onLeave={first} />);

    rerender(<Group onLeave={second} />);
    fireEvent.blur(getByText("first"), { relatedTarget: getByText("outside") });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
