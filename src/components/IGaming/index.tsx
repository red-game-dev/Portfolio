import { FC, useRef } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { Panel } from "@/components/Panel";
import { Text } from "@/components/Text";
import { SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { IGamingContent } from "@/types/domains";
import { SectionIntros } from "@/types/sections-intros";

interface IGamingProps {
  intro: SectionIntros;
  content: IGamingContent;
}

interface DealtProps {
  isDealt: boolean;
}

const SUITS = [
  { glyph: "♠", isRed: false },
  { glyph: "♥", isRed: true },
  { glyph: "♣", isRed: false },
  { glyph: "♦", isRed: true },
];
const DEAL_STAGGER_MS = 110;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
`;

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// The table: a felt glow under the cards and a rim in the zone's colour.
const Table = styled(Panel)(() => [
  css`
    background: radial-gradient(ellipse at 50% 0%, rgba(28, 120, 78, 0.32), #0d0d0d 72%), #0d0d0d;
    border-color: var(--accent-muted);
  `,
]);

const Header = tw.div`flex flex-row flex-wrap items-center justify-between gap-[12px] mb-[20px]`;

const Statement = tw.p`m-0 text-base md:text-lg text-white max-w-[60ch]`;

const Live = tw.span`inline-flex flex-row items-center gap-[8px] text-xs font-semibold text-white py-[6px] px-[10px] rounded-full
bg-[rgba(16, 16, 16, 0.7)] border-[1px] border-solid border-[var(--accent-muted)]`;

const Dot = styled.span(() => [
  tw`w-[8px] h-[8px] rounded-full bg-[#ff4d4d]`,
  css`
    animation: ${blink} 1.4s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
]);

const Cards = tw.ul`list-none m-0 p-0 grid gap-[14px] sm:grid-cols-2 lg:grid-cols-3`;

// Cards fly in from the shoe at the top right, one after another, once the table is on screen.
const Card = styled.li(({ isDealt }: DealtProps) => [
  tw`relative flex flex-col gap-[8px] p-[18px] pt-[34px] rounded-[10px] text-[#1a1a1a] bg-[#f4efe6]`,
  css`
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    transform: ${isDealt ? "none" : "translate(70%, -60%) rotate(14deg)"};
    opacity: ${isDealt ? 1 : 0};
    transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.3s ease;

    @media (prefers-reduced-motion: reduce) {
      transform: none;
      opacity: 1;
      transition: none;
    }
  `,
]);

const Corner = styled.span(({ isRed }: { isRed: boolean }) => [
  tw`absolute top-[10px] left-[14px] text-lg leading-none`,
  isRed ? tw`text-[#d6264f]` : tw`text-[#1a1a1a]`,
]);

const CornerBottom = styled(Corner)(() => [
  tw`top-auto left-auto bottom-[10px] right-[14px]`,
  css`
    transform: rotate(180deg);
  `,
]);

const Name = tw.h3`m-0 text-base font-bold text-[#1a1a1a]`;

const Detail = tw.p`m-0 text-sm text-[#3a3a3a] break-words`;

const Places = tw.p`m-0 mt-auto pr-[24px] text-xs font-semibold text-[#6b5a3a]`;

const CardLink = tw.a`self-start text-xs font-semibold text-[#d6264f] underline`;

const Footer = tw.div`flex flex-col gap-[14px] mt-[24px]`;

const Proof = tw.div`flex flex-row flex-wrap items-center gap-[8px] text-sm text-[#999]`;

const ProofItem = tw.span`text-xs leading-none text-white bg-[#1d1d1d] rounded-[2px] py-[6px] px-[8px] border-[1px] border-solid border-[#2a2a2a]`;

const Quote = styled.blockquote(() => [
  tw`m-0 pl-[14px] text-sm italic text-[#ddd] max-w-[70ch]`,
  css`
    border-left: 2px solid var(--accent);
  `,
]);

const QuoteSource = tw.cite`block mt-[6px] text-xs not-italic text-[#999]`;

// iGaming as a live table: each capability is a card dealt onto the felt.
export const IGaming: FC<IGamingProps> = ({ intro, content }: IGamingProps) => {
  const cardsRef = useRef<HTMLUListElement>(null);
  const isDealt = useInView(cardsRef, { threshold: 0.2 });

  return (
    <Section id={SECTION_IDS.igaming}>
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Table>
        <Header>
          <Statement>{content.statement}</Statement>
          <Live>
            <Dot aria-hidden="true" />
            {content.liveLabel}
          </Live>
        </Header>
        <Cards ref={cardsRef}>
          {content.cards.map((card, index) => {
            const suit = SUITS[index % SUITS.length];

            return (
              <Card key={card.name} isDealt={isDealt} style={{ transitionDelay: `${index * DEAL_STAGGER_MS}ms` }}>
                <Corner isRed={suit.isRed} aria-hidden="true">{suit.glyph}</Corner>
                <Name>{card.name}</Name>
                <Detail>{card.detail}</Detail>
                {card.link && (
                  <CardLink href={card.link.url} target="_blank" rel="noopener noreferrer">{card.link.label}</CardLink>
                )}
                <Places>{card.places.join(", ")}</Places>
                <CornerBottom isRed={suit.isRed} aria-hidden="true">{suit.glyph}</CornerBottom>
              </Card>
            );
          })}
        </Cards>
        <Footer>
          <Proof>
            <span>{content.proofLabel}</span>
            {content.proof.map((place) => (
              <ProofItem key={place}>{place}</ProofItem>
            ))}
          </Proof>
          <Quote>
            {content.quote.text}
            <QuoteSource>{content.quote.source}</QuoteSource>
          </Quote>
        </Footer>
      </Table>
    </Section>
  );
};
