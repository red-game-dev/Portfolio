import { useRef } from "react";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { portfolioData } from "@/data/resume";
import type { BugRaidGame as BugRaidGameClass } from "@/packages/games/bug-raid";
import type { LaunchGame as LaunchGameClass, LaunchSnapshot } from "@/packages/games/launch";
import type { EconomyView, VoyageGame as VoyageGameClass, VoyageSnapshot } from "@/packages/games/voyage";
import type { Pilot } from "@/services/voyage/pilot";

import { stubCanvases } from "./fixtures/canvas";
import { installPointerEvents, pointerAt } from "./fixtures/pointer";

// The games and the pilot's store are fakes, and the real maps never arrive. The project's Babel does not hoist
// jest.mock, so the hooks and the mocked modules are loaded below, once the mocks are in place.
jest.mock("@/packages/games/bug-raid", () => ({ BugRaidGame: { forCanvas: jest.fn() } }));
jest.mock("@/packages/games/launch", () => ({ LaunchGame: { forCanvas: jest.fn() } }));
jest.mock("@/packages/games/voyage", () => ({ VoyageGame: { forCanvas: jest.fn() } }));
jest.mock("@/services/voyage/pilot", () => ({ openPilot: jest.fn() }));
jest.mock("@/packages/browser/images", () => ({ decodeImage: () => new Promise(() => undefined) }));

const { useBugRaid } = jest.requireActual<typeof import("@/components/Arena/hooks/useBugRaid")>("@/components/Arena/hooks/useBugRaid");
const { useLaunch } = jest.requireActual<typeof import("@/components/Finale/hooks/useLaunch")>("@/components/Finale/hooks/useLaunch");
const { useVoyage } = jest.requireActual<typeof import("@/components/Finale/Voyage/hooks/useVoyage")>("@/components/Finale/Voyage/hooks/useVoyage");
const { BugRaidGame } = jest.requireMock<{ BugRaidGame: { forCanvas: jest.Mock } }>("@/packages/games/bug-raid");
const { LaunchGame } = jest.requireMock<{ LaunchGame: { forCanvas: jest.Mock } }>("@/packages/games/launch");
const { VoyageGame } = jest.requireMock<{ VoyageGame: { forCanvas: jest.Mock } }>("@/packages/games/voyage");
const { openPilot } = jest.requireMock<{ openPilot: jest.Mock }>("@/services/voyage/pilot");

// A game whose every method is a spy.
const fake = <T extends string>(methods: readonly T[]) => Object.fromEntries(methods.map((name) => [name, jest.fn()])) as Record<T, jest.Mock>;

// The options a mocked game was last built with, to drive it as the real one would.
const lastOptions = <T,>(forCanvas: unknown) => (forCanvas as jest.Mock).mock.calls.at(-1)?.[1] as T;

let restoreCanvases: () => void = () => undefined;

beforeAll(() => {
  installPointerEvents();
  restoreCanvases = stubCanvases();
});

afterAll(() => restoreCanvases());

afterEach(() => jest.clearAllMocks());

const Raid = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { onPointerDown, onKeyDown } = useBugRaid(boardRef, canvasRef, { productionLabel: "production" });

  return (
    // The arena's board is a focusable group the same way.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex
    <div ref={boardRef} tabIndex={0} role="group" aria-label="board" onPointerDown={onPointerDown} onKeyDown={onKeyDown}>
      <canvas ref={canvasRef} />
    </div>
  );
};

