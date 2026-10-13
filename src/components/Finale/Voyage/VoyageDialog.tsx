import { CSSProperties, FC, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  faAnchor,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faCalendarDay,
  faCamera,
  faCircleInfo,
  faCircleUp,
  faCompress,
  faCrosshairs,
  faDownload,
  faGasPump,
  faHeartPulse,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMap,
  faPause,
  faPlay,
  faRocket,
  faScroll,
  faShareNodes,
  faShieldHalved,
  faWarehouse,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton } from "@/components/Controls";
import { AbilityBar } from "@/components/Finale/Voyage/AbilityBar/AbilityBar";
import { DailyBoard } from "@/components/Finale/Voyage/Board/DailyBoard";
import { chapterTitle, missionName, QuestCard, questCard, rankName, storyStepName } from "@/components/Finale/Voyage/career";
import { descentHint, descentMethod, descentRows } from "@/components/Finale/Voyage/descent";
import { shipName, stacksText, suggestionText } from "@/components/Finale/Voyage/economy";
import { portName } from "@/components/Finale/Voyage/encounters";
import { BossTell, DistressFrame, DockButton } from "@/components/Finale/Voyage/Encounters/Encounters.styles";
import { PerkCard } from "@/components/Finale/Voyage/Encounters/PerkCard";
import { StationPanel } from "@/components/Finale/Voyage/Encounters/StationPanel";
import { summaryRows } from "@/components/Finale/Voyage/gear";
import { Guide } from "@/components/Finale/Voyage/Guide";
import { HangarPanel, HangarTab } from "@/components/Finale/Voyage/Hangar/HangarPanel";
import { useGains } from "@/components/Finale/Voyage/hooks/useGains";
import { useVoyage } from "@/components/Finale/Voyage/hooks/useVoyage";
import { useVoyageSettings } from "@/components/Finale/Voyage/hooks/useVoyageSettings";
import { hudLayout, SMALL_HUD_SCREEN } from "@/components/Finale/Voyage/hud";
import {
  isKeptNotice,
  isQuestNotice,
  isUrgentNotice,
  lineMs,
  placeName,
  QueuedLine,
  queueLine,
  replyLine,
  strandedLine,
  voyageMessage,
  voyageNotice,
  voyagePlace,
} from "@/components/Finale/Voyage/messages";
import { CurrencyIcon, Money } from "@/components/Finale/Voyage/Money";
import { isQuestId, trackedQuest } from "@/components/Finale/Voyage/quests";
import { drawRunCard, RUN_CARD, shareCard } from "@/components/Finale/Voyage/share";
import { skyLines } from "@/components/Finale/Voyage/sky";
import { surfaceHeading, surfaceHint, surfaceLines } from "@/components/Finale/Voyage/surface";
import { telemetryRows } from "@/components/Finale/Voyage/telemetry";
import {
  Badge,
  BarFill,
  BossFrame,
  BarLabel,
  BarIcon,
  BarRow,
  BarsRow,
  Bars,
  BarTrack,
  BarValue,
  Canvas,
  Card,
  CardButtons,
  Coin,
  FaultList,
  FaultNeed,
  FaultRow,
  FixButton,
  ControlsNote,
  Credits,
  Dialog,
  FrameMeta,
  FrameName,
  Frames,
  FrameTrack,
  Gain,
  Hud,
  HudAlert,
  HudButtons,
  HudToggle,
  IconButton,
  Incoming,
  LensCanvas,
  MapBar,
  MapTitle,
  CardLine,
  CardName,
  Chip,
  Chips,
  CardReward,
  CardText,
  CardTitle,
  HowTo,
  Message,
  MessageButton,
  Overlay,
  Pay,
  LiveRegion,
  PadButtons,
  PhotoBar,
  PhotoHint,
  Place,
  ReadyButton,
  Reading,
  ReadingName,
  ReadingValue,
  Readout,
  Salvage,
  Score,
  ScoreRow,
  ShipLine,
  Stage,
  SurfaceCard,
  SurfaceHint,
  SurfaceLine,
  SurfaceMethod,
  SurfaceReading,
  SurfacePhase,
  SurfaceTitle,
  SystemName,
  SystemRow,
  Systems,
  SystemsTitle,
  SystemTrack,
  TargetFrame,
  TelemetryList,
  TelemetryName,
  TelemetryPanel,
  TelemetryRow,
  TelemetryTitle,
  TelemetryValue,
  TouchStick,
  Setup,
  SetupTitle,
  Text,
  StatGrid,
  Stat,
  Title,
  Tracker,
  TrackerCount,
  TrackerName,
  TrackerOpen,
  TrackerSub,
  TrackerText,
  Vitals,
} from "@/components/Finale/Voyage/VoyageDialog.styles";
import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import { SettingsPanel } from "@/components/Preferences/SettingsPanel";
import { SITE_URL } from "@/config/site";
import useMediaQuery from "@/hooks/useMediaQuery";
import useModalDialog from "@/hooks/useModalDialog";
import { readStored, writeStored } from "@/packages/browser/storage";
import type { Frame, HomePad, ItemStack, ModuleId, VoyageSnapshot } from "@/packages/games/voyage";
import { focusLanding, isFocusLost } from "@/packages/interaction/focus";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";
import { PreferencesContent } from "@/types/preferences";

interface VoyageDialogProps {
  content: FinaleVoyage;
  // One name per universe, in the game's order.
  universes: string[];
  best: number;
  // The pad the finale's launch flew from, where a new rocket waits when the crew comes home.
  home: HomePad | null;
  settings: PreferencesContent;
  onRecord: (score: number) => void;
  onClose: () => void;
}

const CONTROLS_ID = "voyage-controls";
// The guided first flight's steps, by what each asks, and how long a step that asks nothing to do waits (ms).
const GUIDE = { fly: 0, coin: 1, boost: 2, guns: 3, map: 4, land: 5 };
const GUIDE_LAST = 5;
const GUIDE_WAIT_MS = 9000;
// Whether the pilot has been asked how they like to fly, kept so it is asked only the first time.
const SETUP_KEY = "redgame.voyageSetup";
// The quest followed on the HUD, a convenience of this browser.
const TRACK_KEY = "redgame.trackedQuest";
const isTrue = (value: unknown): value is true => value === true;
// How many lines the voyage says may wait (each stays as long as `lineMs` gives it, its animation's length).
const MESSAGE_QUEUE = 4;

// How far a look round button moves the view, as an arrow key does in photo mode.
const PHOTO_STEP = 60;

// A line the voyage has spoken; each spoken region keeps its last few.
interface SpokenLine {
  id: number;
  text: string;
}

const SPOKEN_KEPT = 4;

interface SpokenLines {
  polite: SpokenLine[];
  urgent: SpokenLine[];
}

