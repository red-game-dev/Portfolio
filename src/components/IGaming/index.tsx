import { FC, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { BlueprintSection } from "@/components/Blueprint";
import { PlayingCard } from "@/components/IGaming/PlayingCard";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import { Panel } from "@/components/Panel";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { BlueprintLabels, BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { IGamingContent } from "@/types/domains";
import { SectionIntros } from "@/types/sections-intros";

interface IGamingProps {
  intro: SectionIntros;
  content: IGamingContent;
  // Which drawings this section shows, fetched as it nears the screen.
  blueprintSection: BlueprintSectionId;
  blueprintLabels: BlueprintLabels;
}

interface DealtProps {
  isDealt: boolean;
}

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

const Blueprints = tw.div`mt-[25px] lg:mt-[35px]`;

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
  tw`relative`,
  css`
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

type LiveTableComponent = typeof import("@/components/IGaming/LiveTable").LiveTable;

// The game and its engine are their own chunk, fetched only for views with the game layer. Until it
// arrives, and in the quick view, the cards are dealt out plainly, which is also what the server renders.
const useLiveTableCode = (isWanted: boolean) => {
  const [component, setComponent] = useState<LiveTableComponent | null>(null);

  useEffect(() => {
    if (!isWanted || component) {
      return;
    }

    let isCurrent = true;

    import("@/components/IGaming/LiveTable")
      .then((module) => isCurrent && setComponent(() => module.LiveTable))
      // console.error is the one console call the production build keeps; the plain cards stay.
      // eslint-disable-next-line no-console
      .catch((error: unknown) => console.error("The live table could not be loaded", error));

    return () => {
      isCurrent = false;
    };
  }, [component, isWanted]);

  return component;
};

// iGaming as a live table: each capability is a card, played from your hand onto the felt.
export const IGaming: FC<IGamingProps> = ({ intro, content, blueprintSection, blueprintLabels }: IGamingProps) => {
  const cardsRef = useRef<HTMLUListElement>(null);
  const isDealt = useInView(cardsRef, { threshold: 0.2 });
  // With the game layer the cards are played at a live table; the quick view deals them straight out.
  const { settings } = useLensStateHook();
  // The first client render is always the full view, before the chosen one is read, so the game is only
  // fetched once the view has settled.
  const { status } = useLensStatusHook();
  const LiveTable = useLiveTableCode(status === "chosen" && settings.gameLayer);

  return (
    <Section id={SECTION_IDS.igaming}>
      <SectionText intro={intro} />
      <Table>
        <Header>
          <Statement>{content.statement}</Statement>
          <Live>
            <Dot aria-hidden="true" />
            {content.liveLabel}
          </Live>
        </Header>
        {settings.gameLayer && LiveTable ? <LiveTable cards={content.cards} content={content.table} /> : (
          <Cards ref={cardsRef}>
            {content.cards.map((card, index) => (
              <Card key={card.name} isDealt={isDealt} style={{ transitionDelay: `${index * DEAL_STAGGER_MS}ms` }}>
                <PlayingCard card={card} suitIndex={index} />
              </Card>
            ))}
          </Cards>
        )}
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
      <Blueprints>
        <BlueprintSection section={blueprintSection} labels={blueprintLabels} />
      </Blueprints>
    </Section>
  );
};
