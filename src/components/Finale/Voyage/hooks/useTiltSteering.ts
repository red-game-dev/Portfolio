import { useEffect, useRef } from "react";

import { screenLean, tiltSteer } from "@/components/Finale/Voyage/tilt";
import type { VoyageGame } from "@/packages/games/voyage";

// Steers the voyage by tilting the device while `isOn`: level is however it is held when the flight starts (or the
// setting is turned on), and a lean from there flies that way, harder the further it leans.
export const useTiltSteering = (game: VoyageGame | null, isOn: boolean, isFlying: boolean): void => {
  const level = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    level.current = null;
  }, [isFlying, isOn]);

  useEffect(() => {
    if (!game || !isOn) {
      game?.setTilt(null);

      return undefined;
    }

    const onLean = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) {
        return;
      }

      const lean = screenLean(event.beta, event.gamma, window.screen.orientation?.angle ?? 0);

      level.current = level.current ?? lean;
      game.setTilt(tiltSteer(lean, level.current));
    };

    window.addEventListener("deviceorientation", onLean);

    return () => {
      window.removeEventListener("deviceorientation", onLean);
      game.setTilt(null);
    };
  }, [game, isOn]);
};