// The spoken lines with one more, in its region, keeping each region's last few.
const withSpoken = (lines: SpokenLines, line: SpokenLine, isUrgent: boolean): SpokenLines => (isUrgent
  ? { ...lines, urgent: [...lines.urgent, line].slice(-SPOKEN_KEPT) }
  : { ...lines, polite: [...lines.polite, line].slice(-SPOKEN_KEPT) });

// Hull green turning red as it fails, shields blue, fuel gold; a hurt system amber, then red.
const BAR_COLOUR = { hull: "#6ee7a8", hullLow: "#ff4d5e", shields: "#4fd8ff", fuel: "#ffd76a", rounds: "#c9cfdf", worn: "#ffb347", failing: "#ff4d5e" };

// The systems in the order the panel lists them, and how sound one must be to stay off it.
const SYSTEMS: readonly ModuleId[] = ["hull", "engines", "shields", "sensors", "fuel", "radiators"];
const SOUND = 0.995;

// The voyage, full screen: the game on its canvases (a 2D back, the GPU lens, a 2D front), and over it in plain
// text everything it shows: where the ship is, its hull, shields and fuel as MMO bars, any system that is hurt,
// the score, the live telemetry, and each moment said once. A card starts, pauses and ends a run; a button opens
// the map. Opens itself on mount.
export const VoyageDialog: FC<VoyageDialogProps> = ({ content, universes, best, home, settings, onRecord, onClose }: VoyageDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<HTMLCanvasElement>(null);
  const onBackdropClick = useModalDialog(dialogRef, true);
  // Closed through the dialog itself, so the browser hands focus back to what opened it (its close event then tells
  // the page); never by unmounting it, which leaves focus nowhere.
  const closeDialog = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else {
      onClose();
    }
  };

  // A control that held focus and went away (a slot used while paused, a fault fixed, a card closed) would leave focus
  // on the page's body, where the voyage's keys no longer reach: it goes back to the flight instead.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return undefined;
    }

    const rescue = (event: FocusEvent) => {
      if (event.relatedTarget) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (dialog.open && isFocusLost(document.activeElement)) {
          stageRef.current?.focus({ preventScroll: true });
        }
      });
    };

    dialog.addEventListener("focusout", rescue);

    return () => dialog.removeEventListener("focusout", rescue);
  }, []);
  const voyageSettings = useVoyageSettings();
  // On a touch screen, how to fly by touch rather than by keys.
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const controlsText = isTouch ? content.controlsTouch : content.controls;
  // How much of the HUD shows: compact on a screen too small for all of it (or where the setting asks), in full once
  // its info button opens it.
  const { values: preferences } = usePreferencesStateHook();
  const isSmallScreen = useMediaQuery(SMALL_HUD_SCREEN);
  const [isHudOpen, setHudOpen] = useState(false);
  const hud = hudLayout(preferences["voyage-hud"], isSmallScreen, isHudOpen);
  // Asked once: read after mount, so the server and the first render agree (asked, until known otherwise).
  const [isSetUp, setIsSetUp] = useState(true);

  useEffect(() => setIsSetUp(readStored(SETUP_KEY, isTrue) === true), []);
  // What the canvas writes: the places on the map, and the ghost's name.
  const labels = useMemo(() => ({
    ...content.stops,
    ghost: content.career.ghost,
    edgeNote: content.career.edgeNote,
    gateWayOn: content.gate.markWayOn,
    gateVisited: content.gate.markVisited,
    mapHoleMass: content.mapMarks.holeMass,
    mapKeyMission: content.mapMarks.keyMission,
    mapKeyPull: content.mapMarks.keyPull,
    mapKeyHostile: content.mapMarks.keyHostile,
    mapKeyRock: content.mapMarks.keyRock,
    mapKeyHazard: content.mapMarks.keyHazard,
    wayOn: content.mapMarks.wayOn,
    mapKeyPort: content.mapMarks.keyPort,
    mapKeyDistress: content.mapMarks.keyDistress,
    dock: content.encounters.station.dockHere,
    distress: content.encounters.distress.label,
  }), [content]);
  const canvases = { stage: stageRef, back: backRef, front: frontRef, lens: lensRef };
  // A controller's Start between runs starts one as the card's button does (defined below, so read through a ref).
  const startRef = useRef<() => void>(() => undefined);
  // Escape during a run asks before leaving it (defined below, so read through a ref).
  const leaveRef = useRef<() => void>(() => undefined);
  const voyage = useVoyage(canvases, {
    labels,
    universes,
    syllables: content.universeNames,
    home,
    onStart: () => startRef.current(),
    onLeave: () => leaveRef.current(),
  });
  const { snapshot, notices, takeNotices, isReady, isPaused, isMapOpen, play, pause, resume, toggleMap, toggleGuns } = voyage;
  const { economy, isHangarOpen, setHangar, act, follow } = voyage;
  const { career, isPhoto, togglePhoto, savePhoto, landing } = voyage;
  const { gear, progress, summary, isManual, stickRef, drawShip, guideSpawn } = voyage;
  const { station, castOff, choosePerk, composePhoto, skyToday } = voyage;
  // The hangar opens on its first tab, or on the Loadout when an empty slot of the bar is pressed.
  const [hangarTab, setHangarTab] = useState<HangarTab | null>(null);
  const [pay, setPay] = useState<number | null>(null);
  const [daily, setDaily] = useState<{ day: string; score: number; isBest: boolean } | null>(null);
  // Said on the run's card once its picture is saved.
  const [shareNote, setShareNote] = useState<string | null>(null);
  // Today, as the daily voyage counts days: the UTC date.
  const today = new Date().toISOString()
