import { FrameScheduler } from "@/packages/animation/frame-loop";

// A box in viewport pixels, as getBoundingClientRect gives it.
export interface FrameRect {
  top: number;
  bottom: number;
  height: number;
}

// One reader of the page's layout. `read` measures (and may use the shared rect cache); `write` applies
// what was measured, to styles or to state. Every read of a frame runs before any write.
export interface FrameTask<T> {
  read(frame: FrameReading): T;
  write(value: T): void;
}

export interface FrameReading {
  viewportHeight: number;
  scrollY: number;
  scrollHeight: number;
  // The rect of the element with this id, measured once per frame however many tasks ask for it.
  rectOf(id: string): FrameRect | null;
}

// What the frame needs from the page, so tests can drive it without a browser.
export interface FrameEnvironment {
  scheduler: FrameScheduler;
  // Calls `onChange` on every scroll, resize or change in the page's size; returns how to stop.
  listen(onChange: () => void): () => void;
  measure(): Omit<FrameReading, "rectOf">;
  rect(id: string): FrameRect | null;
}

type AnyTask = FrameTask<unknown>;

// Every scroll driven reader on the page shares one frame: one listener, at most one measurement pass per
// display frame, all reads before all writes (so the browser lays the page out once, not once per reader),
// and each section measured once even when the menu, the trail and the journey all want it.
export class ScrollFrame {
  private readonly environment: FrameEnvironment;
  private readonly tasks = new Set<AnyTask>();
  private handle: number | null = null;
  private stopListening: (() => void) | null = null;

  constructor(environment: FrameEnvironment) {
    this.environment = environment;
  }

  public get size(): number {
    return this.tasks.size;
  }

  public subscribe<T>(task: FrameTask<T>): () => void {
    this.tasks.add(task as AnyTask);

    if (!this.stopListening) {
      this.stopListening = this.environment.listen(() => this.schedule());
    }

    this.schedule();

    return () => {
      this.tasks.delete(task as AnyTask);

      if (this.tasks.size === 0) {
        this.stopListening?.();
        this.stopListening = null;
        this.cancel();
      }
    };
  }

  public schedule(): void {
    if (this.handle === null) {
      this.handle = this.environment.scheduler.request(this.run);
    }
  }

  private cancel(): void {
    if (this.handle !== null) {
      this.environment.scheduler.cancel(this.handle);
      this.handle = null;
    }
  }

  private readonly run = () => {
    this.handle = null;

    const rects = new Map<string, FrameRect | null>();
    const reading: FrameReading = {
      ...this.environment.measure(),
      rectOf: (id) => {
        if (!rects.has(id)) {
          rects.set(id, this.environment.rect(id));
        }

        return rects.get(id) ?? null;
      },
    };
    const tasks = [...this.tasks];
    const values = tasks.map((task) => task.read(reading));

    tasks.forEach((task, index) => task.write(values[index]));
  };
}

// The browser's frame: animation frames, scroll and resize on the window, and a ResizeObserver on the body
// for content that loads later and moves everything below it.
export const createBrowserScrollFrame = (view: Window): ScrollFrame => new ScrollFrame({
  scheduler: {
    request: (callback) => view.requestAnimationFrame(callback),
    cancel: (handle) => view.cancelAnimationFrame(handle),
  },
  listen: (onChange) => {
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onChange);

    view.addEventListener("scroll", onChange, { passive: true });
    view.addEventListener("resize", onChange);
    observer?.observe(view.document.body);

    return () => {
      view.removeEventListener("scroll", onChange);
      view.removeEventListener("resize", onChange);
      observer?.disconnect();
    };
  },
  measure: () => ({
    viewportHeight: view.innerHeight,
    scrollY: view.scrollY,
    scrollHeight: view.document.documentElement.scrollHeight,
  }),
  rect: (id) => {
    const rect = view.document.getElementById(id)?.getBoundingClientRect();

    return rect ? { top: rect.top, bottom: rect.bottom, height: rect.height } : null;
  },
});
