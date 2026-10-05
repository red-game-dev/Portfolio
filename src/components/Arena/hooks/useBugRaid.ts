import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

import { BUG_RAID_THEME } from "@/config/theme";
import useInView from "@/hooks/useInView";
import { BugRaidGame, BugRaidSnapshot } from "@/packages/games/bug-raid";

interface BugRaidOptions {
  productionLabel: string;
  onChange?: (snapshot: BugRaidSnapshot) => void;
}

// Arrow keys move the cursor one step on each axis.
const AIM_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const STRIKE_KEYS = new Set([" ", "Enter"]);

// Binds a Bug Raid game to a canvas inside a board element: builds it once the board comes near the
// screen, keeps it sized to the board, pauses it when the board scrolls away, and maps pointer and
// keyboard input onto it.
export const useBugRaid = (boardRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>, { productionLabel, onChange }: BugRaidOptions) => {
  const gameRef = useRef<BugRaidGame | null>(null);
  const onChangeRef = useRef(onChange);
  const [snapshot, setSnapshot] = useState<BugRaidSnapshot | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isNear = useInView(boardRef, { threshold: 0 });
  const isOnScreen = useInView(boardRef, { threshold: 0.25, once: false });

  onChangeRef.current = onChange;

  useEffect(() => {
    const board = boardRef.current;
    const context = canvasRef.current?.getContext("2d", { alpha: false });

    if (!isNear || !board || !context) {
      return;
    }

    const game = BugRaidGame.forCanvas(context, {
      theme: BUG_RAID_THEME,
      productionLabel,
      onChange: (next) => {
        setSnapshot(next);
        onChangeRef.current?.(next);
      },
    });
    const resize = () => game.resize({ width: board.clientWidth, height: board.clientHeight }, window.devicePixelRatio || 1);
    const observer = new ResizeObserver(resize);

    gameRef.current = game;
    resize();
    observer.observe(board);

    return () => {
      observer.disconnect();
      game.stop();
      gameRef.current = null;
    };
  }, [boardRef, canvasRef, isNear, productionLabel]);

  useEffect(() => {
    const game = gameRef.current;

    if (!isOnScreen && game?.isRunning) {
      game.pause();
      setIsPaused(true);
    }
  }, [isOnScreen]);

  const play = useCallback(() => {
    gameRef.current?.play();
    setIsPaused(false);
    boardRef.current?.focus();
  }, [boardRef]);

  const resume = useCallback(() => {
    gameRef.current?.resume();
    setIsPaused(false);
    boardRef.current?.focus();
  }, [boardRef]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    gameRef.current?.strike(event.clientX - rect.left, event.clientY - rect.top);
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    const game = gameRef.current;

    if (!game?.isRunning) {
      return;
    }

    const aim = AIM_KEYS[event.key];

    if (aim) {
      event.preventDefault();
      game.aim(aim[0], aim[1]);
    } else if (STRIKE_KEYS.has(event.key)) {
      event.preventDefault();
      game.strikeAtCursor();
    }
  }, []);

  return { snapshot, isPaused, play, resume, onPointerDown, onKeyDown };
};
