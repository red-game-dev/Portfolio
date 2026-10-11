import { KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState, WheelEvent } from "react";

import { PHOTO_PAN, slotOf, VOYAGE_KEYS, VOYAGE_ZOOM, voyageKeyAction } from "@/components/Finale/Voyage/controls";
import { usePilotSync } from "@/components/Finale/Voyage/hooks/usePilotSync";
import { useTiltSteering } from "@/components/Finale/Voyage/hooks/useTiltSteering";
import { canTilt } from "@/components/Finale/Voyage/tilt";
import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import { VOYAGE_TEXTURES, VOYAGE_THEME } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import useMediaQuery from "@/hooks/useMediaQuery";
import { PauseHolds } from "@/packages/animation/frame-loop";
import type { SoundEngine } from "@/packages/audio/synth";
import type { HapticName } from "@/packages/browser/haptics";
import { decodeImage } from "@/packages/browser/images";
import type {
  ArmoryView, CareerView, EconomyView, HomePad, LandingOptions, PadIntent, ProgressView, RunSummary, Suggestion, UniverseNames, VoyageAction, VoyageGame,
  VoyageNotice, VoyageSnapshot,
} from "@/packages/games/voyage";
import type { GamepadInput } from "@/packages/interaction/gamepad";
import { DragTracker, localPoint } from "@/packages/interaction/gestures";
import { HeldKeys } from "@/packages/interaction/keys";
import { ZoomInput } from "@/packages/interaction/zoom";
import type { Pilot } from "@/services/voyage/pilot";

// How loud each setting of the sound and the music plays.
const VOLUME = { off: 0, low: 0.35, medium: 0.6, high: 0.9 };

// A thumb stick reaches full burn this far from where the thumb went down (CSS pixels), and rests within this
// share of it.
const STICK_REACH = 56;
const STICK_REST = 0.12;

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
  // The pad at home a new rocket waits on once a crew is back.
  home?: HomePad | null;
}