describe("Bug Raid's controls", () => {
  const build = async () => {
    const game = { ...fake(["stop", "resize", "aim", "strike", "play", "pause", "resume"] as const), strikeAtCursor: jest.fn(() => false), isRunning: true };

    BugRaidGame.forCanvas.mockReturnValue(game as unknown as BugRaidGameClass);
    render(<Raid />);
    await waitFor(() => expect(game.resize).toHaveBeenCalled());
    await act(async () => undefined);

    return { game, board: screen.getByRole("group", { name: "board" }) };
  };

  it("aims with the arrows and strikes with Space and Enter, whatever modifiers are down, even on a miss", async () => {
    const { game, board } = await build();

    expect(fireEvent.keyDown(board, { key: "ArrowLeft" })).toBe(false);
    expect(game.aim).toHaveBeenLastCalledWith(-1, 0);

    fireEvent.keyDown(board, { key: "ArrowDown", ctrlKey: true });
    expect(game.aim).toHaveBeenLastCalledWith(0, 1);

    expect(fireEvent.keyDown(board, { key: " " })).toBe(false);
    expect(fireEvent.keyDown(board, { key: "Enter" })).toBe(false);
    expect(game.strikeAtCursor).toHaveBeenCalledTimes(2);

    expect(fireEvent.keyDown(board, { key: "a" })).toBe(true);
  });

  it("leaves every key to the browser while the game is not running", async () => {
    const { game, board } = await build();

    game.isRunning = false;
    expect(fireEvent.keyDown(board, { key: " " })).toBe(true);
    expect(game.strikeAtCursor).not.toHaveBeenCalled();
  });

  it("strikes where the pointer goes down on the board", async () => {
    const { game, board } = await build();

    board.getBoundingClientRect = () => ({ left: 10, top: 20 } as DOMRect);
    fireEvent.pointerDown(board, { clientX: 30, clientY: 50 });
    expect(game.strike).toHaveBeenCalledWith(20, 30);
  });
});

const Launch = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { press, isReady } = useLaunch(boardRef, canvasRef, false, portfolioData.finale.launch.sites, portfolioData.finale.launch.readout);

  return (
    <div ref={boardRef}>
      <canvas ref={canvasRef} />
      <button
        type="button"
        disabled={!isReady}
        onPointerDown={press.onPointerDown}
        onPointerUp={press.onPointerUp}
        onPointerCancel={press.onPointerCancel}
        onContextMenu={press.onContextMenu}
        onClick={press.onClick}
      >
        launch
      </button>
    </div>
  );
};

describe("the launch button", () => {
  const build = async () => {
    const game = fake(["stop", "resize", "setTexture", "dispose", "press", "release", "launch", "complete", "reset", "selfDestruct"] as const);

    LaunchGame.forCanvas.mockReturnValue(game as unknown as LaunchGameClass);
    render(<Launch />);
    await waitFor(() => expect(screen.getByRole("button", { name: "launch" })).toBeEnabled());

    const leave = (status: LaunchSnapshot["status"]) => act(() => {
      lastOptions<{ onChange: (snapshot: LaunchSnapshot) => void }>(LaunchGame.forCanvas).onChange({ status, passed: 0, countdown: 0, milestone: null });
    });

    return { game, button: screen.getByRole("button", { name: "launch" }), leave };
  };

  it("charges while held, and launches by itself when tapped", async () => {
    const { game, button } = await build();

    fireEvent(button, pointerAt("pointerdown", 1000));
    expect(game.press).toHaveBeenCalledTimes(1);
    expect(button.hasPointerCapture(7)).toBe(true);
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(game.release).toHaveBeenCalledTimes(1);
    expect(game.launch).toHaveBeenCalledTimes(1);

    fireEvent(button, pointerAt("pointerdown", 2000));
    fireEvent(button, pointerAt("pointerup", 2600));
    expect(game.release).toHaveBeenCalledTimes(2);
    expect(game.launch).toHaveBeenCalledTimes(1);
  });

  it("launches with one press from a keyboard or assistive technology, and keeps the long press menu away", async () => {
    const { game, button } = await build();

    fireEvent.click(button, { detail: 1 });
    expect(game.launch).not.toHaveBeenCalled();
    fireEvent.click(button, { detail: 0 });
    expect(game.launch).toHaveBeenCalledTimes(1);
    expect(fireEvent.contextMenu(button)).toBe(false);
  });

  it("takes no press once the ship has left the pad", async () => {
    const { game, button, leave } = await build();

    leave("launching");
    fireEvent(button, pointerAt("pointerdown", 1000));
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(game.press).not.toHaveBeenCalled();
    expect(game.release).not.toHaveBeenCalled();
    expect(game.launch).not.toHaveBeenCalled();
  });

  it("lets go of the engines when the pointer is taken away, without launching", async () => {
    const { game, button } = await build();

    fireEvent(button, pointerAt("pointerdown", 1000));
    fireEvent(button, pointerAt("pointercancel", 1050));
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(game.release).toHaveBeenCalledTimes(1);
    expect(game.launch).not.toHaveBeenCalled();
  });

  it("goes straight to orbit under reduced motion", async () => {
    const { matchMedia } = window;

    window.matchMedia = (query: string) => ({ ...matchMedia(query), matches: query.includes("reduce") });

    const { game, button } = await build();

    fireEvent(button, pointerAt("pointerdown", 1000));
    fireEvent(button, pointerAt("pointerup", 1100));
    expect(game.press).not.toHaveBeenCalled();
    expect(game.launch).not.toHaveBeenCalled();
    expect(game.complete).toHaveBeenCalledTimes(2);
    window.matchMedia = matchMedia;
  });
});

