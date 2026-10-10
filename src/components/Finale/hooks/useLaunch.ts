import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { usePressGesture } from "@/components/Finale/hooks/usePressGesture";
import { LAUNCH_TEXTURES, LAUNCH_THEME } from "@/config/theme";
import { CROSSED_ZONES } from "@/config/zones";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { decodeImage } from "@/packages/browser/images";
import type { LaunchSnapshot } from "@/packages/games/launch";
import { FinaleLaunchSite } from "@/types/game";

// A press shorter than this is a tap, which launches by itself; anything longer is a hold.
const TAP_MS = 250;

const READY: LaunchSnapshot = { status: "ready", passed: 0, countdown: 0, milestone: null };

// Binds the launch to a canvas inside its board: built (and its code fetched) as the board comes near, sized
// to it, at a real pad picked at random each visit (after mount, so the server and the first render agree), with
// the Sun over it where it really is now. It lifts off by itself the first time the board is in view. Holding the
// button charges the engines; a tap, Space, Enter or an assistive click launches with no holding at all; reduced
// motion goes straight to orbit. In orbit, the button nobody should press blows the rocket up and launches
// another.
export const useLaunch = (boardRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>, isInView: boolean, sites: FinaleLaunchSite[],
  labels: { altitude: string; speed: string }) => {
  const [snapshot, setSnapshot] = useState<LaunchSnapshot>(READY);
  const [site, setSite] = useState<FinaleLaunchSite | null>(null);
  const hasLaunchedItself = useRef(false);

  useEffect(() => {
    setSite(sites[Math.floor(Math.random() * sites.length)] ?? null);
  }, [sites]);

  // The Earth below is fetched a screen and a half before the board arrives, so it is the real one by orbit; the
  // game picks the maps up from the same promises once it is built.
  const isApproaching = useInView(boardRef, { once: true, threshold: 0, rootMargin: "150% 0px" });

  useEffect(() => {
    if (isApproaching) {
      Object.values(LAUNCH_TEXTURES).forEach((url) => {
        decodeImage(url).catch(() => undefined);
      });
    }
  }, [isApproaching]);

  const game = useCanvasEngine(canvasRef, {
    sizeRef: boardRef,
    contextOptions: { alpha: false },
    isEnabled: site !== null,
    create: async (context) => {
      const { LaunchGame } = await import("@/packages/games/launch");

      return LaunchGame.forCanvas(context, {
        theme: LAUNCH_THEME,
        labels,
        site: site ?? undefined,
        epochMs: Date.now(),
        config: { markers: CROSSED_ZONES.length },
        onChange: setSnapshot,
      });
    },
    resize: (launch, { width, height, pixelRatio }) => launch.resize({ width, height }, pixelRatio),
  }, [site]);

  // The real maps of the Earth below, once the board is built (the engine hook gives its GPU back when it goes).
  useEffect(() => {
    if (!game) {
      return undefined;
    }

    Object.entries(LAUNCH_TEXTURES).forEach(([id, url]) => {
      decodeImage(url).then((image) => game.setTexture(id, image), () => undefined);
    });

    return undefined;
  }, [game]);

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

  // The launch button: held on the pad it charges, let go it releases, and a tap launches by itself. Keyboards and
  // assistive technology press it once, which launches too.
  const press = usePressGesture({
    tapMs: TAP_MS,
    canPress: () => game !== null && (snapshot.status === "ready" || snapshot.status === "charging"),
    onPress: () => {
      if (prefersReducedMotion()) {
        game?.complete();
      } else {
        game?.press();
      }
    },
    onRelease: (kind) => {
      game?.release();

      if (kind === "tap") {
        launchNow();
      }
    },
    onCancel: () => game?.release(),
    onPointerlessClick: launchNow,
  });

  return { snapshot, site, isReady: game !== null, press, selfDestruct };
};
