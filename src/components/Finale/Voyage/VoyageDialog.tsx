import { FC, useEffect, useMemo, useRef, useState } from "react";

import {
  faCalendarDay,
  faCamera,
  faCircleUp,
  faCrosshairs,
  faDownload,
  faMap,
  faPause,
  faPlay,
  faRocket,
  faWarehouse,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton } from "@/components/Controls";
import { AbilityBar } from "@/components/Finale/Voyage/AbilityBar/AbilityBar";
import { rankName } from "@/components/Finale/Voyage/career";
import { descentHint, descentMethod, descentRows } from "@/components/Finale/Voyage/descent";
import { shipName, stacksText, suggestionText } from "@/components/Finale/Voyage/economy";
import { HangarPanel, HangarTab } from "@/components/Finale/Voyage/Hangar/HangarPanel";
import { useGains } from "@/components/Finale/Voyage/hooks/useGains";
import { useVoyage } from "@/components/Finale/Voyage/hooks/useVoyage";
import { useVoyageSettings } from "@/components/Finale/Voyage/hooks/useVoyageSettings";
import { placeName, strandedLine, voyageMessage, voyageNotice, voyagePlace } from "@/components/Finale/Voyage/messages";
import { surfaceHeading, surfaceHint, surfaceLines } from "@/components/Finale/Voyage/surface";
import { telemetryRows } from "@/components/Finale/Voyage/telemetry";
import {
  Badge,
  BarFill,
  BossFrame,
  BarLabel,
  BarRow,
  Bars,
  BarTrack,
  BarValue,
  Buttons,
  Canvas,
  Card,
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
  HudButtons,
  IconButton,
  Incoming,
  LensCanvas,
  Message,
  Overlay,
  Pay,
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
  ShipLine,
  Stage,
  SurfaceCard,
  SurfaceHint,
  SurfaceLine,
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
  Setup,
  SetupTitle,
  Text,
  Title,
  Vitals,
} from "@/components/Finale/Voyage/VoyageDialog.styles";
import { SettingsPanel } from "@/components/Preferences/SettingsPanel";
import useModalDialog from "@/hooks/useModalDialog";
import { readStored, writeStored } from "@/packages/browser/storage";
import type { Frame, HomePad, ItemStack, ModuleId, VoyageSnapshot } from "@/packages/games/voyage";
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
// Whether the pilot has been asked how they like to fly, kept so it is asked only the first time.
const SETUP_KEY = "redgame.voyageSetup";
const isTrue = (value: unknown): value is true => value === true;
// How long each line the voyage says stays (ms, its animation's length), and how many may wait.
const MESSAGE_MS = 2800;
const MESSAGE_QUEUE = 4;

