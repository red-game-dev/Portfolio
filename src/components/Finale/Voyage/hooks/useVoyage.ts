import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

import { VOYAGE_THEME } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import type { VoyageSnapshot } from "@/packages/games/voyage";
import { clamp } from "@/packages/math/clamp";

// Arrow keys and WASD steer; holding two at once flies on the diagonal.
const STEER_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  w: [0, -1],
  s: [0, 1],
};

const keyOf = (event: KeyboardEvent<HTMLElement>) => (event.key.length === 1 ? event.key.toLowerCase() : event.key);

// Binds the voyage to a canvas filling its stage: its code fetched when the dialog opens, sized to the stage,
// paused when the tab is hidden, steered by keys, a mouse (no press needed) or a finger (while it is down).
export const useVoyage = (stageRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>) => {
  const [snapshot, setSnapshot] = useState<VoyageSnapshot | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const held = useRef(new Set<string>());
  const game = useCanvasEngine(canvasRef, {
    sizeRef: stageRef,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    create: async (context) => {
      const { VoyageGame } = await import("@/packages/games/voyage");

      return VoyageGame.forCanvas(context, { theme: VOYAGE_THEME, onChange: setSnapshot });
    },
    resize: (voyage, { width, height, pixelRatio }) => voyage.resize({ width, height }, pixelRatio),
  }, []);
  const isFlying = snapshot?.status === "flying";

  const play = useCallback(() => {
    held.current.clear();
    game?.steer(0, 0);
    game?.play();
    setIsPaused(false);
    stageRef.current?.focus();
  }, [game, stageRef]);

  const pause = useCallback(() => {
    if (game?.isRunning && isFlying) {
      game.pause();
      setIsPaused(true);
    }
  }, [game, isFlying]);

  const resume = useCallback(() => {
    game?.resume();
    setIsPaused(false);
    stageRef.current?.focus();
  }, [game, stageRef]);

  // A hidden tab stops drawing anyway; pausing as well means the run waits instead of jumping on return.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        pause();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  const steerFromKeys = useCallback(() => {
    let x = 0;
    let y = 0;

    held.current.forEach((key) => {
      const [dx, dy] = STEER_KEYS[key] ?? [0, 0];

      x += dx;
      y += dy;
    });

    game?.steer(clamp(x, -1, 1), clamp(y, -1, 1));
  }, [game]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    const key = keyOf(event);

    if (STEER_KEYS[key] && isFlying) {
      event.preventDefault();
      // Keys take over from the pointer until it moves again.
      game?.release();
      held.current.add(key);
      steerFromKeys();
    } else if (key === "p" && isFlying) {
      event.preventDefault();

      if (isPaused) {
        resume();
      } else {
        pause();
      }
    }
  }, [game, isFlying, isPaused, pause, resume, steerFromKeys]);

  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (held.current.delete(keyOf(event))) {
      steerFromKeys();
    }
  }, [steerFromKeys]);

  const pointTo = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    game?.pointTo(event.clientX - rect.left, event.clientY - rect.top);
  }, [game]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    pointTo(event);
  }, [pointTo]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      pointTo(event);
    }
  }, [pointTo]);

  // A finger lifted, or the mouse gone off the stage: the ship holds its line.
  const onPointerEnd = useCallback(() => game?.release(), [game]);

  return { snapshot, isReady: game !== null, isPaused, play, pause, resume, onKeyDown, onKeyUp, onPointerDown, onPointerMove, onPointerEnd };
};