.slice(0, 10);
  const todayBest = career?.daily?.day === today ? career.daily.best : 0;
  const dailyNote = todayBest > 0 ? `${content.career.daily.note} ${fill(content.career.daily.best, { score: todayBest })}` : content.career.daily.note;
  const ship = economy ? shipName(content.economy, economy.tier, economy.mark) : "";
  // Coin and shards as they come in, each shown rising off its count.
  const redGain = useGains(economy ? economy.purse.RED : null);
  const voidGain = useGains(economy ? economy.purse.VOID : null);
  // What the voyage says, one line at a time: a burst waits its turn.
  const [messages, setMessages] = useState<QueuedLine[]>([]);
  const messageId = useRef(0);
  // What the voyage says aloud: each line once, in order, through one polite and one urgent region that stay mounted
  // (a region mounted with its words already in it is often not read). Each keeps its last few lines as separate
  // children, so lines said in the same moment (a chapter told and the next one opening, a danger and a reward) are
  // each read, rather than the last one alone.
  const [spoken, setSpoken] = useState<SpokenLines>({ polite: [], urgent: [] });
  const message = messages[0] ?? null;
  const previous = useRef<VoyageSnapshot | null>(null);
  // The guided step whose coin or core has been set out this run, so pausing or the hangar never sets out another.
  const guideSpawned = useRef<number | null>(null);
  const bestBefore = useRef(best);
  const status = snapshot?.status ?? "ready";
  // A perk offered or a port's trade open holds the run still, and the bar with it.
  const isChoosing = status === "flying" && Boolean(snapshot?.perkOffer);
  const isDocked = status === "flying" && Boolean(snapshot?.docked);
  // While the hangar or a port is open, the flight's HUD under it (marked data-hud-layer) takes no focus and no clicks,
  // so Tab stays within the panel.

  useEffect(() => {
    dialogRef.current?.querySelectorAll<HTMLElement>("[data-hud-layer]").forEach((layer) => layer.toggleAttribute("inert", isHangarOpen || isDocked));
  });
  // Stranded adrift, the countdown shows over the view; down on a world, the surface card says it.
  const adrift = snapshot && !snapshot.landedOn ? strandedLine(content, snapshot) : null;
  const surfaceTitle = snapshot?.surface ? surfaceHeading(content, snapshot) : "";
  // The world a landing is coming down on: by the surface once it is seen, else by the name the snapshot gives.
  const comingDownOn = snapshot?.surface
    ? placeName(content, snapshot.surface.body, snapshot.surface.name ?? snapshot.landedOn)
    : placeName(content, snapshot?.landedOn ?? "");
  const say = (text: string | null, isKept = false, isUrgent = false, isQuest = false, card: QuestCard | null = null) => {
    if (text) {
      messageId.current += 1;

      const next = { id: messageId.current, text, isKept, isUrgent, isQuest, card };

      setMessages((queue) => queueLine(queue, next, MESSAGE_QUEUE));
      setSpoken((lines) => withSpoken(lines, { id: messageId.current, text }, isUrgent));
    }
  };
  // The answer to a tap shows at once, in place of the line already seen (unless it is kept), and the rest still wait
  // their turn.
  const reply = (text: string) => {
    messageId.current += 1;

    const next = { id: messageId.current, text, isKept: false, isUrgent: false };

    setMessages((queue) => replyLine(queue, next));
    setSpoken((lines) => withSpoken(lines, { id: messageId.current, text }, false));
  };

  // Each line shows for its moment, then the next; held while the run is paused or the hangar is open (its fade held
  // with it, through the Message's data-held), so pausing gives a reader all the time they need (WCAG 2.2.1), and on
  // resuming it runs only the time it had left.
  const isLineHeld = isPaused || isHangarOpen;
  const lineClock = useRef<{ id: number; startedAt: number; leftMs: number } | null>(null);

  useEffect(() => {
    if (!message) {
      lineClock.current = null;

      return undefined;
    }

    if (lineClock.current?.id !== message.id) {
      lineClock.current = { id: message.id, startedAt: 0, leftMs: lineMs(message) };
    }

    const clock = lineClock.current;

    if (isLineHeld) {
      return undefined;
    }

    clock.startedAt = performance.now();

    const timer = window.setTimeout(() => setMessages((queue) => queue.slice(1)), clock.leftMs);

    return () => {
      window.clearTimeout(timer);
      clock.leftMs = Math.max(0, clock.leftMs - (performance.now() - clock.startedAt));
    };
  }, [message, isLineHeld]);

  useEffect(() => {
    if (!isHangarOpen) {
      setHangarTab(null);
    }
  }, [isHangarOpen]);

  const openLoadout = () => {
    setHangarTab("loadout");
    setHangar(true);
  };

  const openQuests = () => {
    setHangarTab("quests");
    setHangar(true);
  };

  // The quest pinned to the HUD, kept in this browser; and pinning one.
  const [pinned, setPinned] = useState<string | null>(() => readStored(TRACK_KEY, isQuestId));
  const track = (id: string | null) => {
    setPinned(id);
    writeStored(TRACK_KEY, id);
  };
  const tracked = career ? trackedQuest(career, pinned) : null;
  // The hull's heat and the air, carried into a world's card where the telemetry steps aside for it.
  const cornerLabels = [content.telemetry.temperature, content.telemetry.air];
  const readingsInCorner = snapshot ? telemetryRows(content, snapshot).filter((row) => cornerLabels.includes(row.label)) : [];
  const trackedName = tracked ? (tracked.kind === "story" ? storyStepName(content, tracked.objective) : missionName(content, tracked.objective)) : "";

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    say(voyageMessage(content, snapshot, previous.current, universes));

    if (snapshot.status === "flying" && previous.current?.status !== "flying") {
      bestBefore.current = best;
      guideSpawned.current = null;
    }

    if (snapshot.status === "over" && previous.current?.status !== "over") {
      onRecord(snapshot.score);
    }

    previous.current = snapshot;
  }, [best, content, onRecord, snapshot, universes]);

  // The guided first flight: its step until it is done, shown while a run is under way and nothing covers it.
  const guideStep = progress && !progress.guide.isDone ? progress.guide.step : null;
  const isGuiding = guideStep !== null && status === "flying" && !isPaused && !isHangarOpen && !isPhoto;
  const nextGuide = () => act(guideStep !== null && guideStep >= GUIDE_LAST ? { kind: "skipGuide" } : { kind: "guide", step: (guideStep ?? 0) + 1 });
  const guideNext = useRef(nextGuide);

  guideNext.current = nextGuide;

  // Each step sets up what it asks (a coin, a boost's core ahead) and moves on by itself: once the coin is picked up,
  // the core found, the map opened or the ship down, or after a while for the rest.
  useEffect(() => {
    if (!isGuiding || guideStep === null) {
      return undefined;
    }

    if (guideSpawned.current !== guideStep && (guideStep === GUIDE.coin || guideStep === GUIDE.boost)) {
      guideSpawned.current = guideStep;
      guideSpawn(guideStep === GUIDE.coin ? "coin" : "boost");
    }

    const timer = guideStep === GUIDE.fly || guideStep === GUIDE.guns ? window.setTimeout(() => guideNext.current(), GUIDE_WAIT_MS) : null;

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [guideSpawn, guideStep, isGuiding]);

  useEffect(() => {
    if ((guideStep === GUIDE.coin && redGain) || (guideStep === GUIDE.map && isMapOpen)) {
      guideNext.current();
    }
  }, [guideStep, isMapOpen, redGain]);

  // Leaving a run in progress asks first, over the run held still; between runs the voyage just closes. The question
  // goes when the run moves again, however that happens, and a run it paused itself resumes if the pilot stays.
  const [isLeaving, setIsLeaving] = useState(false);
  const pausedToAsk = useRef(false);
  const isAskingToLeave = isLeaving && isPaused && status === "flying";
  // The card that comes up takes focus, so a keyboard or a screen reader is in it at once: the leave question on its
  // Stay, the others on their title.
  const cardRef = useRef<HTMLDivElement>(null);
  const cardKind = status === "over" ? "over" : isAskingToLeave ? "leave" : status === "ready" ? "ready" : null;

  useEffect(() => {
    const card = cardRef.current;
    const target = cardKind === "leave" ? card?.querySelector<HTMLElement>("button") : card?.querySelector<HTMLElement>("h2, h3");

    if (target) {
      focusLanding(target);
    }
  }, [cardKind]);

  useEffect(() => {
    if (!isPaused) {
      setIsLeaving(false);
    }
  }, [isPaused]);

  const askToLeave = () => {
    if (status !== "flying") {
      closeDialog();

      return;
    }

    // Asked only over a run held by its own pause, never one the map, hangar or photo mode holds still.
    const didPause = !isPaused && pause();

    if (!isPaused && !didPause) {
      return;
    }

    pausedToAsk.current = didPause;
    setIsLeaving(true);
  };

  const keepFlying = () => {
    setIsLeaving(false);

    if (pausedToAsk.current) {
      pausedToAsk.current = false;
      resume();
    }
  };

  const toggleLeave = () => (isAskingToLeave ? keepFlying() : askToLeave());

  leaveRef.current = toggleLeave;

  // A close request that came from no key the voyage handles (a phone's back gesture): during a run it steps out of
  // whatever is open first, then asks, as Escape does.
  const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (status !== "flying") {
      return;
    }

    event.preventDefault();

    if (isHangarOpen) {
      setHangar(false);
    } else if (isPhoto) {
      togglePhoto();
    } else if (isMapOpen) {
      toggleMap();
    } else {
      toggleLeave();
    }
  };

  // The map is a view of its own: the HUD, the cards and the bar step aside for it, as they do for photo mode.
  const isMapView = isMapOpen && !isPhoto && !isHangarOpen;
  const isHudAside = isPhoto || isMapView;

  useEffect(() => {
    if (notices.length === 0) {
      return;
    }

    const isDone = (guideStep === GUIDE.boost && notices.some((notice) => notice.kind === "boostFound")) ||
      (guideStep === GUIDE.land && notices.some((notice) => notice.kind === "landed"));

    if (isDone) {
      guideNext.current();
    }

    notices.forEach((notice) => {
      if (notice.kind === "paid") {
        setPay(notice.coin);
      } else if (notice.kind === "daily") {
        setDaily({ day: notice.day, score: notice.score, isBest: notice.isBest });
      } else if (notice.kind === "slotRefused") {
        // The answer to a press shows at once, as a tap's does.
        reply(voyageNotice(content, notice) ?? "");
      } else {
        // A quest's card is kept like the story's lines, so what it paid is never crowded out or cut short.
        const card = questCard(content, notice);

        say(voyageNotice(content, notice), isKeptNotice(notice) || card !== null, isUrgentNotice(notice), isQuestNotice(notice), card);
      }
    });
    takeNotices(notices.length);
  }, [content, guideStep, notices, takeNotices]);

  const start = (mode: "free" | "daily" = "free") => {
    if (!isSetUp) {
      writeStored(SETUP_KEY, true);
      setIsSetUp(true);
    }

    setPay(null);
    setDaily(null);
    setShareNote(null);
    setHangar(false);
    play(mode);
  };

  startRef.current = () => start();

  // The run's card: its last view and its figures, shared through the device's share sheet or saved.
  const shareRun = async () => {
    const card = document.createElement("canvas");
    const context = card.getContext("2d");

    if (!context || !snapshot) {
      return;
    }

    card.width = RUN_CARD.width;
    card.height = RUN_CARD.height;
    drawRunCard(context, composePhoto(), {
      title: content.share.title,
      subtitle: content.share.subtitle,
      score: formatNumber(snapshot.score),
      rows: summary ? summaryRows(content, summary).filter((row) => row.label !== content.progress.summary.score) : [],
      site: content.share.site,
      cta: content.share.cta,
    });

    const outcome = await shareCard(card, fill(content.share.file, { date: today }), fill(content.share.text, { score: formatNumber(snapshot.score) }), SITE_URL);

    setShareNote(outcome === "saved" ? content.share.saved : null);
  };

  const hullShare = snapshot && snapshot.maxHull > 0 ? snapshot.hull / snapshot.maxHull : 1;
  // The main gun's rounds, against what the racks hold.
  const roundsRack = gear?.ammo.find((rack) => rack.type === "rounds")?.rack ?? 0;
  const bars = snapshot ? [
    { label: content.hull, value: snapshot.hull, max: snapshot.maxHull, colour: hullShare < 0.3 ? BAR_COLOUR.hullLow : BAR_COLOUR.hull, icon: faHeartPulse },
    { label: content.shields, value: snapshot.shields, max: snapshot.maxShields, colour: BAR_COLOUR.shields, icon: faShieldHalved },
    { label: content.fuel, value: snapshot.fuel, max: snapshot.maxFuel, colour: BAR_COLOUR.fuel, icon: faGasPump },
    ...(gear ? [{
      label: content.gear.ammo.rounds,
      value: snapshot.weapons.ammo.rounds,
      max: Math.max(roundsRack, snapshot.weapons.ammo.rounds),
      colour: BAR_COLOUR.rounds,
      icon: faCrosshairs,
    }] : []),
  ] : [];
  const hurt = snapshot ? SYSTEMS.filter((id) => snapshot.modules[id] < SOUND) : [];
  const { combat, economy: copy } = content;
  // Faults come from the run itself, so each shows the moment it happens; what fixes it, from the hangar.
  const repairs = status === "flying" && economy && snapshot ? snapshot.faults.map(({ id, kind }) => {
    const repair = economy.repairs.find((entry) => entry.fault === id);

    return { fault: id, kind, parts: repair?.parts ?? null, craft: repair?.craft ?? null, options: repair?.options ?? [] };
  }) : [];
  // What wants the pilot while the HUD keeps it short: a hurt system or a fault (the compact HUD's info button wears a
  // dot for it, and the tracker steps aside for it on a short phone).
  const isTroubled = status === "flying" && (hurt.length > 0 || repairs.length > 0);
  const hudLabel = !hud.isCompact ? content.hud.close : isTroubled ? `${content.hud.open}, ${content.hud.alert}` : content.hud.open;
  // Every way a fault can be fixed, and the ground: what to look for when nothing in the hold will do.
  const needsFor = (options: ItemStack[][]) => {
    const parts = options.map((option) => option.map(({ id, count }) => stacksText(copy, [{ id, count }])).join(copy.faults.and)).join(copy.faults.or);

    return `${fill(copy.faults.needs, { parts })}, ${copy.faults.ground}`;
  };
  // An MMO frame's name line: who, and their level and standing (or the rock's size).
  const describe = (frame: Frame) => ({
    name: frame.role === "whale" ? combat.roles.whale : frame.role === "trader" ? combat.roles.trader : frame.name || combat.rock,
    meta: frame.disposition ? `${fill(combat.level, { level: frame.level })}, ${combat.dispositions[frame.disposition]}` : "",
  });
  const frameBars = (frame: Frame) => (
    <>
      <FrameTrack role="meter" aria-label={content.hull} aria-valuemin={0} aria-valuemax={frame.maxHull} aria-valuenow={frame.hull}>
        <BarFill colour={BAR_COLOUR.hullLow} style={{ transform: `scaleX(${frame.maxHull > 0 ? frame.hull / frame.maxHull : 0})` }} />
      </FrameTrack>
      {frame.maxShields > 0 && (
        <FrameTrack role="meter" aria-label={content.shields} aria-valuemin={0} aria-valuemax={frame.maxShields} aria-valuenow={frame.shields}>
          <BarFill colour={BAR_COLOUR.shields} style={{ transform: `scaleX(${frame.shields / frame.maxShields})` }} />
        </FrameTrack>
      )}
    </>
  );

  return (
    <Dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onCancel}
      onClick={onBackdropClick}
      onKeyDown={voyage.onKeyDown}
      onKeyUp={voyage.onKeyUp}
      aria-label={content.title}
      data-hud={hud.isCompact ? "compact" : "full"}
      data-hud-toggle={hud.canCompact ? "" : undefined}
    >
      <Stage
        ref={stageRef}
        tabIndex={-1}
        role="application"
        aria-label={content.canvasLabel}
        aria-describedby={CONTROLS_ID}
        onPointerDown={voyage.onPointerDown}
        onPointerMove={voyage.onPointerMove}
        onPointerUp={voyage.onPointerEnd}
        onPointerCancel={voyage.onPointerEnd}
        onPointerLeave={voyage.onPointerEnd}
        onWheel={voyage.onWheel}
      >
        <Canvas ref={backRef} aria-hidden="true" />
        <LensCanvas ref={lensRef} aria-hidden="true" />
        <Canvas ref={frontRef} aria-hidden="true" />
        <ControlsNote id={CONTROLS_ID}>{controlsText}</ControlsNote>
        {isManual && isTouch && <TouchStick ref={stickRef} aria-hidden="true" />}
      </Stage>
      {isPhoto && (
        <PhotoBar aria-label={content.career.photo.title}>
          <PhotoHint role="status">{content.career.photo.hint}</PhotoHint>
          <PadButtons>
            <IconButton type="button" onClick={() => voyage.look(PHOTO_STEP, 0)} aria-label={content.career.photo.look.left}>
              <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            </IconButton>
            <IconButton type="button" onClick={() => voyage.look(0, PHOTO_STEP)} aria-label={content.career.photo.look.up}>
              <FontAwesomeIcon icon={faArrowUp} aria-hidden="true" />
            </IconButton>
            <IconButton type="button" onClick={() => voyage.look(0, -PHOTO_STEP)} aria-label={content.career.photo.look.down}>
              <FontAwesomeIcon icon={faArrowDown} aria-hidden="true" />
            </IconButton>
            <IconButton type="button" onClick={() => voyage.look(-PHOTO_STEP, 0)} aria-label={content.career.photo.look.right}>
              <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </IconButton>
            <IconButton type="button" onClick={() => voyage.zoomStep(1)} aria-label={content.hud.zoomIn}>
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} aria-hidden="true" />
            </IconButton>
            <IconButton type="button" onClick={() => voyage.zoomStep(-1)} aria-label={content.hud.zoomOut}>
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} aria-hidden="true" />
            </IconButton>
          </PadButtons>
          <ActionButton type="button" isPrimary onClick={() => savePhoto(fill(content.career.photo.file, { date: today }))}>
            <FontAwesomeIcon icon={faDownload} aria-hidden="true" />
            {content.career.photo.save}
          </ActionButton>
          <ActionButton type="button" isPrimary={false} onClick={togglePhoto}>
            {content.career.photo.close}
          </ActionButton>
        </PhotoBar>
      )}
      {isMapView && (
        <MapBar aria-label={content.map}>
          <MapTitle>{content.map}</MapTitle>
          <IconButton type="button" onClick={toggleMap} aria-label={content.closeMap}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </IconButton>
        </MapBar>
      )}
      <Hud hidden={isHudAside} data-hud-layer="">
        <Vitals>
          <Place>{snapshot && status !== "ready" ? voyagePlace(content, snapshot, universes) : ""}</Place>
          {economy && (
            <ShipLine>
              {career ? fill(content.career.shipLine, { rank: rankName(content, career.rankId), ship }) : ship}
            </ShipLine>
          )}
          {status !== "ready" && (
            <BarsRow>
              <Bars>
                {bars.map((bar) => (
                  <BarRow key={bar.label}>
                    <BarIcon colour={bar.colour} aria-hidden="true"><FontAwesomeIcon icon={bar.icon} /></BarIcon>
                    <BarLabel>{bar.label}</BarLabel>
                    <BarValue>{`${bar.value} / ${bar.max}`}</BarValue>
                    <BarTrack role="meter" aria-label={bar.label} aria-valuemin={0} aria-valuemax={bar.max} aria-valuenow={bar.value}>
                      <BarFill colour={bar.colour} style={{ transform: `scaleX(${bar.max > 0 ? bar.value / bar.max : 0})` }} />
                    </BarTrack>
                  </BarRow>
                ))}
              </Bars>
              {hud.canCompact && (
                <HudToggle
                  type="button"
                  aria-pressed={!hud.isCompact}
                  aria-label={hudLabel}
                  onClick={() => setHudOpen(!isHudOpen)}
                >
                  <FontAwesomeIcon icon={hud.isCompact ? faCircleInfo : faCompress} aria-hidden="true" />
                  {hud.isCompact && isTroubled && <HudAlert aria-hidden="true" />}
                </HudToggle>
              )}
            </BarsRow>
          )}
          {tracked && status === "flying" && !isHangarOpen && !isChoosing && !isDocked && (
            <Tracker isYielding={isTroubled && !hud.isCompact} data-under-card={snapshot?.descent || snapshot?.surface ? "" : undefined}>
              <TrackerText>
                <TrackerName>
                  <span>{trackedName}</span>
                  <TrackerCount>{`${tracked.progress}/${tracked.target}`}</TrackerCount>
                </TrackerName>
                <TrackerSub>
                  {tracked.chapter ? fill(content.hangar.quests.story, { chapter: chapterTitle(content, tracked.chapter) }) : content.hangar.quests.mission}
                </TrackerSub>
              </TrackerText>
              <TrackerOpen
                type="button"
                onClick={openQuests}
                aria-label={fill(content.hangar.quests.tracker, { name: trackedName, progress: tracked.progress, target: tracked.target })}
              >
                <FontAwesomeIcon icon={faScroll} aria-hidden="true" />
              </TrackerOpen>
            </Tracker>
          )}
          {status === "flying" && hurt.length > 0 && snapshot && (
            <>
              <SystemsTitle>{content.systems.title}</SystemsTitle>
              <Systems>
                {hurt.map((id) => {
                  const share = snapshot.modules[id];
                  const name = content.systems.names[id] ?? id;

                  return (
                    <SystemRow key={id}>
                      <SystemName>{name}</SystemName>
                      <SystemTrack role="meter" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}>
                        <BarFill colour={share < 0.35 ? BAR_COLOUR.failing : BAR_COLOUR.worn} style={{ transform: `scaleX(${share})` }} />
                      </SystemTrack>
                    </SystemRow>
                  );
                })}
              </Systems>
            </>
          )}
          {repairs.length > 0 && (
            <>
              <SystemsTitle>{copy.faults.title}</SystemsTitle>
              <FaultList>
                {repairs.map(({ fault, kind, parts, craft, options }) => (
                  <FaultRow key={fault}>
                    <span>{copy.faults.names[kind]}</span>
                    <FixButton
                      type="button"
                      isReady={parts !== null}
                      aria-label={`${craft ? copy.faults.makeAndFix : copy.faults.fix}: ${copy.faults.names[kind]}${parts ? `, ${stacksText(copy, parts)}` : ""}`}
                      aria-describedby={parts ? undefined : `fault-needs-${fault}`}
                      // With nothing to fix it, a tap says what to look for rather than doing nothing.
                      onClick={() => (parts ? act({ kind: "repair", fault }) : reply(needsFor(options)))}
                    >
                      {craft ? copy.faults.makeAndFix : copy.faults.fix}
                    </FixButton>
                    {!parts && <FaultNeed id={`fault-needs-${fault}`}>{needsFor(options)}</FaultNeed>}
                  </FaultRow>
                ))}
              </FaultList>
            </>
          )}
          {status === "flying" && snapshot?.target && (
            <TargetFrame aria-label={describe(snapshot.target).name}>
              <FrameName>
                {describe(snapshot.target).name}
                <FrameMeta>{describe(snapshot.target).meta}</FrameMeta>
              </FrameName>
              {frameBars(snapshot.target)}
            </TargetFrame>
          )}
        </Vitals>
        <Readout>
          <Reading>
            <ReadingName>{content.score}</ReadingName>
            <ReadingValue>{snapshot?.score ?? 0}</ReadingValue>
          </Reading>
          <Reading>
            <ReadingName>{content.best}</ReadingName>
            <ReadingValue>{Math.max(best, status === "over" ? snapshot?.score ?? 0 : 0)}</ReadingValue>
          </Reading>
          {economy && (
            <>
              <Reading>
                <ReadingName><CurrencyIcon code="RED" label={copy.currencies.RED} /></ReadingName>
                <Coin>
                  {formatNumber(economy.purse.RED)}
                  {redGain && <Gain key={redGain.id} aria-hidden="true">{`+${redGain.amount}`}</Gain>}
                </Coin>
              </Reading>
              <Reading>
                <ReadingName><CurrencyIcon code="VOID" label={copy.currencies.VOID} /></ReadingName>
                <Coin isShards>
                  {economy.purse.VOID}
                  {voidGain && <Gain key={voidGain.id} aria-hidden="true">{`+${voidGain.amount}`}</Gain>}
                </Coin>
              </Reading>
            </>
          )}
        </Readout>
        <HudButtons>
          {economy && (
            <IconButton type="button" onClick={() => setHangar(!isHangarOpen)} aria-label={isHangarOpen ? copy.closeHangar : copy.openHangar} aria-pressed={isHangarOpen}>
              <FontAwesomeIcon icon={faWarehouse} aria-hidden="true" />
            </IconButton>
          )}
          {status === "flying" && snapshot && (
            <IconButton type="button" onClick={toggleGuns} aria-label={snapshot.autoFire ? combat.autoFire : combat.holdFire} aria-pressed={snapshot.autoFire}>
              <FontAwesomeIcon icon={faCrosshairs} aria-hidden="true" style={{ opacity: snapshot.autoFire ? 1 : 0.45 }} />
            </IconButton>
          )}
          {status !== "ready" && (
            <IconButton type="button" onClick={togglePhoto} disabled={isHangarOpen} aria-label={content.career.photo.open} aria-pressed={isPhoto}>
              <FontAwesomeIcon icon={faCamera} aria-hidden="true" />
            </IconButton>
          )}
          {status !== "ready" && (
            <IconButton type="button" onClick={toggleMap} aria-label={isMapOpen ? content.closeMap : content.map} aria-pressed={isMapOpen}>
              <FontAwesomeIcon icon={faMap} aria-hidden="true" />
            </IconButton>
          )}
          {status === "flying" && (
            <IconButton type="button" disabled={isMapOpen} onClick={isPaused ? resume : pause} aria-label={isPaused ? content.resume : content.pause}>
              <FontAwesomeIcon icon={isPaused ? faPlay : faPause} aria-hidden="true" />
            </IconButton>
          )}
          <IconButton type="button" onClick={askToLeave} aria-label={content.close}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </IconButton>
        </HudButtons>
      </Hud>
      {snapshot?.descent && status === "flying" && !isHangarOpen && !isHudAside && (
        <SurfaceCard aria-label={fill(content.descent.title, { body: comingDownOn })}>
          <SurfaceTitle>{fill(content.descent.title, { body: comingDownOn })}</SurfaceTitle>
          <SurfaceMethod>{descentMethod(content, snapshot.descent, snapshot.surface?.isHome ?? false)}</SurfaceMethod>
          <SurfacePhase>{content.descent.phases[snapshot.descent.phase]}</SurfacePhase>
          {descentRows(content, snapshot.descent).map(({ text, isSlim }) => <SurfaceLine key={text} data-slim={isSlim ? "" : undefined}>{text}</SurfaceLine>)}
          {snapshot.people && <SurfaceLine>{fill(content.surface.people, { faction: snapshot.people.name })}</SurfaceLine>}
          {readingsInCorner.map((row) => <SurfaceReading key={row.label}>{`${row.label} ${row.value}`}</SurfaceReading>)}
          {descentHint(content, snapshot.descent, landing.control === "manual").map((line) => <SurfaceHint key={line}>{line}</SurfaceHint>)}
        </SurfaceCard>
      )}
      {!snapshot?.descent && snapshot?.surface && status === "flying" && !isHangarOpen && !isHudAside && (
        <SurfaceCard aria-label={surfaceTitle}>
          <SurfaceTitle>{surfaceTitle}</SurfaceTitle>
          {surfaceLines(content, snapshot, home?.name ?? null).map((line) => <SurfaceLine key={line}>{line}</SurfaceLine>)}
          {readingsInCorner.map((row) => <SurfaceReading key={row.label}>{`${row.label} ${row.value}`}</SurfaceReading>)}
          <SurfaceHint>{surfaceHint(content, snapshot, home?.name ?? null)}</SurfaceHint>
        </SurfaceCard>
      )}
      {snapshot && status === "flying" && !isHangarOpen && !isHudAside && (
        <TelemetryPanel aria-label={content.telemetry.title} isYielding={Boolean(snapshot.descent || snapshot.surface)}>
          <TelemetryTitle>{content.telemetry.title}</TelemetryTitle>
          <TelemetryList>
            {telemetryRows(content, snapshot).map((row) => (
              <TelemetryRow key={row.label} isKey={row.isKey} data-slim={row.isSlim ? "" : undefined}>
                <TelemetryName>{row.label}</TelemetryName>
                <TelemetryValue>{row.value}</TelemetryValue>
              </TelemetryRow>
            ))}
          </TelemetryList>
        </TelemetryPanel>
      )}
      {status === "flying" && snapshot && !isChoosing && !isDocked && (isGuiding || snapshot.boss || snapshot.incoming || snapshot.salvage || adrift ||
        economy?.suggestion || snapshot.dockable || snapshot.distress) && !isHangarOpen && !isHudAside && (
        <Frames data-target={snapshot.target ? "" : undefined} data-hud-layer="">
          {snapshot.dockable && (
            <DockButton type="button" onClick={() => act({ kind: "dock" })}>
              <FontAwesomeIcon icon={faAnchor} aria-hidden="true" />
              {fill(content.encounters.station.dockAt, { port: portName(content, snapshot.dockable) })}
            </DockButton>
          )}
          {snapshot.distress && (
            <DistressFrame>
              {fill(content.encounters.distress.frame, { seconds: snapshot.distress.seconds })}
              {snapshot.distress.isNear && (
                <span>{snapshot.distress.progress > 0 ? content.encounters.distress.boarding : content.encounters.distress.hold}</span>
              )}
              {snapshot.distress.progress > 0 && (
                <FrameTrack
                  role="meter"
                  aria-label={content.encounters.distress.boarding}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(snapshot.distress.progress * 100)}
                >
                  <BarFill colour="#ffb347" style={{ transform: `scaleX(${snapshot.distress.progress})` }} />
                </FrameTrack>
              )}
            </DistressFrame>
          )}
          {isGuiding && guideStep !== null && (
            <Guide content={content} step={guideStep} isTouch={isTouch} onNext={nextGuide} onSkip={() => act({ kind: "skipGuide" })} />
          )}
          {adrift && <Incoming>{adrift}</Incoming>}
          {economy?.suggestion && (
            <ReadyButton type="button" onClick={() => economy.suggestion && follow(economy.suggestion)}>
              <FontAwesomeIcon icon={faCircleUp} aria-hidden="true" />
              {/* The key that does it is said only where there are keys. */}
              {isTouch ? suggestionText(copy, economy.suggestion) : fill(copy.suggestion.hint, { action: suggestionText(copy, economy.suggestion) })}
            </ReadyButton>
          )}
          {snapshot.salvage && (
            <Salvage role="status" aria-label={fill(copy.salvage.progress, { wreck: copy.salvage.wrecks[snapshot.salvage.kind] })}>
              {fill(copy.salvage.progress, { wreck: copy.salvage.wrecks[snapshot.salvage.kind] })}
              <FrameTrack
                role="meter"
                aria-label={copy.salvage.wrecks[snapshot.salvage.kind]}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(snapshot.salvage.progress * 100)}
              >
                <BarFill colour="#7dffcf" style={{ transform: `scaleX(${snapshot.salvage.progress})` }} />
              </FrameTrack>
            </Salvage>
          )}
          {snapshot.boss && (
            <BossFrame aria-label={combat.boss}>
              <FrameName>
                {snapshot.boss.name}
                <FrameMeta>{`${combat.boss}, ${fill(combat.level, { level: snapshot.boss.level })}`}</FrameMeta>
              </FrameName>
              {frameBars(snapshot.boss)}
              {snapshot.bossMove && <BossTell>{content.encounters.bossTells[snapshot.bossMove]}</BossTell>}
            </BossFrame>
          )}
          {snapshot.incoming && (
            <Incoming>
              {fill(combat.incoming, {
                diameter: snapshot.incoming.diameterKm,
                target: content.stops[snapshot.incoming.target] ?? snapshot.incoming.target,
                seconds: snapshot.incoming.seconds,
              })}
              {!snapshot.incoming.isOnCourse && ` (${combat.willMiss})`}
              <FrameTrack role="meter" aria-label={combat.rock} aria-valuemin={0} aria-valuemax={snapshot.incoming.maxHp} aria-valuenow={snapshot.incoming.hp}>
                <BarFill
                  colour={BAR_COLOUR.hullLow}
                  style={{ transform: `scaleX(${snapshot.incoming.maxHp > 0 ? snapshot.incoming.hp / snapshot.incoming.maxHp : 0})` }}
                />
              </FrameTrack>
            </Incoming>
          )}
        </Frames>
      )}
      {economy && snapshot && status === "flying" && !isPaused && !isHangarOpen && !isHudAside && !isChoosing && !isDocked && (
        <AbilityBar
          content={content}
          rows={economy.bar}
          boosts={snapshot.boosts}
          weapons={snapshot.weapons}
          onUse={(index) => act({ kind: "slot", index })}
          onFill={openLoadout}
        />
      )}
      {message && status === "flying" && !isHudAside && (
        <Message
          key={message.id}
          data-hud-layer=""
          data-held={isLineHeld ? "" : undefined}
          isCard={Boolean(message.card)}
          style={{ "--message-ms": `${lineMs(message)}ms` } as CSSProperties}
        >
          {message.card ? (
            <CardText>
              <CardTitle>
                <FontAwesomeIcon icon={faScroll} aria-hidden="true" />
                {message.card.title}
              </CardTitle>
              <CardName>{message.card.name}</CardName>
              {(message.card.xp > 0 || message.card.coin > 0) && (
                <CardReward>
                  {message.card.xp > 0 && <span>{fill(content.hangar.quests.card.xp, { xp: message.card.xp })}</span>}
                  {message.card.coin > 0 && <Money copy={copy} amount={message.card.coin} isSigned />}
                </CardReward>
              )}
              {message.card.line && <CardLine>{message.card.line}</CardLine>}
            </CardText>
          ) : message.text}
          {message.isQuest && (
            <MessageButton type="button" onClick={openQuests}>
              <FontAwesomeIcon icon={faScroll} aria-hidden="true" />
              {` ${content.hangar.quests.open}`}
            </MessageButton>
          )}
        </Message>
      )}
      {isChoosing && snapshot?.perkOffer && !isHangarOpen && !isPhoto && (
        <PerkCard content={content} offer={snapshot.perkOffer} taken={snapshot.perks} onChoose={choosePerk} />
      )}
      {isDocked && station && snapshot?.docked && !isHangarOpen && (
        <StationPanel content={content} station={station} port={snapshot.docked} onAct={act} onCastOff={castOff} />
      )}
      {economy && isHangarOpen && (
        <HangarPanel
          content={content}
          settings={settings}
          economy={economy}
          career={career}
          gear={gear}
          progress={progress}
          drawShip={drawShip}
          opensOn={hangarTab}
          isFlying={status === "flying"}
          transfer={voyage.transfer}
          onAct={act}
          onFollow={() => economy.suggestion && follow(economy.suggestion)}
          pinned={pinned}
          onTrack={track}
          onDaily={status === "flying" ? null : () => start("daily")}
          onClose={() => setHangar(false)}
        />
      )}
      {(status !== "flying" || isPaused) && !isHangarOpen && !isPhoto && (
        <Overlay isPassThrough={status === "flying"}>
          <Card ref={cardRef} isPassThrough={status === "flying"} accent={status === "over" ? "#ffd76a" : isAskingToLeave ? "#ff9aa5" : "#c4d2ff"}>
            {status === "ready" && (
              <>
                <Title>{content.title}</Title>
                {(career || economy) && (
                  <Chips>
                    {career && (
                      <Chip colour="#ffd76a">
                        {`${rankName(content, career.rankId)}${progress ? `, ${fill(content.progress.level, { level: progress.level })}` : ""}`}
                      </Chip>
                    )}
                    {economy && <Chip colour="#ffd76a"><Money copy={copy} amount={economy.purse.RED} /></Chip>}
                    {economy && <Chip colour="#c58bff"><Money copy={copy} amount={economy.purse.VOID} code="VOID" /></Chip>}
                    {tracked && (
                      <Chip colour="#ffcf9f">
                        <FontAwesomeIcon icon={faScroll} aria-hidden="true" />
                        {trackedName}
                      </Chip>
                    )}
                  </Chips>
                )}
                <Text>{content.intro}</Text>
                <HowTo open={!isSetUp}>
                  <summary>{content.howToFly}</summary>
                  <Text>{controlsText}</Text>
                </HowTo>
                {!isSetUp && (
                  <Setup aria-labelledby="voyage-setup-title">
                    <SetupTitle id="voyage-setup-title">{content.setup.title}</SetupTitle>
                    <Text>{content.setup.note}</Text>
                    <SettingsPanel copy={settings} names={voyageSettings.setupNames} onPick={voyageSettings.onPick} />
                  </Setup>
                )}
                {career && <Text>{dailyNote}</Text>}
                {skyToday.length > 0 && (
                  <Setup aria-labelledby="voyage-sky-title">
                    <SetupTitle id="voyage-sky-title">{content.sky.title}</SetupTitle>
                    {skyLines(content, skyToday).map((line) => <Text key={line}>{line}</Text>)}
                  </Setup>
                )}
                <Credits>{content.credits}</Credits>
                <CardButtons>
                  <ActionButton type="button" isPrimary disabled={!isReady} onClick={() => start()}>
                    <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                    {content.start}
                  </ActionButton>
                  {career && (
                    <ActionButton type="button" isPrimary={false} disabled={!isReady} onClick={() => start("daily")}>
                      <FontAwesomeIcon icon={faCalendarDay} aria-hidden="true" />
                      {content.career.daily.start}
                    </ActionButton>
                  )}
                  {economy && (
                    <ActionButton type="button" isPrimary={false} onClick={() => setHangar(true)}>
                      <FontAwesomeIcon icon={faWarehouse} aria-hidden="true" />
                      {copy.hangar}
                    </ActionButton>
                  )}
                </CardButtons>
              </>
            )}
            {isAskingToLeave && (
              <>
                <Title>{content.leave.title}</Title>
                <Text>{content.leave.text}</Text>
                <CardButtons>
                  <ActionButton type="button" isPrimary onClick={keepFlying}>
                    <FontAwesomeIcon icon={faPlay} aria-hidden="true" />
                    {content.leave.stay}
                  </ActionButton>
                  <ActionButton type="button" isPrimary={false} onClick={closeDialog}>
                    {content.leave.confirm}
                  </ActionButton>
                </CardButtons>
              </>
            )}
            {status === "flying" && isPaused && !isAskingToLeave && (
              <>
                <Title>{content.paused}</Title>
                <Text>{controlsText}</Text>
                <CardButtons>
                  <ActionButton type="button" isPrimary onClick={resume}>
                    <FontAwesomeIcon icon={faPlay} aria-hidden="true" />
                    {content.resume}
                  </ActionButton>
                </CardButtons>
              </>
            )}
            {status === "over" && snapshot && (
              <>
                <Title>{content.over}</Title>
                <ScoreRow>
                  <Score role="status">{fill(content.finalScore, { score: formatNumber(snapshot.score) })}</Score>
                  {snapshot.score > bestBefore.current && <Badge>{content.newBest}</Badge>}
                </ScoreRow>
                {pay !== null && pay > 0 && <Pay>{fill(content.pay, { coin: pay })}</Pay>}
                {daily && <Text>{fill(content.career.daily.result, { score: daily.score })}</Text>}
                {summary && (
                  <StatGrid aria-label={content.progress.summary.title}>
                    {summaryRows(content, summary).map((row) => (
                      <Stat key={row.label} isWide={row.value.length > 12}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </Stat>
                    ))}
                  </StatGrid>
                )}
                {daily?.isBest && <Badge>{content.career.daily.newBest}</Badge>}
                {daily && <DailyBoard content={content} day={daily.day} score={daily.score} />}
                <Text role="status">{shareNote ?? ""}</Text>
                <Text>{voyagePlace(content, snapshot, universes)}</Text>
                <Text>{content.kept}</Text>
                <CardButtons>
                  <ActionButton type="button" isPrimary onClick={() => start()}>
                    <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                    {content.again}
                  </ActionButton>
                  <ActionButton type="button" isPrimary={false} onClick={() => void shareRun()}>
                    <FontAwesomeIcon icon={faShareNodes} aria-hidden="true" />
                    {content.share.button}
                  </ActionButton>
                  {career && (
                    <ActionButton type="button" isPrimary={false} onClick={() => start("daily")}>
                      <FontAwesomeIcon icon={faCalendarDay} aria-hidden="true" />
                      {content.career.daily.start}
                    </ActionButton>
                  )}
                  {economy && (
                    <ActionButton type="button" isPrimary={false} onClick={() => setHangar(true)}>
                      <FontAwesomeIcon icon={faWarehouse} aria-hidden="true" />
                      {copy.hangar}
                    </ActionButton>
                  )}
                  <ActionButton type="button" isPrimary={false} onClick={closeDialog}>
                    {content.close}
                  </ActionButton>
                </CardButtons>
              </>
            )}
          </Card>
        </Overlay>
      )}
      <LiveRegion aria-live="polite" aria-relevant="additions">
        {spoken.polite.map((line) => <p key={line.id}>{line.text}</p>)}
      </LiveRegion>
      <LiveRegion role="alert" aria-atomic="false" aria-relevant="additions">
        {spoken.urgent.map((line) => <p key={line.id}>{line.text}</p>)}
      </LiveRegion>
    </Dialog>
  );
};