// Hull green turning red as it fails, shields blue, fuel gold; a hurt system amber, then red.
const BAR_COLOUR = { hull: "#6ee7a8", hullLow: "#ff4d5e", shields: "#4fd8ff", fuel: "#ffd76a", worn: "#ffb347", failing: "#ff4d5e" };

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
  const voyageSettings = useVoyageSettings();
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
    mapMission: content.mapMarks.mission,
    mapHoleMass: content.mapMarks.holeMass,
    mapKeyMission: content.mapMarks.keyMission,
    mapKeyPull: content.mapMarks.keyPull,
    mapKeyHostile: content.mapMarks.keyHostile,
    mapKeyRock: content.mapMarks.keyRock,
    mapKeyHazard: content.mapMarks.keyHazard,
  }), [content]);
  const canvases = { stage: stageRef, back: backRef, front: frontRef, lens: lensRef };
  const voyage = useVoyage(canvases, { labels, universes, syllables: content.universeNames, home });
  const { snapshot, notices, takeNotices, isReady, isPaused, isMapOpen, play, pause, resume, toggleMap, toggleGuns } = voyage;
  const { economy, isHangarOpen, setHangar, act, follow } = voyage;
  const { career, isPhoto, togglePhoto, savePhoto, landing } = voyage;
  // The hangar opens on its first tab, or on the Loadout when an empty slot of the bar is pressed.
  const [hangarTab, setHangarTab] = useState<HangarTab | null>(null);
  const [pay, setPay] = useState<number | null>(null);
  const [daily, setDaily] = useState<{ score: number; isBest: boolean } | null>(null);
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
  const [messages, setMessages] = useState<Array<{ id: number; text: string }>>([]);
  const messageId = useRef(0);
  const message = messages[0] ?? null;
  const previous = useRef<VoyageSnapshot | null>(null);
  const bestBefore = useRef(best);
  const status = snapshot?.status ?? "ready";
  // Stranded adrift, the countdown shows over the view; down on a world, the surface card says it.
  const adrift = snapshot && !snapshot.landedOn ? strandedLine(content, snapshot) : null;
  const surfaceTitle = snapshot?.surface ? surfaceHeading(content, snapshot) : "";
  // The world a landing is coming down on: by the surface once it is seen, else by the name the snapshot gives.
  const comingDownOn = snapshot?.surface
    ? placeName(content, snapshot.surface.body, snapshot.surface.name ?? snapshot.landedOn)
    : placeName(content, snapshot?.landedOn ?? "");
  const say = (text: string | null) => {
    if (text) {
      messageId.current += 1;

      const next = { id: messageId.current, text };

      setMessages((queue) => [...queue, next].slice(-MESSAGE_QUEUE));
    }
  };
  // The answer to a tap shows at once, in place of the line already seen, and the rest still wait their turn.
  const reply = (text: string) => {
    messageId.current += 1;

    const next = { id: messageId.current, text };

    setMessages((queue) => [next, ...queue.slice(1)]);
  };

  // Each line shows for its moment, then the next.
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => setMessages((queue) => queue.slice(1)), MESSAGE_MS);

    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!isHangarOpen) {
      setHangarTab(null);
    }
  }, [isHangarOpen]);

  const openLoadout = () => {
    setHangarTab("loadout");
    setHangar(true);
  };

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    say(voyageMessage(content, snapshot, previous.current, universes));

    if (snapshot.status === "flying" && previous.current?.status !== "flying") {
      bestBefore.current = best;
    }

    if (snapshot.status === "over" && previous.current?.status !== "over") {
      onRecord(snapshot.score);
    }

    previous.current = snapshot;
  }, [best, content, onRecord, snapshot, universes]);

  useEffect(() => {
    if (notices.length === 0) {
      return;
    }

    notices.forEach((notice) => {
      if (notice.kind === "paid") {
        setPay(notice.coin);
      } else if (notice.kind === "daily") {
        setDaily({ score: notice.score, isBest: notice.isBest });
      } else if (notice.kind === "slotRefused") {
        // The answer to a press shows at once, as a tap's does.
        reply(voyageNotice(content, notice) ?? "");
      } else {
        say(voyageNotice(content, notice));
      }
    });
    takeNotices(notices.length);
  }, [content, notices, takeNotices]);

  const start = (mode: "free" | "daily" = "free") => {
    if (!isSetUp) {
      writeStored(SETUP_KEY, true);
      setIsSetUp(true);
    }

    setPay(null);
    setDaily(null);
    setHangar(false);
    play(mode);
  };

  const hullShare = snapshot && snapshot.maxHull > 0 ? snapshot.hull / snapshot.maxHull : 1;
  const bars = snapshot ? [
    { label: content.hull, value: snapshot.hull, max: snapshot.maxHull, colour: hullShare < 0.3 ? BAR_COLOUR.hullLow : BAR_COLOUR.hull },
    { label: content.shields, value: snapshot.shields, max: snapshot.maxShields, colour: BAR_COLOUR.shields },
    { label: content.fuel, value: snapshot.fuel, max: snapshot.maxFuel, colour: BAR_COLOUR.fuel },
  ] : [];
  const hurt = snapshot ? SYSTEMS.filter((id) => snapshot.modules[id] < SOUND) : [];
  const { combat, economy: copy } = content;
  // Faults come from the run itself, so each shows the moment it happens; what fixes it, from the hangar.
  const repairs = status === "flying" && economy && snapshot ? snapshot.faults.map(({ id, kind }) => {
    const repair = economy.repairs.find((entry) => entry.fault === id);

    return { fault: id, kind, parts: repair?.parts ?? null, craft: repair?.craft ?? null, options: repair?.options ?? [] };
  }) : [];
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
    <Dialog ref={dialogRef} onClose={onClose} onClick={onBackdropClick} onKeyDown={voyage.onKeyDown} onKeyUp={voyage.onKeyUp} aria-label={content.title}>
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
        <ControlsNote id={CONTROLS_ID}>{content.controls}</ControlsNote>
      </Stage>
      {isPhoto && (
        <PhotoBar aria-label={content.career.photo.title}>
          <PhotoHint role="status">{content.career.photo.hint}</PhotoHint>
          <ActionButton type="button" isPrimary onClick={() => savePhoto(fill(content.career.photo.file, { date: today }))}>
            <FontAwesomeIcon icon={faDownload} aria-hidden="true" />
            {content.career.photo.save}
          </ActionButton>
          <ActionButton type="button" isPrimary={false} onClick={togglePhoto}>
            {content.career.photo.close}
          </ActionButton>
        </PhotoBar>
      )}
      <Hud hidden={isPhoto}>
        <Vitals>
          <Place>{snapshot && status !== "ready" ? voyagePlace(content, snapshot, universes) : ""}</Place>
          {economy && (
            <ShipLine>
              {career ? fill(content.career.shipLine, { rank: rankName(content, career.rankId), ship }) : ship}
            </ShipLine>
          )}
          {status !== "ready" && (
            <Bars>
              {bars.map((bar) => (
                <BarRow key={bar.label}>
                  <BarLabel>{bar.label}</BarLabel>
                  <BarValue>{`${bar.value} / ${bar.max}`}</BarValue>
                  <BarTrack role="meter" aria-label={bar.label} aria-valuemin={0} aria-valuemax={bar.max} aria-valuenow={bar.value}>
                    <BarFill colour={bar.colour} style={{ transform: `scaleX(${bar.max > 0 ? bar.value / bar.max : 0})` }} />
                  </BarTrack>
                </BarRow>
              ))}
            </Bars>
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
                <ReadingName>{copy.symbols.RED}</ReadingName>
                <Coin aria-label={`${economy.purse.RED} ${copy.currencies.RED}`}>
                  {formatNumber(economy.purse.RED)}
                  {redGain && <Gain key={redGain.id} aria-hidden="true">{`+${redGain.amount}`}</Gain>}
                </Coin>
              </Reading>
              <Reading>
                <ReadingName>{copy.symbols.VOID}</ReadingName>
                <Coin isShards aria-label={`${economy.purse.VOID} ${copy.currencies.VOID}`}>
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
          <IconButton type="button" onClick={onClose} aria-label={content.close}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </IconButton>
        </HudButtons>
      </Hud>
      {snapshot?.descent && status === "flying" && !isHangarOpen && !isPhoto && (
        <SurfaceCard aria-label={fill(content.descent.title, { body: comingDownOn })}>
          <SurfaceTitle>{fill(content.descent.title, { body: comingDownOn })}</SurfaceTitle>
          <SurfaceLine>{descentMethod(content, snapshot.descent, snapshot.surface?.isHome ?? false)}</SurfaceLine>
          <SurfacePhase>{content.descent.phases[snapshot.descent.phase]}</SurfacePhase>
          {descentRows(content, snapshot.descent).map((row) => <SurfaceLine key={row}>{row}</SurfaceLine>)}
          {snapshot.people && <SurfaceLine>{fill(content.surface.people, { faction: snapshot.people.name })}</SurfaceLine>}
          {descentHint(content, snapshot.descent, landing.control === "manual").map((line) => <SurfaceHint key={line}>{line}</SurfaceHint>)}
        </SurfaceCard>
      )}
      {!snapshot?.descent && snapshot?.surface && status === "flying" && !isHangarOpen && !isPhoto && (
        <SurfaceCard aria-label={surfaceTitle}>
          <SurfaceTitle>{surfaceTitle}</SurfaceTitle>
          {surfaceLines(content, snapshot, home?.name ?? null).map((line) => <SurfaceLine key={line}>{line}</SurfaceLine>)}
          <SurfaceHint>{surfaceHint(content, snapshot, home?.name ?? null)}</SurfaceHint>
        </SurfaceCard>
      )}
      {snapshot && status === "flying" && !isHangarOpen && !isPhoto && (
        <TelemetryPanel aria-label={content.telemetry.title}>
          <TelemetryTitle>{content.telemetry.title}</TelemetryTitle>
          <TelemetryList>
            {telemetryRows(content, snapshot).map((row) => (
              <TelemetryRow key={row.label} isKey={row.isKey}>
                <TelemetryName>{row.label}</TelemetryName>
                <TelemetryValue>{row.value}</TelemetryValue>
              </TelemetryRow>
            ))}
          </TelemetryList>
        </TelemetryPanel>
      )}
      {status === "flying" && snapshot && (snapshot.boss || snapshot.incoming || snapshot.salvage || adrift || economy?.suggestion) && !isHangarOpen && !isPhoto && (
        <Frames>
          {adrift && <Incoming role="status">{adrift}</Incoming>}
          {economy?.suggestion && (
            <ReadyButton type="button" onClick={() => economy.suggestion && follow(economy.suggestion)}>
              <FontAwesomeIcon icon={faCircleUp} aria-hidden="true" />
              {fill(copy.suggestion.hint, { action: suggestionText(copy, economy.suggestion) })}
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
            </BossFrame>
          )}
          {snapshot.incoming && (
            <Incoming role="status">
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
      {economy && snapshot && status === "flying" && !isPaused && !isHangarOpen && !isPhoto && (
        <AbilityBar content={content} rows={economy.bar} boosts={snapshot.boosts} onUse={(index) => act({ kind: "slot", index })} onFill={openLoadout} />
      )}
      {message && status === "flying" && !isPhoto && <Message key={message.id} role="status">{message.text}</Message>}
      {economy && isHangarOpen && (
        <HangarPanel
          content={content}
          settings={settings}
          economy={economy}
          career={career}
          opensOn={hangarTab}
          isFlying={status === "flying"}
          onAct={act}
          onClose={() => setHangar(false)}
        />
      )}
      {(status !== "flying" || isPaused) && !isHangarOpen && !isPhoto && (
        <Overlay>
          <Card>
            {status === "ready" && (
              <>
                <Title>{content.title}</Title>
                <Text>{content.intro}</Text>
                <Text>{content.controls}</Text>
                {!isSetUp && (
                  <Setup aria-labelledby="voyage-setup-title">
                    <SetupTitle id="voyage-setup-title">{content.setup.title}</SetupTitle>
                    <Text>{content.setup.note}</Text>
                    <SettingsPanel copy={settings} names={voyageSettings.names} onPick={voyageSettings.onPick} />
                  </Setup>
                )}
                <Buttons>
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
                </Buttons>
                {career && <Text>{dailyNote}</Text>}
                <Credits>{content.credits}</Credits>
              </>
            )}
            {status === "flying" && isPaused && (
              <>
                <Title>{content.paused}</Title>
                <Text>{content.controls}</Text>
                <Buttons>
                  <ActionButton type="button" isPrimary onClick={resume}>
                    <FontAwesomeIcon icon={faPlay} aria-hidden="true" />
                    {content.resume}
                  </ActionButton>
                </Buttons>
              </>
            )}
            {status === "over" && snapshot && (
              <>
                <Title>{content.over}</Title>
                <Score role="status">{fill(content.finalScore, { score: snapshot.score })}</Score>
                {snapshot.score > bestBefore.current && <Badge>{content.newBest}</Badge>}
                {pay !== null && pay > 0 && <Pay>{fill(content.pay, { coin: pay })}</Pay>}
                {daily && <Text>{fill(content.career.daily.result, { score: daily.score })}</Text>}
                {daily?.isBest && <Badge>{content.career.daily.newBest}</Badge>}
                <Text>{voyagePlace(content, snapshot, universes)}</Text>
                <Text>{content.kept}</Text>
                <Buttons>
                  <ActionButton type="button" isPrimary onClick={() => start()}>
                    <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                    {content.again}
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
                  <ActionButton type="button" isPrimary={false} onClick={onClose}>
                    {content.close}
                  </ActionButton>
                </Buttons>
              </>
            )}
          </Card>
        </Overlay>
      )}
    </Dialog>
  );
};
