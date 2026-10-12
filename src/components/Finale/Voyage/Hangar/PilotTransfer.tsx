import { ChangeEvent, FC, useEffect, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Actions, Note, SmallButton, Subheading } from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import type { PilotTransfer as Transfer } from "@/components/Finale/Voyage/hooks/useVoyage";
import { saveBlob } from "@/packages/browser/files";
import type { PilotProfile } from "@/packages/games/voyage";
import { fill, utcDay } from "@/packages/text/format";
import { focusRing } from "@/styles/mixins";
import { PilotTransferContent } from "@/types/game";

interface PilotTransferProps {
  copy: PilotTransferContent;
  transfer: Transfer;
  // Taking a pilot on waits for the run to end, as the reset does.
  isFlying: boolean;
}

// The longest link drawn as a QR code: past it the code grows too dense to scan from a screen.
const QR_LIMIT = 1800;

const Section = tw.section`flex flex-col gap-[10px] mt-[22px] pt-[18px] border-0 border-t-[1px] border-solid border-[rgba(196, 210, 255, 0.15)]`;

const Code = styled.svg(() => [
  tw`block w-full max-w-[260px] h-auto bg-white p-[6px] rounded-[4px]`,
  css`
    image-rendering: pixelated;
  `,
]);

const FileLabel = styled.label(() => [
  tw`inline-flex items-center cursor-pointer text-xs font-semibold text-[#c4d2ff] underline`,
  focusRing("#c4d2ff", 2),
]);

const Hidden = tw.input`sr-only`;

// The QR code of a link as one path of dark squares, or null when the link is too long to scan.
const qrPath = async (text: string): Promise<{ path: string; size: number } | null> => {
  if (text.length > QR_LIMIT) {
    return null;
  }

  const { encode } = await import("uqr");
  const { data, size } = encode(text, { ecc: "L", border: 2 });
  let path = "";

  data.forEach((row, y) => row.forEach((isDark, x) => {
    if (isDark) {
      path += `M${x},${y}h1v1h-1z`;
    }
  }));

  return { path, size };
};

// Moving this pilot to another device, with no account and no server: a link carrying the pilot (as a QR code when it is
// short enough to scan), the same pilot as a file, and a pilot from a file taken on here once the pilot agrees.
export const PilotTransfer: FC<PilotTransferProps> = ({ copy, transfer, isFlying }: PilotTransferProps) => {
  const [link, setLink] = useState<string | null>(null);
  const [code, setCode] = useState<{ path: string; size: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [arriving, setArriving] = useState<{ profile: PilotProfile; summary: { level: number; ship: number } } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (link) {
      void qrPath(link).then((drawn) => isCurrent && setCode(drawn));
    }

    return () => {
      isCurrent = false;
    };
  }, [link]);

  const show = async () => setLink(await transfer.link());

  const copyLink = async () => {
    const made = link ?? await transfer.link();

    if (made) {
      await navigator.clipboard.writeText(made);
      setLink(made);
      setMessage(copy.copied);
    }
  };

  const saveFile = async () => {
    const blob = await transfer.file();

    if (blob) {
      saveBlob(blob, fill(copy.fileName, { date: utcDay(Date.now()) }));
    }
  };

  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const read = await transfer.read(file);

    setArriving(read);
    setMessage(read ? null : copy.invalid);
  };

  const bring = () => {
    if (arriving) {
      transfer.adopt(arriving.profile);
      setArriving(null);
      setMessage(copy.moved);
    }
  };

  return (
    <Section aria-label={copy.title}>
      <Subheading>{copy.title}</Subheading>
      <Note>{copy.note}</Note>
      {link && code && (
        <>
          <Code viewBox={`0 0 ${code.size} ${code.size}`} shapeRendering="crispEdges" role="img" aria-label={copy.qrLabel}>
            <path d={code.path} fill="#000" />
          </Code>
          <Note>{copy.scan}</Note>
        </>
      )}
      {link && !code && link.length > QR_LIMIT && <Note>{copy.tooBig}</Note>}
      <Actions>
        {!link && <SmallButton type="button" isPrimary onClick={() => void show()}>{copy.show}</SmallButton>}
        <SmallButton type="button" onClick={() => void copyLink()}>{copy.copy}</SmallButton>
        <SmallButton type="button" onClick={() => void saveFile()}>{copy.file}</SmallButton>
      </Actions>
      {!isFlying && (
        arriving ? (
          <Actions role="group" aria-label={copy.bring}>
            <Note>{fill(copy.confirm, { level: arriving.summary.level, ship: arriving.summary.ship })}</Note>
            <SmallButton type="button" onClick={bring}>{copy.bring}</SmallButton>
            <SmallButton type="button" isPrimary onClick={() => setArriving(null)}>{copy.keep}</SmallButton>
          </Actions>
        ) : (
          <FileLabel>
            {copy.open}
            <Hidden type="file" accept="application/json,.json" onChange={(event) => void openFile(event)} />
          </FileLabel>
        )
      )}
      {message && <Note role="status">{message}</Note>}
    </Section>
  );
};
