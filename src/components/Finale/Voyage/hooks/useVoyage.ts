import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState, WheelEvent } from "react";

import { VOYAGE_TEXTURES, VOYAGE_THEME } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import type { UniverseNames, VoyageGame, VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";

// What each key asks of the ship: arrows and WASD turn and burn, down and S brake.
const KEYS: Record<string, "left" | "right" | "burn" | "brake"> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "burn",
  ArrowDown: "brake",
  a: "left",
  d: "right",
  w: "burn",
  s: "brake",
};

// How much a notch of the wheel, or a key, zooms.
const WHEEL_ZOOM = 0.0015;
const KEY_ZOOM = 1.25;

const keyOf = (event: KeyboardEvent<HTMLElement>) => (event.key.length === 1 ? event.key.toLowerCase() : event.key);

// Hands the game each real map as soon as it has loaded, in order, so Earth arrives first.
const loadTextures = (game: VoyageGame) => {
  Object.entries(VOYAGE_TEXTURES).forEach(([id, url]) => {
    const image = new Image();

    image.decoding = "async";
    image.src = url;
    image.decode().then(() => game.setTexture(id, image), () => undefined);
  });
};

export interface VoyageCanvasRefs {
  stage: RefObject<HTMLElement>;
  back: RefObject<HTMLCanvasElement>;
  front: RefObject<HTMLCanvasElement>;
  lens: RefObject<HTMLCanvasElement>;
}

// Binds the voyage to its canvases: its code fetched when the dialog opens, the real maps after it, sized to the
// stage, paused when the tab is hidden, flown by a mouse (no press needed), a finger (while it is down) or the
// keys, zoomed by the wheel, a pinch or + and -, and its map opened with M.
export interface VoyageNames {
  labels: Record<string, string>;
  universes: string[];
  syllables: UniverseNames;
}

export const useVoyage = ({ stage, back, front, lens }: VoyageCanvasRefs, { labels, universes, syllables }: VoyageNames) => {
  const [snapshot, setSnapshot] = useState<VoyageSnapshot | null>(null);
  const [notice, setNotice] = useState<VoyageNotice | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const held = useRef(new Set<string>());
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const game = useCanvasEngine(back, {
    sizeRef: stage,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    create: async (context) => {
      const { VoyageGame: Game } = await import("@/packages/games/voyage");
      const frontContext = front.current?.getContext("2d");

      if (!frontContext) {
        throw new Error("The voyage's front canvas is missing");
      }

      const voyage = Game.forCanvas(
        { back: context, front: frontContext, lens: lens.current, globe: document.createElement("canvas") },
        { theme: VOYAGE_THEME, labels, universeNames: universes, syllables, onChange: setSnapshot, onNotice: setNotice },
      );

      loadTextures(voyage);

      return voyage;
    },
    resize: (voyage, { width, height, pixelRatio }) => voyage.resize({ width, height }, pixelRatio),
  }, []);
  const isFlying = snapshot?.status === "flying";

  const play = useCallback(() => {
    held.current.clear();
    game?.setKeys({ turn: 0, thrust: 0, brake: false });
    game?.play();
    setIsPaused(false);
    stage.current?.focus();
  }, [game, stage]);

  const pause = useCallback(() => {
    if (game?.isRunning && isFlying) {
      game.pause();
      setIsPaused(true);
    }
  }, [game, isFlying]);

  const resume = useCallback(() => {
    game?.resume();
    setIsPaused(false);
    stage.current?.focus();
  }, [game, stage]);

  const toggleGuns = useCallback(() => {
    if (snapshot) {
      game?.setAutoFire(!snapshot.autoFire);
    }
  }, [game, snapshot]);

  const toggleMap = useCallback(() => {
    setIsMapOpen((isOpen) => {
      game?.setMap(!isOpen);

      return !isOpen;
    });
  }, [game]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        pause();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  const applyKeys = useCallback(() => {
    const keys = [...held.current].map((key) => KEYS[key]);

    game?.setKeys({
      turn: (keys.includes("right") ? 1 : 0) - (keys.includes("left") ? 1 : 0),
      thrust: keys.includes("burn") ? 1 : 0,
      brake: keys.includes("brake"),
    });
  }, [game]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    const key = keyOf(event);

    if (KEYS[key] && isFlying) {
      event.preventDefault();
      held.current.add(key);
      applyKeys();
    } else if (key === "p" && isFlying) {
      event.preventDefault();

      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else if (key === "m" && snapshot && snapshot.status !== "ready") {
      event.preventDefault();
      toggleMap();
    } else if (key === "f" && isFlying) {
      event.preventDefault();
      toggleGuns();
    } else if ((key === "+" || key === "=" || key === "-") && game) {
      event.preventDefault();
      game.zoomBy(key === "-" ? 1 / KEY_ZOOM : KEY_ZOOM);
    }
  }, [applyKeys, game, isFlying, isPaused, pause, resume, snapshot, toggleGuns, toggleMap]);

  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (held.current.delete(keyOf(event))) {
      applyKeys();
    }
  }, [applyKeys]);

  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    game?.zoomBy(Math.exp(-event.deltaY * WHEEL_ZOOM));
  }, [game]);

  const pointAt = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    game?.point({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, [game]);

  // Two fingers down zoom by how far they spread; one steers.
  const trackTouch = useCallback((event: PointerEvent<HTMLElement>) => {
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const [first, second] = [...touches.current.values()];

    if (first && second) {
      const spread = Math.hypot(first.x - second.x, first.y - second.y);

      if (pinch.current > 0 && spread > 0) {
        game?.zoomBy(spread / pinch.current);
      }

      pinch.current = spread;
      game?.point(null);

      return true;
    }

    return false;
  }, [game]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    // A click or a tap on someone locks the guns on them; on nothing, lets go.
    game?.lockAt({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);

      if (trackTouch(event)) {
        return;
      }
    }

    pointAt(event);
  }, [game, pointAt, trackTouch]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" && trackTouch(event)) {
      return;
    }

    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      pointAt(event);
    }
  }, [pointAt, trackTouch]);

  // A finger lifted, or the mouse gone from the stage: the ship coasts.
  const onPointerEnd = useCallback((event: PointerEvent<HTMLElement>) => {
    touches.current.delete(event.pointerId);

    if (touches.current.size < 2) {
      pinch.current = 0;
    }

    if (event.type !== "pointerup" || event.pointerType !== "mouse") {
      game?.point(null);
    }
  }, [game]);

  return {
    snapshot,
    notice,
    isReady: game !== null,
    isPaused,
    isMapOpen,
    play,
    pause,
    resume,
    toggleMap,
    toggleGuns,
    onKeyDown,
    onKeyUp,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
  };
};
