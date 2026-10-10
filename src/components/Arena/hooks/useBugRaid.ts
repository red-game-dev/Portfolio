import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

import { BUG_RAID_THEME } from "@/components/Arena/config";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import useInView from "@/hooks/useInView";
import type { BugRaidSnapshot } from "@/packages/games/bug-raid";
import { localPoint } from "@/packages/interaction/gestures";
import { ARROW_STEPS, KeyMap, KeyStep } from "@/packages/interaction/keys";

interface BugRaidOptions {
  productionLabel: string;
  onChange?: (snapshot: BugRaidSnapshot) => void;
}

// Arrow keys move the cursor one step on each axis; Space and Enter strike where it is.
const RAID_KEYS = new KeyMap<Readonly<KeyStep> | "strike">({ ...ARROW_STEPS, " ": "strike", "Enter": "strike" });

// Binds a Bug Raid game to a canvas inside a board element: built (and its code fetched) as the board comes
// near, sized to the board, paused when the board scrolls away, with pointer and keyboard input mapped
// onto it.
export const useBugRaid = (boardRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>, { productionLabel, onChange }: BugRaidOptions) => {
  const onChangeRef = useRef(onChange);
  const [snapshot, setSnapshot] = useState<BugRaidSnapshot | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isOnScreen = useInView(boardRef, { threshold: 0.25, once: false });
  // The game's code is fetched as the arena comes near, not with the page.
  const game = useCanvasEngine(canvasRef, {
    sizeRef: boardRef,
    contextOptions: { alpha: false },
    create: async (context) => {
      const { BugRaidGame } = await import("@/packages/games/bug-raid");

      return BugRaidGame.forCanvas(context, {
        theme: BUG_RAID_THEME,
        productionLabel,
        onChange: (next) => {
          setSnapshot(next);
          onChangeRef.current?.(next);
        },
      });
    },
    resize: (raid, { width, height, pixelRatio }) => raid.resize({ width, height }, pixelRatio),
  }, [productionLabel]);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isOnScreen && game?.isRunning) {
      game.pause();
      setIsPaused(true);
    }
  }, [game, isOnScreen]);

  const play = useCallback(() => {
    game?.play();
    setIsPaused(false);
    boardRef.current?.focus();
  }, [boardRef, game]);

  const resume = useCallback(() => {
    game?.resume();
    setIsPaused(false);
    boardRef.current?.focus();
  }, [boardRef, game]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const point = localPoint(event, event.currentTarget);

    game?.strike(point.x, point.y);
  }, [game]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (!game?.isRunning) {
      return;
    }

    RAID_KEYS.handle(event, (intent) => {
      if (intent === "strike") {
        game.strikeAtCursor();
      } else {
        game.aim(intent.x, intent.y);
      }
    });
  }, [game]);

  return { snapshot, isPaused, play, resume, onPointerDown, onKeyDown };
};
