import { forwardRef } from "react";

import tw, { css, styled } from "twin.macro";

import { DomainCapability } from "@/types/domains";

export const SUITS = [
  { glyph: "♠", isRed: false },
  { glyph: "♥", isRed: true },
  { glyph: "♣", isRed: false },
  { glyph: "♦", isRed: true },
];

export const suitOf = (index: number) => SUITS[index % SUITS.length];

const Face = styled.div(() => [
  tw`relative flex flex-col gap-[8px] h-full p-[18px] pt-[34px] rounded-[10px] text-[#1a1a1a] bg-[#f4efe6]`,
  css`
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  `,
]);

export const Corner = styled.span(({ isRed }: { isRed: boolean }) => [
  tw`absolute top-[10px] left-[14px] text-lg leading-none`,
  isRed ? tw`text-[#d6264f]` : tw`text-[#1a1a1a]`,
]);

export const CornerBottom = styled(Corner)(() => [
  tw`top-auto left-auto bottom-[10px] right-[14px]`,
  css`
    transform: rotate(180deg);
  `,
]);

const Name = tw.h3`m-0 text-base font-bold text-[#1a1a1a]`;

const Detail = tw.p`m-0 text-sm text-[#3a3a3a] break-words`;

const Places = tw.p`m-0 mt-auto pr-[24px] text-xs font-semibold text-[#6b5a3a]`;

const CardLink = tw.a`self-start text-xs font-semibold text-[#d6264f] underline`;

interface PlayingCardProps {
  card: DomainCapability;
  suitIndex: number;
}

// A capability as a playing card, face up: what it is, the detail and where it was dealt.
export const PlayingCard = forwardRef<HTMLDivElement, PlayingCardProps>(({ card, suitIndex }, ref) => {
  const suit = suitOf(suitIndex);

  return (
    <Face ref={ref}>
      <Corner isRed={suit.isRed} aria-hidden="true">{suit.glyph}</Corner>
      <Name>{card.name}</Name>
      <Detail>{card.detail}</Detail>
      {card.link && <CardLink href={card.link.url} target="_blank" rel="noopener noreferrer">{card.link.label}</CardLink>}
      <Places>{card.places.join(", ")}</Places>
      <CornerBottom isRed={suit.isRed} aria-hidden="true">{suit.glyph}</CornerBottom>
    </Face>
  );
});

PlayingCard.displayName = "PlayingCard";
