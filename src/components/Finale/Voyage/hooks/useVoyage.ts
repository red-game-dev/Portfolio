import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

import { VOYAGE_THEME } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import type { VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";

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

const keyOf = (event: KeyboardEvent<HTMLElement>) => (event.key.length === 1 ? event.key.toLowerCase() : event.key);

export interface VoyageCanvasRefs {
  stage: RefObject<HTMLElement>;
  back: RefObject<HTMLCanvasElement>;
  front: RefObject<HTMLCanvasElement>;
  lens: RefObject<HTMLCanvasElement>;
}

// Binds the voyage to its three canvases: its code fetched when the dialog opens, sized to the stage, paused when
// the tab is hidden, flown by a mouse (no press needed), a finger (while it is down) or the keys.
export const useVoyage = ({ stage, back, front, lens }: VoyageCanvasRefs) => {
  const [snapshot, setSnapshot] = useState<VoyageSnapshot | null>(null);
  const [notice, setNotice] = useState<VoyageNotice | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const held = useRef(new Set<string>());
  const game = useCanvasEngine(back, {
    sizeRef: stage,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    create: async (context) => {
      const { VoyageGame } = await import("@/packages/games/voyage");
      const frontContext = front.current?.getContext("2d");

      if (!frontContext) {
        throw new Error("The voyage's front canvas is missing");
      }

      return VoyageGame.forCanvas({ back: context, front: frontContext, lens: lens.current }, { theme: VOYAGE_THEME, onChange: setSnapshot, onNotice: setNotice });
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
    }
  }, [applyKeys, isFlying, isPaused, pause, resume]);

  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (held.current.delete(keyOf(event))) {
      applyKeys();
    }
  }, [applyKeys]);

  const pointAt = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    game?.point({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, [game]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    pointAt(event);
  }, [pointAt]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      pointAt(event);
    }
  }, [pointAt]);

  // A finger lifted, or the mouse gone from the stage: the ship coasts.
  const onPointerEnd = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.type !== "pointerup" || event.pointerType !== "mouse") {
      game?.point(null);
    }
  }, [game]);

  return { snapshot, notice, isReady: game !== null, isPaused, play, pause, resume, onKeyDown, onKeyUp, onPointerDown, onPointerMove, onPointerEnd };
};
