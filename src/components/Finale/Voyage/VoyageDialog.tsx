import { FC, useEffect, useRef, useState } from "react";

import { faPause, faPlay, faRocket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton } from "@/components/Controls";
import { useVoyage } from "@/components/Finale/Voyage/hooks/useVoyage";
import { voyageMessage, voyageNotice, voyagePlace } from "@/components/Finale/Voyage/messages";
import { telemetryRows } from "@/components/Finale/Voyage/telemetry";
import {
  Badge,
  BarFill,
  BarLabel,
  BarRow,
  Bars,
  BarTrack,
  BarValue,
  Buttons,
  Canvas,
  Card,
  ControlsNote,
  Dialog,
  Hud,
  HudButtons,
  IconButton,
  LensCanvas,
  Message,
  Overlay,
  Place,
  Reading,
  ReadingName,
  ReadingValue,
  Readout,
  Score,
  Stage,
  TelemetryList,
  TelemetryName,
  TelemetryPanel,
  TelemetryTitle,
  TelemetryValue,
  Text,
  Title,
  Vitals,
} from "@/components/Finale/Voyage/VoyageDialog.styles";
import useModalDialog from "@/hooks/useModalDialog";
import type { VoyageSnapshot } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

interface VoyageDialogProps {
  content: FinaleVoyage;
  // One name per universe, in the game's order.
  universes: string[];
  best: number;
  onRecord: (score: number) => void;
  onClose: () => void;
}

const CONTROLS_ID = "voyage-controls";

// Hull green turning red as it fails, shields blue, fuel gold.
const BAR_COLOUR = { hull: "#6ee7a8", hullLow: "#ff4d5e", shields: "#4fd8ff", fuel: "#ffd76a" };

// The voyage, full screen: the game on its canvases (a 2D back, the GPU lens, a 2D front), and over it in plain
// text everything it shows: where the ship is, its hull, shields and fuel as MMO bars, the score, the live
// telemetry, and each moment said once. A card starts, pauses and ends a run. Opens itself on mount.
export const VoyageDialog: FC<VoyageDialogProps> = ({ content, universes, best, onRecord, onClose }: VoyageDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<HTMLCanvasElement>(null);
  const onBackdropClick = useModalDialog(dialogRef, true);
  const voyage = useVoyage({ stage: stageRef, back: backRef, front: frontRef, lens: lensRef });
  const { snapshot, notice, isReady, isPaused, play, pause, resume } = voyage;
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const previous = useRef<VoyageSnapshot | null>(null);
  const bestBefore = useRef(best);
  const status = snapshot?.status ?? "ready";
  const say = (text: string | null) => {
    if (text) {
      setMessage((current) => ({ id: (current?.id ?? 0) + 1, text }));
    }
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
    if (notice) {
      say(voyageNotice(content, notice));
    }
  }, [content, notice]);

  const hullShare = snapshot && snapshot.maxHull > 0 ? snapshot.hull / snapshot.maxHull : 1;
  const bars = snapshot ? [
    { label: content.hull, value: snapshot.hull, max: snapshot.maxHull, colour: hullShare < 0.3 ? BAR_COLOUR.hullLow : BAR_COLOUR.hull },
    { label: content.shields, value: snapshot.shields, max: snapshot.maxShields, colour: BAR_COLOUR.shields },
    { label: content.fuel, value: snapshot.fuel, max: snapshot.maxFuel, colour: BAR_COLOUR.fuel },
  ] : [];

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
      >
        <Canvas ref={backRef} aria-hidden="true" />
        <LensCanvas ref={lensRef} aria-hidden="true" />
        <Canvas ref={frontRef} aria-hidden="true" />
        <ControlsNote id={CONTROLS_ID}>{content.controls}</ControlsNote>
      </Stage>
      <Hud>
        <Vitals>
          <Place>{snapshot && status !== "ready" ? voyagePlace(content, snapshot, universes) : ""}</Place>
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
        </Readout>
        <HudButtons>
          {status === "flying" && (
            <IconButton type="button" onClick={isPaused ? resume : pause} aria-label={isPaused ? content.resume : content.pause}>
              <FontAwesomeIcon icon={isPaused ? faPlay : faPause} aria-hidden="true" />
            </IconButton>
          )}
          <IconButton type="button" onClick={onClose} aria-label={content.close}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </IconButton>
        </HudButtons>
      </Hud>
      {snapshot && status === "flying" && (
        <TelemetryPanel aria-label={content.telemetry.title}>
          <TelemetryTitle>{content.telemetry.title}</TelemetryTitle>
          <TelemetryList>
            {telemetryRows(content, snapshot).map((row) => (
              <Reading key={row.label} as="div">
                <TelemetryName>{row.label}</TelemetryName>
                <TelemetryValue>{row.value}</TelemetryValue>
              </Reading>
            ))}
          </TelemetryList>
        </TelemetryPanel>
      )}
      {message && status === "flying" && <Message key={message.id} role="status">{message.text}</Message>}
      {(status !== "flying" || isPaused) && (
        <Overlay>
          <Card>
            {status === "ready" && (
              <>
                <Title>{content.title}</Title>
                <Text>{content.intro}</Text>
                <Text>{content.controls}</Text>
                <Buttons>
                  <ActionButton type="button" isPrimary disabled={!isReady} onClick={play}>
                    <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                    {content.start}
                  </ActionButton>
                </Buttons>
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
                <Text>{voyagePlace(content, snapshot, universes)}</Text>
                <Buttons>
                  <ActionButton type="button" isPrimary onClick={play}>
                    <FontAwesomeIcon icon={faRocket} aria-hidden="true" />
                    {content.again}
                  </ActionButton>
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
