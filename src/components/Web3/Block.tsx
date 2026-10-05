import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import useInView from "@/hooks/useInView";
import { DomainCapability } from "@/types/domains";
import { Web3Content } from "@/types/domains";

interface BlockProps extends DomainCapability {
  height: number;
  hash: string;
  previousHash: string;
  labels: Pick<Web3Content, "blockLabel" | "previousLabel" | "pendingLabel" | "confirmedLabel">;
}

interface ConfirmedProps {
  isConfirmed: boolean;
}

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const Card = styled.li(({ isConfirmed }: ConfirmedProps) => [
  tw`relative flex flex-col gap-[10px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    border-left: 3px solid ${isConfirmed ? "var(--accent)" : "#2a2a2a"};
    transition: border-color 0.5s ease, box-shadow 0.5s ease;
    box-shadow: ${isConfirmed ? "0 0 22px rgba(var(--accent-rgb), 0.1)" : "none"};
  `,
]);

const Header = tw.div`flex flex-row flex-wrap items-center justify-between gap-[8px]`;

const Height = tw.span`text-xs font-semibold text-[#ccc]`;

const Status = styled.span(({ isConfirmed }: ConfirmedProps) => [
  tw`text-xs font-semibold leading-none py-[5px] px-[9px] rounded-full border-[1px] border-solid`,
  css`
    transition: color 0.4s ease, border-color 0.4s ease, background-color 0.4s ease;
  `,
  isConfirmed ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[#999] border-[#3a3a3a]`,
]);

const Hashes = styled.div(() => [
  tw`flex flex-row flex-wrap gap-x-[14px] gap-y-[2px] text-[11px] text-[#8a8a8a]`,
  css`
    font-family: ${MONO};
  `,
]);

const Name = tw.h3`m-0 text-base md:text-lg font-semibold text-white`;

const Detail = tw.p`m-0 text-sm text-[#bbb] break-words`;

const Places = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const Place = tw.li`text-xs leading-none text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[6px] px-[10px] border-[1px] border-solid
border-[var(--accent-muted)]`;

// A capability as a block: its height in the chain, its hash and the previous block's, and a status that
// confirms once the reader reaches it.
export const Block: FC<BlockProps> = ({ name, detail, places, height, hash, previousHash, labels }: BlockProps) => {
  const cardRef = useRef<HTMLLIElement>(null);
  const isConfirmed = useInView(cardRef, { threshold: 0.6 });

  return (
    <Card ref={cardRef} isConfirmed={isConfirmed}>
      <Header>
        <Height>{`${labels.blockLabel} #${String(height).padStart(4, "0")}`}</Height>
        <Status isConfirmed={isConfirmed}>{isConfirmed ? labels.confirmedLabel : labels.pendingLabel}</Status>
      </Header>
      <Hashes aria-hidden="true">
        <span>{hash}</span>
        <span>{`${labels.previousLabel} ${previousHash}`}</span>
      </Hashes>
      <Name>{name}</Name>
      <Detail>{detail.replace(/\s+/g, " ").trim()}</Detail>
      {places.length > 0 && (
        <Places>
          {places.map((place) => (
            <Place key={place}>{place}</Place>
          ))}
        </Places>
      )}
    </Card>
  );
};
