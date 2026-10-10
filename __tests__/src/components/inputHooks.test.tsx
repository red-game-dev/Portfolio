import { useRef } from "react";

import { fireEvent, render, renderHook } from "@testing-library/react";

import { useSwipe } from "@/components/Carousel/hooks/useSwipe";
import { usePressGesture } from "@/components/Finale/hooks/usePressGesture";
import { useOutsidePress } from "@/components/Lens/hooks/useOutsidePress";
import { useWindowKeys } from "@/components/Terminal/hooks/useWindowKeys";
import { KeyMap } from "@/packages/interaction/keys";

import { installPointerEvents, pointerAt } from "./fixtures/pointer";

beforeAll(installPointerEvents);

const Popover = ({ isActive, onOutside }: { isActive: boolean; onOutside: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  useOutsidePress(ref, isActive, onOutside);

  return (
    <>
      <div ref={ref}>
        <button type="button">inside</button>
      </div>
      <button type="button">outside</button>
    </>
  );
};

describe("useOutsidePress", () => {
  it("calls back for presses outside while active, and never for presses inside", () => {
    const onOutside = jest.fn();
    const { getByText, rerender, unmount } = render(<Popover isActive onOutside={onOutside} />);

    fireEvent.pointerDown(getByText("inside"));
    expect(onOutside).not.toHaveBeenCalled();

    fireEvent.pointerDown(getByText("outside"));
    expect(onOutside).toHaveBeenCalledTimes(1);

    rerender(<Popover isActive={false} onOutside={onOutside} />);
    fireEvent.pointerDown(getByText("outside"));
    expect(onOutside).toHaveBeenCalledTimes(1);

    rerender(<Popover isActive onOutside={onOutside} />);
    unmount();
    fireEvent.pointerDown(document.body);
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});

describe("useWindowKeys", () => {
  const map = new KeyMap({ k: "open" }, { ignore: ["ctrl"] });

  it("hands the map's presses from anywhere on the page to the latest callback until unmounted", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(({ onIntent }) => useWindowKeys(map, onIntent), { initialProps: { onIntent: first } });

    expect(fireEvent.keyDown(document.body, { key: "K" })).toBe(false);
    expect(first).toHaveBeenCalledWith("open");

    fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "j" });
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ onIntent: second });
    fireEvent.keyDown(document.body, { key: "k" });
    expect(second).toHaveBeenCalledTimes(1);

    unmount();
    fireEvent.keyDown(document.body, { key: "k" });
    expect(second).toHaveBeenCalledTimes(1);
  });
});

interface PressProbe {
  canPress: jest.Mock;
  onPress: jest.Mock;
  onRelease: jest.Mock;
  onCancel: jest.Mock;
  onPointerlessClick: jest.Mock;
}

const probe = (canPress = true): PressProbe => ({
  canPress: jest.fn(() => canPress),
  onPress: jest.fn(),
  onRelease: jest.fn(),
  onCancel: jest.fn(),
  onPointerlessClick: jest.fn(),
});

const HoldButton = (props: PressProbe) => {
  const press = usePressGesture({ tapMs: 250, ...props });

  return (
    <button
      type="button"
      onPointerDown={press.onPointerDown}
      onPointerUp={press.onPointerUp}
      onPointerCancel={press.onPointerCancel}
      onContextMenu={press.onContextMenu}
      onClick={press.onClick}
    >
      launch
    </button>
  );
};

describe("usePressGesture", () => {
  it("tells a tap from a hold, capturing the pointer for the press", () => {
    const props = probe();
    const { getByText } = render(<HoldButton {...props} />);
    const button = getByText("launch");

    fireEvent(button, pointerAt("pointerdown", 1000));
    expect(props.onPress).toHaveBeenCalledTimes(1);
    expect(button.hasPointerCapture(7)).toBe(true);
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(props.onRelease).toHaveBeenLastCalledWith("tap");

    fireEvent(button, pointerAt("pointerdown", 2000));
    fireEvent(button, pointerAt("pointerup", 2400));
    expect(props.onRelease).toHaveBeenLastCalledWith("hold");
  });

  it("starts nothing when the control refuses the press, so letting go releases nothing", () => {
    const props = probe(false);
    const { getByText } = render(<HoldButton {...props} />);
    const button = getByText("launch");

    fireEvent(button, pointerAt("pointerdown", 1000));
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(props.onPress).not.toHaveBeenCalled();
    expect(props.onRelease).not.toHaveBeenCalled();
    expect(button.hasPointerCapture(7)).toBe(false);
  });

  it("drops a cancelled press, and always says it was cancelled", () => {
    const props = probe();
    const { getByText } = render(<HoldButton {...props} />);
    const button = getByText("launch");

    fireEvent(button, pointerAt("pointerdown", 1000));
    fireEvent(button, pointerAt("pointercancel", 1050));
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onRelease).not.toHaveBeenCalled();

    fireEvent(button, pointerAt("pointercancel", 1200));
    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });

  it("presses once for a click with no pointer, ignores a pointer's click, and keeps the context menu away", () => {
    const props = probe();
    const { getByText } = render(<HoldButton {...props} />);
    const button = getByText("launch");

    fireEvent.click(button, { detail: 1 });
    expect(props.onPointerlessClick).not.toHaveBeenCalled();
    fireEvent.click(button, { detail: 0 });
    expect(props.onPointerlessClick).toHaveBeenCalledTimes(1);
    expect(fireEvent.contextMenu(button)).toBe(false);
  });
});

const Strip = ({ onSwipe }: { onSwipe: (direction: number) => void }) => {
  const swipe = useSwipe(onSwipe, 40);

  return <div data-testid="strip" onPointerDown={swipe.onPointerDown} onPointerUp={swipe.onPointerUp} />;
};

describe("useSwipe", () => {
  it("turns a long swipe of a finger into a step and leaves a mouse alone", () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(<Strip onSwipe={onSwipe} />);

    fireEvent.pointerDown(getByTestId("strip"), { pointerType: "touch", clientX: 200 });
    fireEvent.pointerUp(getByTestId("strip"), { pointerType: "touch", clientX: 100 });
    expect(onSwipe).toHaveBeenLastCalledWith(1);

    fireEvent.pointerDown(getByTestId("strip"), { pointerType: "mouse", clientX: 100 });
    fireEvent.pointerUp(getByTestId("strip"), { pointerType: "mouse", clientX: 200 });
    expect(onSwipe).toHaveBeenCalledTimes(1);
  });
});