export const useVoyage = ({ stage, back, front, lens }: VoyageCanvasRefs, { labels, universes, syllables, home = null }: VoyageNames) => {
  const [snapshot, setSnapshot] = useState<VoyageSnapshot | null>(null);
  // Notices queue up: several can come in the same moment (a run paid, a mission done, a promotion), and each
  // must be heard.
  const [notices, setNotices] = useState<VoyageNotice[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [economy, setEconomy] = useState<EconomyView | null>(null);
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  const [career, setCareer] = useState<CareerView | null>(null);
  const [gear, setGear] = useState<ArmoryView | null>(null);
  const [progress, setProgress] = useState<ProgressView | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  // A thumb stick on a touch screen, aiming by hand: which finger holds it, where it went down, and the stick drawn
  // under it (moved by its style, so steering never re-renders the dialog).
  const stick = useRef<{ id: number; x: number; y: number } | null>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [isPhoto, setIsPhoto] = useState(false);
  // The steering keys held down, the fingers zooming, and a drag looking round photo mode.
  const [held] = useState(() => new HeldKeys(VOYAGE_KEYS));
  const [zoom] = useState(() => new ZoomInput(VOYAGE_ZOOM));
  const [drag] = useState(() => new DragTracker());
  const pilot = useRef<Pilot | null>(null);
  // The sound engine, the controller and the buzz, made with the game; and what the controller's page buttons do,
  // kept current every render.
  const sound = useRef<SoundEngine | null>(null);
  const pad = useRef<GamepadInput | null>(null);
  const buzz = useRef<((name: HapticName) => void) | null>(null);
  const padIntent = useRef<(intent: PadIntent) => void>(() => undefined);
  const scheduleSave = usePilotSync(pilot);
  // The map and the hangar each hold the run still while open, together: it goes on only once both are closed.
  const [holds] = useState(() => new PauseHolds());
  const game = useCanvasEngine(back, {
    sizeRef: stage,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    create: async (context) => {
      const [{ VoyageGame: Game }, { openPilot }, synth, gamepad, haptics] = await Promise.all([
        import("@/packages/games/voyage"),
        import("@/services/voyage/pilot"),
        import("@/packages/audio/synth"),
        import("@/packages/interaction/gamepad"),
        import("@/packages/browser/haptics"),
      ]);
      const frontContext = front.current?.getContext("2d");

      if (!frontContext) {
        throw new Error("The voyage's front canvas is missing");
      }

      const opened = await openPilot();

      pilot.current = opened;
      opened.hangar.subscribe(scheduleSave);
      opened.career.subscribe(scheduleSave);
      opened.armory.subscribe(scheduleSave);
      opened.progress.subscribe(scheduleSave);

      const ghost = await opened.repository.loadGhost();

      // Sound made in the browser (nothing plays until the reader first touches the page), a controller, and a
      // buzz on a phone that can.
      sound.current = synth.SoundEngine.create();
      pad.current = new gamepad.GamepadInput();
      buzz.current = (name) => haptics.vibrate(haptics.HAPTIC_PATTERNS[name]);

      const voyage = Game.forCanvas(
        { back: context, front: frontContext, lens: lens.current, globe: document.createElement("canvas") },
        {
          theme: VOYAGE_THEME,
          labels,
          home,
          universeNames: universes,
          syllables,
          quality: startingQuality(),
          hangar: opened.hangar,
          career: opened.career,
          armory: opened.armory,
          progress: opened.progress,
          onGear: setGear,
          onProgress: setProgress,
          ghost,
          onChange: setSnapshot,
          onNotice: (next) => setNotices((queue) => [...queue, next]),
          onEconomy: setEconomy,
          onCareer: setCareer,
          // A better run of today's daily voyage is kept as the ghost to fly beside next time.
          onGhost: (run) => void opened.repository.saveGhost(run),
          sound: sound.current,
          gamepad: pad.current,
          onPadIntent: (intent) => padIntent.current(intent),
        },
      );

      setEconomy(voyage.economy);
      setCareer(voyage.careerView);
      setGear(voyage.gearView);
      setProgress(voyage.progressView);
      loadTextures(voyage);

      return voyage;
    },
    resize: (voyage, { width, height, pixelRatio }) => voyage.resize({ width, height }, pixelRatio),
  }, []);
  const isFlying = snapshot?.status === "flying";
  // How the reader likes their landings, from their settings; a landing on its way down follows a change at once.
  const { values: preferences } = usePreferencesStateHook();
  const landing = useMemo<LandingOptions>(() => ({ time: preferences["landing-time"], control: preferences["landing-control"] }), [preferences]);

  useEffect(() => {
    game?.setLanding(landing);
  }, [game, landing]);

  useEffect(() => {
    game?.setSpaceDrag(preferences["space-drag"]);
  }, [game, preferences]);

  const aimMode = preferences["voyage-aim"];
  const isManual = aimMode === "manual";

  useEffect(() => {
    game?.setAimMode(aimMode);
  }, [aimMode, game]);

  useEffect(() => {
    game?.setDifficulty(preferences["voyage-difficulty"]);
  }, [game, preferences]);

  // How loud the sounds and the score are, and whether a phone buzzes, from the reader's settings.
  useEffect(() => {
    const engine = sound.current;

    if (engine) {
      engine.setVolume("sfx", VOLUME[preferences["voyage-sound"]]);
      engine.setVolume("music", VOLUME[preferences["voyage-music"]]);
    }

    game?.setVibrate(preferences["voyage-haptics"] ? buzz.current : null);
  }, [game, preferences]);

  // Less motion asked for: small shakes and no hit-stop.
  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    game?.setReducedMotion(isReducedMotion);
  }, [game, isReducedMotion]);

  // A browser plays nothing until the reader touches the page, so the first touch, click or key wakes the sound.
  const unlockSound = useCallback(() => {
    void sound.current?.unlock();
  }, []);

  useEffect(() => () => {
    sound.current?.dispose();
    pad.current?.dispose();
  }, []);

  // The run's summary reaches the card at its end.
  useEffect(() => {
    if (snapshot?.status === "over") {
      setSummary(game?.runSummary ?? null);
    } else if (snapshot?.status === "flying") {
      setSummary(null);
    }
  }, [game, snapshot?.status, gear]);

  useTiltSteering(game, preferences["tilt-steering"] && canTilt(), isFlying);

  const play = useCallback((mode: "free" | "daily" = "free") => {
    unlockSound();
    held.clear();
    game?.setKeys({ turn: 0, thrust: 0, brake: false });
    game?.play(mode);
    setIsPaused(false);
    stage.current?.focus();
  }, [game, held, stage, unlockSound]);

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

  // The guided first flight sets a coin or a boost's core ahead of the ship.
  const guideSpawn = useCallback((kind: "coin" | "boost") => game?.guideSpawn(kind), [game]);

  // The ship as it looks now, drawn for its sheet.
  const drawShip = useCallback((context: CanvasRenderingContext2D, width: number, height: number) => game?.drawShipPreview(context, width, height), [game]);

  // The hangar holds a run still while it is open, and lets it go on when it closes.
  const setHangar = useCallback((isOpen: boolean) => {
    setIsHangarOpen(isOpen);

    if (isOpen && holds.take("hangar", Boolean(game?.isRunning) && isFlying)) {
      game?.pause();
    } else if (!isOpen && holds.release("hangar")) {
      game?.resume();
    }

    // Focus comes back to the voyage, which the hangar's keys and the game's both listen on.
    if (!isOpen) {
      stage.current?.focus();
    }
  }, [game, holds, isFlying, stage]);

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

    if (isOpen && holds.take("map", Boolean(game?.isRunning) && isFlying)) {
      game?.pause();
    }

    game?.setMap(isOpen);

    if (!isOpen && holds.release("map")) {
      game?.resume();
    }

    setIsMapOpen(isOpen);
  }, [game, holds, isFlying, isMapOpen]);

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
    unlockSound();

    // Photo mode is looked round with the arrows too, not only by dragging.
    const pan = isPhoto && !isHangarOpen ? PHOTO_PAN.intentOf(event) : null;

    if (pan) {
      game?.panBy(pan.x, pan.y);

      return true;
    }

    const action = voyageKeyAction(command, {
      isFlying,
      isPaused,
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
        if (slotOf(action) < 0) {
          return false;
        }

        // A held key uses its slot once, not again on every repeat.
        if (!event.repeat) {
          act({ kind: "slot", index: slotOf(action) });
        }
    }

    return true;
  }), [
    act, applyKeys, economy, follow, game, held, isFlying, isHangarOpen, isPaused, isPhoto, pause, resume, setHangar, snapshot, toggleGuns, toggleMap, togglePhoto,
    unlockSound, zoom,
  ]);

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

  // Aiming by hand on a touch screen, the left half is a thumb stick that steers and the right half aims and fires.
  const moveStick = useCallback((event: PointerEvent<HTMLElement>, isStart: boolean) => {
    const thumb = stick.current;
    const point = localPoint(event, event.currentTarget);
    const knob = stickRef.current;

    if (isStart) {
      stick.current = { id: event.pointerId, x: point.x, y: point.y };
      event.currentTarget.setPointerCapture(event.pointerId);

      if (knob) {
        knob.style.opacity = "1";
        knob.style.transform = `translate(${point.x}px, ${point.y}px)`;
        knob.style.setProperty("--knob", "translate(0px, 0px)");
      }

      return;
    }

    if (!thumb) {
      return;
    }

    const dx = point.x - thumb.x;
    const dy = point.y - thumb.y;
    const length = Math.hypot(dx, dy);
    const share = Math.min(1, length / STICK_REACH);
    const along = length > 0 ? share / length : 0;

    game?.setStick(share > STICK_REST ? { x: dx * along, y: dy * along } : null);
    knob?.style.setProperty("--knob", `translate(${dx * along * STICK_REACH}px, ${dy * along * STICK_REACH}px)`);
  }, [game]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    unlockSound();

    if (isPhoto) {
      dragPhoto(event, true);

      return;
    }

    if (isManual && event.pointerType !== "mouse" && localPoint(event, event.currentTarget).x < event.currentTarget.clientWidth / 2 && !stick.current) {
      moveStick(event, true);

      return;
    }

    // A click or a tap on someone locks the guns on them; on nothing, lets go. Held while coming down, it is the
    // burn: the pilot's on the landing engine, or one that aborts the landing under fire.
    game?.lockAt(localPoint(event, event.currentTarget));
    game?.press(true);

    if (event.pointerType !== "mouse") {
      event.currentTarget.setPointerCapture(event.pointerId);

      if (trackTouch(event)) {
        return;
      }
    }

    pointAt(event);
  }, [dragPhoto, game, isManual, isPhoto, moveStick, pointAt, trackTouch, unlockSound]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (isPhoto) {
      dragPhoto(event, false);

      return;
    }

    if (stick.current?.id === event.pointerId) {
      moveStick(event, false);

      return;
    }

    // Aiming by hand, two fingers are the stick and the trigger, not a pinch.
    if (!isManual && event.pointerType !== "mouse" && trackTouch(event)) {
      return;
    }

    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId)) {
      pointAt(event);
    }
  }, [dragPhoto, isManual, isPhoto, moveStick, pointAt, trackTouch]);

  // A finger lifted, or the mouse gone from the stage: the ship coasts.
  const onPointerEnd = useCallback((event: PointerEvent<HTMLElement>) => {
    if (stick.current?.id === event.pointerId) {
      stick.current = null;
      game?.setStick(null);

      if (stickRef.current) {
        stickRef.current.style.opacity = "0";
      }

      return;
    }

    zoom.release(event.pointerId);
    drag.end();
    game?.press(false);

    if (event.type !== "pointerup" || event.pointerType !== "mouse") {
      game?.point(null);
    }
  }, [drag, game, zoom]);

  // What a controller's page buttons do, kept current with this render's state.
  padIntent.current = (intent: PadIntent) => {
    switch (intent) {
      case "pause":
        if (!isFlying) {
          play();
        } else if (isPaused) {
          resume();
        } else {
          pause();
        }

        break;
      case "map":
        toggleMap();
        break;
      case "hangar":
        setHangar(!isHangarOpen);
        break;
      case "photo":
        togglePhoto();
        break;
      case "guns":
        toggleGuns();
        break;
      default:
        break;
    }
  };

  // Held still (paused, the map or the hangar open, or between runs), the game reads no controller, so Start, Back
  // and up are read here until it moves again.
  const isHeld = isPaused || isMapOpen || isHangarOpen || !isFlying;

  useEffect(() => {
    const input = pad.current;

    if (!game || !input || !isHeld) {
      return undefined;
    }

    let frame = 0;
    const poll = () => {
      const state = input.poll();

      if (state?.buttons.start.wentDown) {
        padIntent.current("pause");
      } else if (state?.buttons.back.wentDown) {
        padIntent.current("map");
      } else if (state?.buttons.up.wentDown) {
        padIntent.current("hangar");
      }

      frame = window.requestAnimationFrame(poll);
    };

    frame = window.requestAnimationFrame(poll);

    return () => window.cancelAnimationFrame(frame);
  }, [game, isHeld]);

  return {
    snapshot,
    landing,
    gear,
    progress,
    summary,
    isManual,
    stickRef,
    drawShip,
    guideSpawn,
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
