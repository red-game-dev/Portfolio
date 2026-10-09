import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState, WheelEvent } from "react";

import { usePilotSync } from "@/components/Finale/Voyage/hooks/usePilotSync";
import { VOYAGE_TEXTURES, VOYAGE_THEME } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import type { CareerView, EconomyView, Suggestion, UniverseNames, VoyageAction, VoyageGame, VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";
import type { Pilot } from "@/services/voyage/pilot";

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

// How far an arrow looks round in photo mode (CSS pixels the view moves).
const PHOTO_PAN: Record<string, [number, number] | undefined> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };

// How much a notch of the wheel, or a key, zooms.
const WHEEL_ZOOM = 0.0015;
const KEY_ZOOM = 1.25;

const keyOf = (event: KeyboardEvent<HTMLElement>) => (event.key.length === 1 ? event.key.toLowerCase() : event.key);

// Each real map, fetched and decoded once a visit, however often the voyage is opened.
const decoded = new Map<string, Promise<HTMLImageElement>>();

const decode = (url: string): Promise<HTMLImageElement> => {
  const known = decoded.get(url);

  if (known) {
    return known;
  }

  const image = new Image();

  image.decoding = "async";
  image.src = url;

  const ready = image.decode().then(() => image);

  ready.catch(() => decoded.delete(url));
  decoded.set(url, ready);

  return ready;
};

// Hands the game each real map as soon as it has loaded, in order, so Earth arrives first. A game already gone
// takes none: its renderer ignores what comes after it is disposed.
const loadTextures = (game: VoyageGame) => {
  Object.entries(VOYAGE_TEXTURES).forEach(([id, url]) => {
    decode(url).then((image) => game.setTexture(id, image), () => undefined);
  });
};

// Where to start on quality: a phone with little memory or few cores starts a step or two down, so its first
// seconds are smooth; every device then steps down further by itself if its frames run slow.
const startingQuality = (): number => {
  const memory = "deviceMemory" in navigator && typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 8;
  const cores = navigator.hardwareConcurrency || 8;

  if (memory <= 2 || cores <= 2) {
    return 2;
  }

  return memory <= 4 || cores <= 4 ? 1 : 0;
};

export interface VoyageCanvasRefs {
  stage: RefObject<HTMLElement>;
  back: RefObject<HTMLCanvasElement>;
  front: RefObject<HTMLCanvasElement>;
  lens: RefObject<HTMLCanvasElement>;
}

// Binds the voyage to its canvases: its code fetched when the dialog opens, the real maps after it, sized to the
// stage, paused when the tab is hidden, flown by a mouse (no press needed), a finger (while it is down) or the
// keys, zoomed by the wheel, a pinch or + and -, and its map opened with M. The pilot's hangar comes with it,
// read back from this browser and kept again shortly after every change, when the page is left and when the
// dialog closes; opening the hangar (H) pauses a run, and U does whatever the hangar suggests.
export interface VoyageNames {
  labels: Record<string, string>;
  universes: string[];
  syllables: UniverseNames;
}

