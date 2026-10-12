import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import useModalDialog from "@/hooks/useModalDialog";
import type { PilotProfile } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { focusRing } from "@/styles/mixins";
import { PilotTransferContent } from "@/types/game";

interface PilotArrivalProps {
  copy: PilotTransferContent;
}

type Stage = "reading" | "ready" | "invalid" | "moved" | "failed";

// No padding on the dialog itself: a press on it, outside its body, is the backdrop and closes it, so only a press beyond
// the card counts as one.
const Dialog = styled.dialog(() => [
  tw`w-[calc(100% - 32px)] max-w-[440px] p-0 text-left text-[#ccc] bg-[#0b1020] border-[1px] border-solid border-[#c4d2ff]`,
  css`
    box-shadow: 0 0 40px rgba(196, 210, 255, 0.2);

    &::backdrop {
      background: rgba(0, 0, 0, 0.6);
    }
  `,
]);

const Body = tw.div`p-[22px]`;

const Title = tw.h2`m-0 mb-[10px] text-lg font-semibold text-white`;

const Text = tw.p`m-0 mb-[16px] text-sm leading-relaxed`;

const Buttons = tw.div`flex flex-row flex-wrap gap-[10px]`;

const Button = styled.button(({ isPrimary = false }: { isPrimary?: boolean }) => [
  tw`min-h-[40px] px-[16px] text-sm font-semibold cursor-pointer rounded-[2px] border-[1px] border-solid border-[#c4d2ff]`,
  isPrimary ? tw`text-[#0b1020] bg-[#c4d2ff]` : tw`text-[#c4d2ff] bg-transparent`,
  focusRing("#ffffff", 2),
]);

// Where a pilot link from another device lands: the pilot read from the link's fragment and summed up, then written as
// this device's own once the visitor agrees. Closing it, either way, takes the pilot out of the address bar.
export const PilotArrival: FC<PilotArrivalProps> = ({ copy }: PilotArrivalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [stage, setStage] = useState<Stage>("reading");
  const [arrival, setArrival] = useState<{ profile: PilotProfile; summary: { level: number; ship: number } } | null>(null);
  const laterRef = useRef<HTMLButtonElement>(null);
  const isShown = isOpen && stage !== "reading";
  const onBackdrop = useModalDialog(dialogRef, isShown);

  // The dialog opens on its first button; focus starts instead on the choice that changes nothing.
  useEffect(() => {
    if (isShown && stage === "ready") {
      laterRef.current?.focus();
    }
  }, [isShown, stage]);

  useEffect(() => {
    void import("@/services/voyage/pilot")
      .then(async ({ readPilotLink, summarisePilot }) => {
        const profile = await readPilotLink(window.location.hash);

        setArrival(profile ? { profile, summary: summarisePilot(profile) } : null);
        setStage(profile ? "ready" : "invalid");
      })
      .catch(() => setStage("invalid"));
  }, []);

  const close = () => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    // replaceState fires no event, so every reader of the hash is told directly.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setIsOpen(false);
  };

  const bring = async () => {
    if (!arrival) {
      return;
    }

    try {
      const { landPilot } = await import("@/services/voyage/pilot");

      setStage(await landPilot(arrival.profile) ? "moved" : "failed");
    } catch {
      setStage("failed");
    }
  };

  const text = {
    reading: "",
    ready: arrival ? fill(copy.arrival.text, { level: arrival.summary.level, ship: arrival.summary.ship }) : "",
    invalid: copy.arrival.invalid,
    moved: copy.arrival.moved,
    failed: copy.arrival.failed,
  }[stage];

  return (
    <Dialog ref={dialogRef} aria-labelledby="pilot-arrival-title" onClose={close} onClick={onBackdrop}>
      <Body>
        <Title id="pilot-arrival-title">{copy.arrival.title}</Title>
        <Text role="status">{text}</Text>
        <Buttons>
          {stage === "ready" && (
            <>
              <Button type="button" isPrimary onClick={() => void bring()}>{copy.arrival.bring}</Button>
              <Button ref={laterRef} type="button" onClick={close}>{copy.arrival.later}</Button>
            </>
          )}
          {stage === "failed" && <Button type="button" isPrimary onClick={() => void bring()}>{copy.arrival.bring}</Button>}
          {stage !== "ready" && stage !== "reading" && <Button type="button" onClick={close}>{copy.arrival.done}</Button>}
        </Buttons>
      </Body>
    </Dialog>
  );
};