const VOYAGE_METHODS = [
  "stop", "dispose", "resize", "setTexture", "setKeys", "play", "pause", "resume", "zoomBy", "point", "lockAt", "panBy", "setPhotoMode", "setMap",
  "setAutoFire", "act", "follow", "photo", "setLanding", "setSpaceDrag", "setTilt", "press",
] as const;

const Voyage = () => {
  const stage = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const lens = useRef<HTMLCanvasElement>(null);
  const voyage = useVoyage({ stage, back, front, lens }, { labels: {}, universes: [], syllables: portfolioData.finale.voyage.universeNames });
  const state = [voyage.isPaused && "paused", voyage.isMapOpen && "map", voyage.isHangarOpen && "hangar", voyage.isPhoto && "photo"].filter(Boolean);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div onKeyDown={voyage.onKeyDown} onKeyUp={voyage.onKeyUp}>
      <div
        ref={stage}
        tabIndex={-1}
        role="application"
        aria-label="stage"
        onPointerDown={voyage.onPointerDown}
        onPointerMove={voyage.onPointerMove}
        onPointerUp={voyage.onPointerEnd}
        onPointerCancel={voyage.onPointerEnd}
        onPointerLeave={voyage.onPointerEnd}
        onWheel={voyage.onWheel}
      >
        <canvas ref={back} />
        <canvas ref={lens} />
        <canvas ref={front} />
      </div>
      <output aria-label="state">{state.join(" ")}</output>
      <button type="button" onClick={() => voyage.play()}>play</button>
    </div>
  );
};