export const useVoyage = ({ stage, back, front, lens }: VoyageCanvasRefs, { labels, universes, syllables }: VoyageNames) => {
  const [snapshot, setSnapshot] = useState<VoyageSnapshot | null>(null);
  // Notices queue up: several can come in the same moment (a run paid, a mission done, a promotion), and each
  // must be heard.
  const [notices, setNotices] = useState<VoyageNotice[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [economy, setEconomy] = useState<EconomyView | null>(null);
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  const [career, setCareer] = useState<CareerView | null>(null);
  const [isPhoto, setIsPhoto] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const pilot = useRef<Pilot | null>(null);
  const scheduleSave = usePilotSync(pilot);
  const isPausedForHangar = useRef(false);
  const held = useRef(new Set<string>());
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const game = useCanvasEngine(back, {
    sizeRef: stage,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    create: async (context) => {
      const [{ VoyageGame: Game }, { openPilot }] = await Promise.all([import("@/packages/games/voyage"), import("@/services/voyage/pilot")]);
      const frontContext = front.current?.getContext("2d");

      if (!frontContext) {
        throw new Error("The voyage's front canvas is missing");
      }

      const opened = await openPilot();

      pilot.current = opened;
      opened.hangar.subscribe(scheduleSave);
      opened.career.subscribe(scheduleSave);

      const ghost = await opened.repository.loadGhost();

      const voyage = Game.forCanvas(
        { back: context, front: frontContext, lens: lens.current, globe: document.createElement("canvas") },
        {
          theme: VOYAGE_THEME,
          labels,
          universeNames: universes,
          syllables,
          quality: startingQuality(),
          hangar: opened.hangar,
          career: opened.career,
          ghost,
          onChange: setSnapshot,
          onNotice: (next) => setNotices((queue) => [...queue, next]),
          onEconomy: setEconomy,
          onCareer: setCareer,
          // A better run of today's daily voyage is kept as the ghost to fly beside next time.
          onGhost: (run) => void opened.repository.saveGhost(run),
        },
      );

      setEconomy(voyage.economy);
      setCareer(voyage.careerView);
      loadTextures(voyage);

      return voyage;
    },
    resize: (voyage, { width, height, pixelRatio }) => voyage.resize({ width, height }, pixelRatio),
  }, []);
  const isFlying = snapshot?.status === "flying";

  // Closing the voyage gives its GPU contexts and textures back, not just stops it.
  useEffect(() => () => game?.dispose(), [game]);

  const play = useCallback((mode: "free" | "daily" = "free") => {
    held.current.clear();
    game?.setKeys({ turn: 0, thrust: 0, brake: false });
    game?.play(mode);
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

  // Done with the first `count` notices.
  const takeNotices = useCallback((count: number) => setNotices((queue) => queue.slice(count)), []);

  const act = useCallback((action: VoyageAction) => {
    const isDone = game?.act(action) ?? false;

    // Starting over wipes the kept ghost too.
    if (isDone && action.kind === "reset") {
      void pilot.current?.repository.clearGhost();
    }

    return isDone;
  }, [game]);

  const follow = useCallback((suggestion: Suggestion) => game?.follow(suggestion) ?? false, [game]);

  // The hangar holds a run still while it is open, and lets it go on when it closes.
  const setHangar = useCallback((isOpen: boolean) => {
    setIsHangarOpen(isOpen);

    if (isOpen && game?.isRunning && isFlying) {
      isPausedForHangar.current = true;
      game.pause();
    } else if (!isOpen && isPausedForHangar.current) {
      isPausedForHangar.current = false;
      game?.resume();
    }

    // Focus comes back to the voyage, which the hangar's keys and the game's both listen on.
    if (!isOpen) {
      stage.current?.focus();
    }
  }, [game, isFlying, stage]);

  // Photo mode holds the view still to be looked round and saved; leaving carries on as before.
  const togglePhoto = useCallback(() => {
    const isOn = !isPhoto;

    game?.setPhotoMode(isOn);
    setIsPhoto(isOn);
    drag.current = null;
    stage.current?.focus();
  }, [game, isPhoto, stage]);

  // The view as it is now, every canvas in one picture at the device's resolution, saved as a PNG.
  const savePhoto = useCallback((fileName: string) => {
    const source = back.current;

    if (!game || !source) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = source.width;
    canvas.height = source.height;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    game.photo(context, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }, [back, game]);

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

    // The browser's own shortcuts (Ctrl+H, Cmd+U) are left to the browser.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // With the hangar open, only its own keys work: the run is held still under it. In photo mode the same goes
    // for its own: zoom, the camera key and Escape.
    if (isHangarOpen && key !== "h" && key !== "Escape" && key !== "u") {
      return;
    }

    // Photo mode is looked round with the arrows too, not only by dragging.
    if (isPhoto && PHOTO_PAN[key]) {
      event.preventDefault();

      const [dx, dy] = PHOTO_PAN[key];

      game?.panBy(dx, dy);

      return;
    }

    if (isPhoto && key !== "c" && key !== "Escape" && key !== "+" && key !== "=" && key !== "-") {
      return;
    }

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
    } else if (key === "h" && game?.economy) {
      event.preventDefault();
      setHangar(!isHangarOpen);
    } else if (key === "Escape" && isHangarOpen) {
      // Escape closes the hangar first, and only then the voyage.
      event.preventDefault();
      setHangar(false);
    } else if (key === "c" && snapshot && snapshot.status !== "ready" && !isHangarOpen) {
      event.preventDefault();
      togglePhoto();
    } else if (key === "Escape" && isPhoto) {
      event.preventDefault();
      togglePhoto();
    } else if (key === "u" && economy?.suggestion) {
      event.preventDefault();
      follow(economy.suggestion);
    } else if ((key === "+" || key === "=" || key === "-") && game) {
      event.preventDefault();
      game.zoomBy(key === "-" ? 1 / KEY_ZOOM : KEY_ZOOM);
    }
  }, [applyKeys, economy, follow, game, isFlying, isHangarOpen, isPaused, isPhoto, pause, resume, setHangar, snapshot, toggleGuns, toggleMap, togglePhoto]);

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

  // In photo mode a drag looks round the view (a pinch still zooms), and nothing steers.
  const dragPhoto = useCallback((event: PointerEvent<HTMLElement>, isStart: boolean) => {
    if (event.pointerType !== "mouse" && trackTouch(event)) {
      drag.current = null;

      return;
    }

    if (isStart) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY };

      return;
    }

    if (drag.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      game?.panBy(event.clientX - drag.current.x, event.clientY - drag.current.y);
      drag.current = { x: event.clientX, y: event.clientY };
    }
  }, [game, trackTouch]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (isPhoto) {
      dragPhoto(event, true);

      return;
    }

    // A click or a tap on someone locks the guns on them; on nothing, lets go.
    game?.lockAt({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);

      if (trackTouch(event)) {
        return;
      }
    }

    pointAt(event);
  }, [dragPhoto, game, isPhoto, pointAt, trackTouch]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (isPhoto) {
      dragPhoto(event, false);

      return;
    }

    if (event.pointerType !== "mouse" && trackTouch(event)) {
      return;
    }

    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      pointAt(event);
    }
  }, [dragPhoto, isPhoto, pointAt, trackTouch]);

  // A finger lifted, or the mouse gone from the stage: the ship coasts.
  const onPointerEnd = useCallback((event: PointerEvent<HTMLElement>) => {
    touches.current.delete(event.pointerId);
    drag.current = null;

    if (touches.current.size < 2) {
      pinch.current = 0;
    }

    if (event.type !== "pointerup" || event.pointerType !== "mouse") {
      game?.point(null);
    }
  }, [game]);

  return {
    snapshot,
    notices,
    takeNotices,
    economy,
    career,
    isPhoto,
    togglePhoto,
    savePhoto,
    isHangarOpen,
    setHangar,
    act,
    follow,
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
