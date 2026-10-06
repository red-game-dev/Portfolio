import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LIVE_TABLE_THEME } from "@/config/theme";
import useInView from "@/hooks/useInView";
import { LiveTableGame, LiveTablePlayResult, LiveTableSimulation, LiveTableSnapshot, resolveLiveTableConfig } from "@/packages/games/live-table";

// Binds a live table to a canvas inside a board element: builds it once the board comes near the screen,
// keeps it sized to the board, runs it only while the board is on screen, and hands the page the
// snapshot to render and a way to play a card.
const useLiveTable = (boardRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>, cards: string[]) => {
  const gameRef = useRef<LiveTableGame | null>(null);
  // The same first state on the server and the client, before the game exists.
  const initial = useMemo(() => new LiveTableSimulation(cards, { config: resolveLiveTableConfig(), random: () => 1 }).snapshot, [cards]);
  const [snapshot, setSnapshot] = useState<LiveTableSnapshot>(initial);
  const isNear = useInView(boardRef, { threshold: 0, once: true, rootMargin: "50% 0px" });
  const isOnScreen = useInView(boardRef, { threshold: 0.1, once: false });

  useEffect(() => {
    const board = boardRef.current;
    const context = canvasRef.current?.getContext("2d");

    if (!isNear || !board || !context) {
      return;
    }

    const game = LiveTableGame.forCanvas(context, cards, { theme: LIVE_TABLE_THEME, onChange: setSnapshot });
    const resize = () => game.resize({ width: board.clientWidth, height: board.clientHeight }, window.devicePixelRatio || 1);
    const observer = new ResizeObserver(resize);

    gameRef.current = game;
    setSnapshot(game.snapshot);
    resize();
    observer.observe(board);

    return () => {
      observer.disconnect();
      game.stop();
      gameRef.current = null;
    };
  }, [boardRef, canvasRef, cards, isNear]);

  // The round only runs while someone can see it.
  useEffect(() => {
    const game = gameRef.current;

    if (isOnScreen) {
      game?.start();
    } else {
      game?.stop();
    }
  }, [isOnScreen, isNear]);

  const play = useCallback((card: string): LiveTablePlayResult => gameRef.current?.play(card) ?? { accepted: false, reason: "closed" }, []);

  const redeal = useCallback(() => gameRef.current?.redeal(), []);

  return { snapshot, play, redeal, isRunning: isOnScreen };
};

export default useLiveTable;
