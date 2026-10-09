import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useRef, useState, WheelEvent } from "react";

import { PHOTO_PAN, VOYAGE_KEYS, VOYAGE_ZOOM, voyageKeyAction } from "@/components/Finale/Voyage/controls";
import { usePilotSync } from "@/components/Finale/Voyage/hooks/usePilotSync";
import { VOYAGE_TEXTURES, VOYAGE_THEME } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import { decodeImage } from "@/packages/browser/images";
import type { CareerView, EconomyView, Suggestion, UniverseNames, VoyageAction, VoyageGame, VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";
import { DragTracker, localPoint } from "@/packages/interaction/gestures";
import { HeldKeys } from "@/packages/interaction/keys";
import { ZoomInput } from "@/packages/interaction/zoom";
import type { Pilot } from "@/services/voyage/pilot";

// Hands the game each real map as soon as it has loaded, in order, so Earth arrives first. A game already gone
// takes none: its renderer ignores what comes after it is disposed.
const loadTextures = (game: VoyageGame) => {
  Object.entries(VOYAGE_TEXTURES).forEach(([id, url]) => {
    decodeImage(url).then((image) => game.setTexture(id, image), () => undefined);
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
  // The steering keys held down, the fingers zooming, and a drag looking round photo mode.
  const [held] = useState(() => new HeldKeys(VOYAGE_KEYS));
  const [zoom] = useState(() => new ZoomInput(VOYAGE_ZOOM));
  const [drag] = useState(() => new DragTracker());
  const pilot = useRef<Pilot | null>(null);
  const scheduleSave = usePilotSync(pilot);
  const isPausedForHangar = useRef(false);
  const isPausedForMap = useRef(false);
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
    held.clear();
    game?.setKeys({ turn: 0, thrust: 0, brake: false });
    game?.play(mode);
    setIsPaused(false);
    stage.current?.focus();
  }, [game, held, stage]);

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
    drag.end();
    stage.current?.focus();
  }, [drag, game, isPhoto, stage]);

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

  // The map holds a run still while it is open, so nothing can hit the ship while the pilot finds the way, and
  // lets it go on when it closes. Held still, the game draws the map once.
  const toggleMap = useCallback(() => {
    const isOpen = !isMapOpen;

    if (isOpen && game?.isRunning && isFlying) {
      isPausedForMap.current = true;
      game.pause();
    }

    game?.setMap(isOpen);

    if (!isOpen && isPausedForMap.current) {
      isPausedForMap.current = false;
      game?.resume();
    }

    setIsMapOpen(isOpen);
  }, [game, isFlying, isMapOpen]);

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
    game?.setKeys({ turn: held.axis("left", "right"), thrust: held.isHeld("burn") ? 1 : 0, brake: held.isHeld("brake") });
  }, [game, held]);

  // What each key does is the voyage's key map and `voyageKeyAction`; carrying it out is here. A key that means
  // nothing right now is left to the browser, so Escape with nothing open still closes the voyage.
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => VOYAGE_KEYS.offer(event, (command) => {
    // Photo mode is looked round with the arrows too, not only by dragging.
    const pan = isPhoto && !isHangarOpen ? PHOTO_PAN.intentOf(event) : null;

    if (pan) {
      game?.panBy(pan.x, pan.y);

      return true;
    }

    const action = voyageKeyAction(command, {
      isFlying,
      hasRun: snapshot !== null && snapshot.status !== "ready",
      isHangarOpen,
      isPhoto,
      // The view kept from the game, not `game.economy`, which builds a fresh one on every read.
      hasHangar: economy !== null,
      hasSuggestion: Boolean(economy?.suggestion),
      hasGame: game !== null,
    });

    switch (action) {
      case "steer":
        held.press(event);
        applyKeys();
        break;
      case "pause":
        if (isPaused) {
          resume();
        } else {
          pause();
        }

        break;
      case "map":
        toggleMap();
        break;
      case "guns":
        toggleGuns();
        break;
      case "hangar":
        setHangar(!isHangarOpen);
        break;
      case "closeHangar":
        setHangar(false);
        break;
      case "photo":
        togglePhoto();
        break;
      case "follow":
        if (economy?.suggestion) {
          follow(economy.suggestion);
        }

        break;
      case "zoomIn":
      case "zoomOut":
        game?.zoomBy(zoom.step(action === "zoomIn" ? 1 : -1));
        break;
      default:
        return false;
    }

    return true;
  }), [applyKeys, economy, follow, game, held, isFlying, isHangarOpen, isPaused, isPhoto, pause, resume, setHangar, snapshot, toggleGuns, toggleMap, togglePhoto, zoom]);

  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (held.release(event)) {
      applyKeys();
    }
  }, [applyKeys, held]);

  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    game?.zoomBy(zoom.wheel(event.deltaY));
  }, [game, zoom]);

  const pointAt = useCallback((event: PointerEvent<HTMLElement>) => {
    game?.point(localPoint(event, event.currentTarget));
  }, [game]);

  // Two fingers down zoom by how far they spread; one steers.
  const trackTouch = useCallback((event: PointerEvent<HTMLElement>) => {
    const factor = zoom.track(event.pointerId, event.clientX, event.clientY);

    if (!zoom.isPinching) {
      return false;
    }

    if (factor !== null) {
      game?.zoomBy(factor);
    }

    game?.point(null);

    return true;
  }, [game, zoom]);

  // In photo mode a drag looks round the view (a pinch still zooms), and nothing steers.
  const dragPhoto = useCallback((event: PointerEvent<HTMLElement>, isStart: boolean) => {
    if (event.pointerType !== "mouse" && trackTouch(event)) {
      drag.end();

      return;
    }

    if (isStart) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.start(event.clientX, event.clientY);

      return;
    }

    const moved = event.currentTarget.hasPointerCapture(event.pointerId) ? drag.move(event.clientX, event.clientY) : null;

    if (moved) {
      game?.panBy(moved.x, moved.y);
    }
  }, [drag, game, trackTouch]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (isPhoto) {
      dragPhoto(event, true);

      return;
    }

    // A click or a tap on someone locks the guns on them; on nothing, lets go.
    game?.lockAt(localPoint(event, event.currentTarget));

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
    zoom.release(event.pointerId);
    drag.end();

    if (event.type !== "pointerup" || event.pointerType !== "mouse") {
      game?.point(null);
    }
  }, [drag, game, zoom]);

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
