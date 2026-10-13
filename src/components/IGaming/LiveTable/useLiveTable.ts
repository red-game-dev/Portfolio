import { RefObject, useCallback, useEffect, useMemo, useState } from "react";

import useCanvasEngine from "@/hooks/useCanvasEngine";
import useInView from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LiveTableGame, LiveTablePlayResult, LiveTableSimulation, LiveTableSnapshot, resolveLiveTableConfig } from "@/packages/games/live-table";

// Binds a live table to a canvas inside a board element: built as the board comes near, sized to it, run
// only while it is on screen, with the snapshot for the page to render and a way to play a card.
const useLiveTable = (boardRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>, cards: string[]) => {
  // The same first state on the server and the client, before the game exists.
  const initial = useMemo(() => new LiveTableSimulation(cards, { config: resolveLiveTableConfig(), random: () => 1 }).snapshot, [cards]);
  const [snapshot, setSnapshot] = useState<LiveTableSnapshot>(initial);
  const isOnScreen = useInView(boardRef, { threshold: 0.1, once: false });
  // Kept still, the round pauses as it does off screen, cards and dealer with it.
  const isReduced = useReducedMotion();
  const isRunning = isOnScreen && !isReduced;
  const game = useCanvasEngine(canvasRef, {
    sizeRef: boardRef,
    create: (context) => LiveTableGame.forCanvas(context, cards, { onChange: setSnapshot }),
    resize: (table, { width, height, pixelRatio }) => table.resize({ width, height }, pixelRatio),
  }, [cards]);

  // The round only runs while someone can see it and the page is not kept still.
  useEffect(() => {
    if (!game) {
      return;
    }

    setSnapshot(game.snapshot);

    if (isRunning) {
      game.start();
    } else {
      game.stop();
    }
  }, [game, isRunning]);

  const play = useCallback((card: string): LiveTablePlayResult => game?.play(card) ?? { accepted: false, reason: "closed" }, [game]);

  const redeal = useCallback(() => game?.redeal(), [game]);

  return { snapshot, play, redeal, isRunning };
};

export default useLiveTable;