describe("the voyage's controls", () => {
  const SUGGESTION = { kind: "upgrade" };

  const build = async () => {
    const game = { ...fake(VOYAGE_METHODS), isRunning: true, economy: { suggestion: SUGGESTION }, careerView: null };
    const pilot = {
      hangar: { subscribe: jest.fn() },
      career: { subscribe: jest.fn() },
      repository: { loadGhost: jest.fn(async () => null), saveGhost: jest.fn(), clearGhost: jest.fn(), close: jest.fn() },
    };

    openPilot.mockResolvedValue(pilot as unknown as Pilot);
    VoyageGame.forCanvas.mockReturnValue(game as unknown as VoyageGameClass);
    render(<PreferencesProvider><Voyage /></PreferencesProvider>);
    await waitFor(() => expect(VoyageGame.forCanvas).toHaveBeenCalled());
    await act(async () => undefined);

    const options = lastOptions<{ onChange: (snapshot: VoyageSnapshot) => void; onEconomy: (economy: EconomyView) => void }>(VoyageGame.forCanvas);
    const stage = screen.getByRole("application", { name: "stage" });
    const fly = (status: VoyageSnapshot["status"] = "flying", autoFire = true) => act(() => {
      options.onChange({ status, autoFire } as unknown as VoyageSnapshot);
    });
    const suggest = (suggestion: unknown) => act(() => {
      options.onEconomy({ suggestion } as unknown as EconomyView);
    });

    stage.getBoundingClientRect = () => ({ left: 10, top: 20 } as DOMRect);

    return { game, stage, fly, suggest, state: () => screen.getByLabelText("state").textContent };
  };

  it("steers with the arrows and WASD in flight, each key held until it comes up", async () => {
    const { game, stage, fly } = await build();

    fly();
    expect(fireEvent.keyDown(stage, { key: "ArrowLeft" })).toBe(false);
    expect(game.setKeys).toHaveBeenLastCalledWith({ turn: -1, thrust: 0, brake: false });

    fireEvent.keyDown(stage, { key: "W", shiftKey: true });
    expect(game.setKeys).toHaveBeenLastCalledWith({ turn: -1, thrust: 1, brake: false });

    fireEvent.keyDown(stage, { key: "a" });
    fireEvent.keyUp(stage, { key: "ArrowLeft" });
    expect(game.setKeys).toHaveBeenLastCalledWith({ turn: -1, thrust: 1, brake: false });
    fireEvent.keyUp(stage, { key: "A" });
    expect(game.setKeys).toHaveBeenLastCalledWith({ turn: 0, thrust: 1, brake: false });

    fireEvent.keyDown(stage, { key: "s" });
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(game.setKeys).toHaveBeenLastCalledWith({ turn: 1, thrust: 1, brake: true });

    const calls = game.setKeys.mock.calls.length;

    fireEvent.keyUp(stage, { key: "q" });
    expect(game.setKeys).toHaveBeenCalledTimes(calls);
  });

  it("leaves the keys to the browser before a run, and with Ctrl, Cmd or Alt down", async () => {
    const { game, stage, fly, state } = await build();

    fly("ready");
    expect(fireEvent.keyDown(stage, { key: "ArrowUp" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "m" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "c" })).toBe(true);

    fly();
    expect(fireEvent.keyDown(stage, { key: "ArrowUp", altKey: true })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "w", metaKey: true })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "h", ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "Escape" })).toBe(true);
    expect(game.setKeys).not.toHaveBeenCalled();
    expect(game.setMap).not.toHaveBeenCalled();
    expect(state()).toBe("");
  });

  it("pauses and resumes with P, opens the map with M and turns the guns with F", async () => {
    const { game, stage, fly, state } = await build();

    fly();
    expect(fireEvent.keyDown(stage, { key: "p" })).toBe(false);
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(state()).toBe("paused");
    fireEvent.keyDown(stage, { key: "P", shiftKey: true });
    expect(game.resume).toHaveBeenCalledTimes(1);
    expect(state()).toBe("");

    expect(fireEvent.keyDown(stage, { key: "m" })).toBe(false);
    expect(game.setMap).toHaveBeenLastCalledWith(true);
    expect(game.pause).toHaveBeenCalledTimes(2);
    expect(state()).toBe("map");
    fireEvent.keyDown(stage, { key: "m" });
    expect(game.setMap).toHaveBeenLastCalledWith(false);
    expect(game.resume).toHaveBeenCalledTimes(2);

    expect(fireEvent.keyDown(stage, { key: "f" })).toBe(false);
    expect(game.setAutoFire).toHaveBeenCalledWith(false);
  });

  it("keeps to the hangar's own keys while it is open, and Escape closes it first", async () => {
    const { game, stage, fly, state } = await build();

    fly();
    expect(fireEvent.keyDown(stage, { key: "h" })).toBe(false);
    expect(state()).toBe("hangar");
    expect(game.pause).toHaveBeenCalledTimes(1);

    expect(fireEvent.keyDown(stage, { key: "p" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "m" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "c" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "ArrowLeft" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "+" })).toBe(true);
    expect(game.pause).toHaveBeenCalledTimes(1);
    expect(game.setKeys).not.toHaveBeenCalled();
    expect(game.zoomBy).not.toHaveBeenCalled();

    expect(fireEvent.keyDown(stage, { key: "u" })).toBe(false);
    expect(game.follow).toHaveBeenCalledWith(SUGGESTION);

    expect(fireEvent.keyDown(stage, { key: "Escape" })).toBe(false);
    expect(state()).toBe("");
    expect(game.resume).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(stage, { key: "h" });
    fireEvent.keyDown(stage, { key: "H", shiftKey: true });
    expect(state()).toBe("");
  });

  it("follows the suggestion with U, and leaves U alone when there is none", async () => {
    const { game, stage, fly, suggest } = await build();

    fly();
    expect(fireEvent.keyDown(stage, { key: "u" })).toBe(false);
    expect(game.follow).toHaveBeenCalledTimes(1);

    suggest(null);
    expect(fireEvent.keyDown(stage, { key: "u" })).toBe(true);
    expect(game.follow).toHaveBeenCalledTimes(1);
  });

  it("looks round photo mode with the arrows, zooms it with + and -, and leaves it with Escape", async () => {
    const { game, stage, fly, state } = await build();

    fly();
    expect(fireEvent.keyDown(stage, { key: "c" })).toBe(false);
    expect(game.setPhotoMode).toHaveBeenLastCalledWith(true);
    expect(state()).toBe("photo");

    expect(fireEvent.keyDown(stage, { key: "ArrowLeft" })).toBe(false);
    expect(game.panBy).toHaveBeenLastCalledWith(60, 0);
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(game.panBy).toHaveBeenLastCalledWith(-60, 0);
    fireEvent.keyDown(stage, { key: "ArrowUp" });
    expect(game.panBy).toHaveBeenLastCalledWith(0, 60);
    fireEvent.keyDown(stage, { key: "ArrowDown" });
    expect(game.panBy).toHaveBeenLastCalledWith(0, -60);
    expect(game.setKeys).not.toHaveBeenCalled();

    expect(fireEvent.keyDown(stage, { key: "w" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "p" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "m" })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: "h" })).toBe(true);
    expect(game.pause).not.toHaveBeenCalled();

    expect(fireEvent.keyDown(stage, { key: "+" })).toBe(false);
    expect(game.zoomBy).toHaveBeenLastCalledWith(1.25);
    fireEvent.keyDown(stage, { key: "-" });
    expect(game.zoomBy).toHaveBeenLastCalledWith(0.8);
    fireEvent.keyDown(stage, { key: "=" });
    expect(game.zoomBy).toHaveBeenLastCalledWith(1.25);

    expect(fireEvent.keyDown(stage, { key: "Escape" })).toBe(false);
    expect(game.setPhotoMode).toHaveBeenLastCalledWith(false);
    expect(state()).toBe("");
  });

  it("zooms with + and - in flight and with the wheel", async () => {
    const { game, stage, fly } = await build();

    fly();
    expect(fireEvent.keyDown(stage, { key: "=" })).toBe(false);
    expect(game.zoomBy).toHaveBeenLastCalledWith(1.25);
    fireEvent.keyDown(stage, { key: "-" });
    expect(game.zoomBy).toHaveBeenLastCalledWith(0.8);

    fireEvent.wheel(stage, { deltaY: 100 });
    expect(game.zoomBy).toHaveBeenLastCalledWith(Math.exp(-100 * 0.0015));
  });

  it("lets go of every held key when a run starts", async () => {
    const { game, stage, fly } = await build();

    fly();
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: "play" }));
    expect(game.setKeys).toHaveBeenLastCalledWith({ turn: 0, thrust: 0, brake: false });
    expect(game.play).toHaveBeenCalledWith("free");

    const calls = game.setKeys.mock.calls.length;

    fireEvent.keyUp(stage, { key: "ArrowLeft" });
    expect(game.setKeys).toHaveBeenCalledTimes(calls);
  });

  it("steers towards a mouse without a press, locks on where it presses, and coasts once it leaves", async () => {
    const { game, stage } = await build();

    fireEvent.pointerMove(stage, { pointerType: "mouse", clientX: 110, clientY: 70 });
    expect(game.point).toHaveBeenLastCalledWith({ x: 100, y: 50 });

    fireEvent.pointerDown(stage, { pointerType: "mouse", clientX: 60, clientY: 40 });
    expect(game.lockAt).toHaveBeenCalledWith({ x: 50, y: 20 });
    expect(game.point).toHaveBeenLastCalledWith({ x: 50, y: 20 });
    expect(stage.hasPointerCapture(1)).toBe(false);

    fireEvent.pointerUp(stage, { pointerType: "mouse" });
    expect(game.point).toHaveBeenLastCalledWith({ x: 50, y: 20 });

    fireEvent.pointerLeave(stage, { pointerType: "mouse" });
    expect(game.point).toHaveBeenLastCalledWith(null);
  });

  it("steers with one finger while it is down and zooms with two by how far they spread", async () => {
    const { game, stage } = await build();

    fireEvent.pointerMove(stage, { pointerType: "touch", pointerId: 1, clientX: 110, clientY: 20 });
    expect(game.point).not.toHaveBeenCalled();

    fireEvent.pointerDown(stage, { pointerType: "touch", pointerId: 1, clientX: 110, clientY: 20 });
    expect(game.lockAt).toHaveBeenLastCalledWith({ x: 100, y: 0 });
    expect(stage.hasPointerCapture(1)).toBe(true);
    expect(game.point).toHaveBeenLastCalledWith({ x: 100, y: 0 });

    fireEvent.pointerMove(stage, { pointerType: "touch", pointerId: 1, clientX: 130, clientY: 20 });
    expect(game.point).toHaveBeenLastCalledWith({ x: 120, y: 0 });

    fireEvent.pointerDown(stage, { pointerType: "touch", pointerId: 2, clientX: 230, clientY: 20 });
    expect(game.lockAt).toHaveBeenLastCalledWith({ x: 220, y: 0 });
    expect(game.point).toHaveBeenLastCalledWith(null);
    expect(game.zoomBy).not.toHaveBeenCalled();

    fireEvent.pointerMove(stage, { pointerType: "touch", pointerId: 2, clientX: 330, clientY: 20 });
    expect(game.zoomBy).toHaveBeenLastCalledWith(2);
    expect(game.point).toHaveBeenLastCalledWith(null);

    fireEvent.pointerUp(stage, { pointerType: "touch", pointerId: 2 });
    expect(game.point).toHaveBeenLastCalledWith(null);

    fireEvent.pointerMove(stage, { pointerType: "touch", pointerId: 1, clientX: 140, clientY: 20 });
    expect(game.point).toHaveBeenLastCalledWith({ x: 130, y: 0 });
    expect(game.zoomBy).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(stage, { pointerType: "touch", pointerId: 1 });
    expect(game.point).toHaveBeenLastCalledWith(null);
  });

  it("looks round photo mode with a drag and zooms it with a pinch, steering and locking on nothing", async () => {
    const { game, stage, fly } = await build();

    fly();
    fireEvent.keyDown(stage, { key: "c" });

    fireEvent.pointerDown(stage, { pointerType: "mouse", pointerId: 1, clientX: 100, clientY: 100 });
    expect(stage.hasPointerCapture(1)).toBe(true);
    fireEvent.pointerMove(stage, { pointerType: "mouse", pointerId: 1, clientX: 130, clientY: 90 });
    expect(game.panBy).toHaveBeenLastCalledWith(30, -10);
    fireEvent.pointerMove(stage, { pointerType: "mouse", pointerId: 1, clientX: 135, clientY: 95 });
    expect(game.panBy).toHaveBeenLastCalledWith(5, 5);

    fireEvent.pointerUp(stage, { pointerType: "mouse", pointerId: 1 });
    fireEvent.pointerMove(stage, { pointerType: "mouse", pointerId: 1, clientX: 200, clientY: 200 });
    expect(game.panBy).toHaveBeenCalledTimes(2);
    expect(game.lockAt).not.toHaveBeenCalled();
    expect(game.point).not.toHaveBeenCalled();

    fireEvent.pointerDown(stage, { pointerType: "touch", pointerId: 3, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { pointerType: "touch", pointerId: 3, clientX: 10, clientY: 0 });
    expect(game.panBy).toHaveBeenLastCalledWith(10, 0);

    fireEvent.pointerDown(stage, { pointerType: "touch", pointerId: 4, clientX: 10, clientY: 50 });
    fireEvent.pointerMove(stage, { pointerType: "touch", pointerId: 4, clientX: 10, clientY: 100 });
    expect(game.zoomBy).toHaveBeenLastCalledWith(2);
    expect(game.panBy).toHaveBeenCalledTimes(3);
    expect(game.lockAt).not.toHaveBeenCalled();
  });
});
