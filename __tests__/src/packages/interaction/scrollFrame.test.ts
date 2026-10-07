import { ManualScheduler } from "@/packages/animation/frame-loop";
import { FrameEnvironment, ScrollFrame } from "@/packages/interaction/scroll-frame";

const createEnvironment = () => {
  const scheduler = new ManualScheduler();
  const measured: string[] = [];
  let onChange: () => void = () => undefined;
  let listening = 0;
  const environment: FrameEnvironment = {
    scheduler,
    listen: (callback) => {
      onChange = callback;
      listening += 1;

      return () => {
        listening -= 1;
      };
    },
    measure: () => ({ viewportHeight: 800, scrollY: 0, scrollHeight: 4000 }),
    rect: (id) => {
      measured.push(id);

      return { top: 100, bottom: 300, height: 200 };
    },
  };

  return { environment, scheduler, measured, scroll: () => onChange(), listening: () => listening };
};

describe("interaction/scroll-frame", () => {
  test("every read runs before any write, and each section is measured once per frame", () => {
    const { environment, scheduler, measured } = createEnvironment();
    const frame = new ScrollFrame(environment);
    const order: string[] = [];

    frame.subscribe({ read: (reading) => {
 order.push("read a");

return reading.rectOf("menu");
}, write: () => order.push("write a") });
    frame.subscribe({ read: (reading) => {
 order.push("read b");

return reading.rectOf("menu");
}, write: () => order.push("write b") });
    scheduler.tick(16);

    expect(order).toEqual(["read a", "read b", "write a", "write b"]);
    expect(measured).toEqual(["menu"]);
  });

  test("a burst of scroll events is one pass on the next frame", () => {
    const { environment, scheduler, scroll } = createEnvironment();
    const frame = new ScrollFrame(environment);
    const read = jest.fn(() => 1);

    frame.subscribe({ read, write: () => undefined });
    scheduler.tick(16);
    scroll();
    scroll();
    scroll();
    expect(scheduler.pendingCount).toBe(1);
    scheduler.tick(32);

    expect(read).toHaveBeenCalledTimes(2);
  });

  test("it only listens while it has readers", () => {
    const { environment, listening } = createEnvironment();
    const frame = new ScrollFrame(environment);
    const first = frame.subscribe({ read: () => 1, write: () => undefined });
    const second = frame.subscribe({ read: () => 1, write: () => undefined });

    expect(listening()).toBe(1);
    first();
    expect(listening()).toBe(1);
    second();
    expect(listening()).toBe(0);
    expect(frame.size).toBe(0);
  });

  test("a reader that leaves before the frame runs is not called", () => {
    const { environment, scheduler } = createEnvironment();
    const frame = new ScrollFrame(environment);
    const stay = jest.fn(() => 1);
    const leave = jest.fn(() => 1);

    frame.subscribe({ read: stay, write: () => undefined });
    frame.subscribe({ read: leave, write: () => undefined })();
    scheduler.tick(16);

    expect(stay).toHaveBeenCalledTimes(1);
    expect(leave).not.toHaveBeenCalled();
  });
});
