import { MouseEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

import { LAUNCH_THEME } from "@/config/theme";
import { CROSSED_ZONES } from "@/config/zones";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import type { LaunchSnapshot } from "@/packages/games/launch";

// A press shorter than this is a tap, which launches by itself; anything longer is a hold.
const TAP_MS = 250;

const READY: LaunchSnapshot = { status: "ready", passed: 0, countdown: 0 };

// Binds the launch to a canvas inside its board: built (and its code fetched) as the board comes near, sized
// to it. It lifts off by itself the first time the board is in view. Holding the button charges the engines; a
// tap, Space, Enter or an assistive click launches with no holding at all; reduced motion goes straight to
// orbit. In orbit, the button nobody should press blows the ship up and launches a new one.
export const useLaunch = (boardRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>, isInView: boolean) => {
  const [snapshot, setSnapshot] = useState<LaunchSnapshot>(READY);
  const pressedAt = useRef<number | null>(null);
  const hasLaunchedItself = useRef(false);
  const game = useCanvasEngine(canvasRef, {
    sizeRef: boardRef,
    contextOptions: { alpha: false },
    create: async (context) => {
      const { LaunchGame } = await import("@/packages/games/launch");

      return LaunchGame.forCanvas(context, { theme: LAUNCH_THEME, config: { markers: CROSSED_ZONES.length }, onChange: setSnapshot });
    },
    resize: (launch, { width, height, pixelRatio }) => launch.resize({ width, height }, pixelRatio),
  }, []);

  const launchNow = useCallback(() => {
    if (prefersReducedMotion()) {
      game?.complete();
    } else {
      game?.launch();
    }
  }, [game]);

  // Once a visit, as the reader arrives: the ship does not wait to be asked.
  useEffect(() => {
    if (game && isInView && !hasLaunchedItself.current && snapshot.status === "ready") {
      hasLaunchedItself.current = true;
      launchNow();
    }
  }, [game, isInView, launchNow, snapshot.status]);

  // Without motion there is no countdown to watch: the ship is simply back in orbit.
  const selfDestruct = useCallback(() => {
    if (prefersReducedMotion()) {
      game?.reset();
      game?.complete();
    } else {
      game?.selfDestruct();
    }
  }, [game]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!game || (snapshot.status !== "ready" && snapshot.status !== "charging")) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pressedAt.current = event.timeStamp;

    if (prefersReducedMotion()) {
      game.complete();
    } else {
      game.press();
    }
  }, [game, snapshot.status]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (pressedAt.current === null) {
      return;
    }

    const heldMs = event.timeStamp - pressedAt.current;

    pressedAt.current = null;

    game?.release();

    if (heldMs < TAP_MS) {
      launchNow();
    }
  }, [game, launchNow]);

  const onPointerCancel = useCallback(() => {
    pressedAt.current = null;
    game?.release();
  }, [game]);

  // Keyboards and assistive technology click without a pointer (detail is 0): that is a single press.
  const onClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) {
      launchNow();
    }
  }, [launchNow]);

  return { snapshot, isReady: game !== null, onPointerDown, onPointerUp, onPointerCancel, onClick, selfDestruct };
};
