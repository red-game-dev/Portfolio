import { FC, useEffect, useRef, useState } from "react";

import { faPause, faPlay, faRocket, faShieldHalved, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ActionButton } from "@/components/Controls";
import { useVoyage } from "@/components/Finale/Voyage/hooks/useVoyage";
import { voyageMessage, voyagePlace } from "@/components/Finale/Voyage/messages";
import {
  Badge,
  Buttons,
  Canvas,
  Card,
  ControlsNote,
  Dialog,
  Hud,
  HudButtons,
  IconButton,
  Message,
  Overlay,
  Place,
  Reading,
  ReadingName,
  ReadingValue,
  Readout,
  Score,
  Shields,
  Stage,
  Text,
  Title,
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

// The voyage, full screen: the game on its canvas, what it shows in plain text over it (where the ship is, the
// score, the shields, each moment said once), and a card to start, to pause and to end on. Opens itself on mount.
export const VoyageDialog: FC<VoyageDialogProps> = ({ content, universes, best, onRecord, onClose }: VoyageDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onBackdropClick = useModalDialog(dialogRef, true);
  const { snapshot, isReady, isPaused, play, pause, resume, onKeyDown, onKeyUp, onPointerDown, onPointerMove, onPointerEnd } = useVoyage(stageRef, canvasRef);
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null);
  const previous = useRef<VoyageSnapshot | null>(null);
  const bestBefore = useRef(best);
  const status = snapshot?.status ?? "ready";

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const text = voyageMessage(content, snapshot, previous.current, universes);

    if (text) {
      setMessage((current) => ({ id: (current?.id ?? 0) + 1, text }));
    }

    if (snapshot.status === "flying" && previous.current?.status !== "flying") {
      bestBefore.current = best;
    }

    if (snapshot.status === "over" && previous.current?.status !== "over") {
      onRecord(snapshot.score);
    }

    previous.current = snapshot;
  }, [best, content, onRecord, snapshot, universes]);

  return (
    <Dialog ref={dialogRef} onClose={onClose} onClick={onBackdropClick} onKeyDown={onKeyDown} onKeyUp={onKeyUp} aria-label={content.title}>
      <Stage
        ref={stageRef}
        tabIndex={-1}
        role="application"
        aria-label={content.canvasLabel}
        aria-describedby={CONTROLS_ID}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerEnd}
      >
        <Canvas ref={canvasRef} aria-hidden="true" />
        <ControlsNote id={CONTROLS_ID}>{content.controls}</ControlsNote>
      </Stage>
      <Hud>
        <Place>{snapshot ? voyagePlace(content, snapshot, universes) : ""}</Place>
        <Readout>
          <Reading>
            <ReadingName>{content.score}</ReadingName>
            <ReadingValue>{snapshot?.score ?? 0}</ReadingValue>
          </Reading>
          <Reading>
            <ReadingName>{content.best}</ReadingName>
            <ReadingValue>{Math.max(best, status === "over" ? snapshot?.score ?? 0 : 0)}</ReadingValue>
          </Reading>
          <Reading>
            <ReadingName>{content.shields}</ReadingName>
            <ReadingValue>
              <Shields aria-label={String(snapshot?.shields ?? 0)}>
                {Array.from({ length: snapshot?.shields ?? 0 }, (_, index) => <FontAwesomeIcon key={index} icon={faShieldHalved} aria-hidden="true" />)}
              </Shields>
            </ReadingValue>
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
