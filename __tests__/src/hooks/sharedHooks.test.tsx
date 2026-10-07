import { useRef } from "react";

import { act, fireEvent, render, renderHook, waitFor } from "@testing-library/react";

import useCanvasEngine from "@/hooks/useCanvasEngine";
import useHashState, { useHashValue } from "@/hooks/useHashState";
import useInView from "@/hooks/useInView";
import useModalDialog from "@/hooks/useModalDialog";
import useScrollLock, { usePageHeld } from "@/hooks/useScrollLock";

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
    const dialog = getByLabelText("modal") as HTMLDialogElement;

    expect(dialog.open).toBe(false);

    rerender(<Modal isOpen onClose={onClose} />);
    expect(dialog.open).toBe(true);
    expect(root()).toBe("hidden");

    rerender(<Modal isOpen={false} onClose={onClose} />);
    expect(dialog.open).toBe(false);
    expect(root()).toBe("");
    unmount();
  });

  it("closes on a click on the backdrop, not on its content", () => {
    const onClose = jest.fn();
    const { getByLabelText, getByText, unmount } = render(<Modal isOpen onClose={onClose} />);

    fireEvent.click(getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(getByLabelText("modal"));
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

// Reports everything it observes as on screen, at once.
class OnScreenObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}

  public observe(target: Element) {
    this.callback([{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }

  public disconnect() {
    return undefined;
  }

  public unobserve() {
    return undefined;
  }
}

describe("useCanvasEngine", () => {
  // Kept to put back afterwards, never called here.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const getContext = HTMLCanvasElement.prototype.getContext;
  const Observer = window.IntersectionObserver;

  beforeAll(() => {
    // The engines are fakes; any non-null context will do.
    HTMLCanvasElement.prototype.getContext = (() => ({})) as unknown as typeof getContext;
    window.IntersectionObserver = OnScreenObserver as unknown as typeof IntersectionObserver;
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = getContext;
    window.IntersectionObserver = Observer;
  });

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
    window.IntersectionObserver = OnScreenObserver as unknown as typeof IntersectionObserver;
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
