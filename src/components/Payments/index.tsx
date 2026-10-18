import { FC, useCallback, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import dynamic from "next/dynamic";

import { BlueprintSection } from "@/components/Blueprint";
import { NEAR_MARGIN } from "@/components/Blueprint/config";
import { ActionLink } from "@/components/Controls";
import { Panel, PanelText, PanelTitle } from "@/components/Panel";
import { Anchor, Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { PAYMENT_DRAWING_ANCHORS, PAYMENT_DRAWINGS } from "@/config/payments";
import { AUDIENCE_ANCHORS, PAYMENT_CASES_ANCHOR, SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { media, squareBullet } from "@/styles/mixins";
import { BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { PaymentsContent } from "@/types/payments";
import { SectionIntros } from "@/types/sections-intros";

interface PaymentsProps {
  intro: SectionIntros;
  content: PaymentsContent;
  // The titles of the payments case studies, which the section closes on.
  caseStudies: string[];
  // Which drawings this section shows, fetched as it nears the screen.
  blueprintSection: BlueprintSectionId;
}

// The terminal and its marks load with the drawings, once the section is within a screen of view.
const PayTerminal = dynamic(() => import("@/components/Payments/PayTerminal").then((module) => module.PayTerminal), { ssr: false });

// Room held for the counter before it arrives, so the page below barely moves when it does (measured on the preview:
// stacked on phones and tablets, the ways to pay beside it on wide screens).
const TerminalSlot = styled.div(() => [
  tw`mt-[25px] lg:mt-[35px]`,
  css`
    min-height: 780px;

    ${media.md} {
      min-height: 660px;
    }

    ${media.xl} {
      min-height: 500px;
    }
  `,
]);

const Drawings = tw.div`relative mt-[22px]`;

// Where a link to one drawing lands: the drawings' own top, kept clear of the fixed bars by the page's scroll
// padding (unlike a section's Anchor, which cancels it to land the section's own top padding there).
const DrawingAnchor = tw.span`absolute top-0 left-0`;

const Closing = tw.div`mt-[22px]`;

const Cases = tw.ul`list-none m-[0 0 18px 0] p-0 flex flex-col gap-[8px]`;

const Case = styled.li(() => [tw`relative pl-[16px] text-sm text-[#ddd]`, squareBullet({ radius: 1 })]);

// Payments from the till to the bank: a terminal the reader pays at, and the drawings it opens one by one.
// Every word is in the intro and the content; the drawings are the payments blueprints.
export const Payments: FC<PaymentsProps> = ({ intro, content, caseStudies, blueprintSection }: PaymentsProps) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const isNear = useInView(slotRef, { once: true, threshold: 0, rootMargin: NEAR_MARGIN });
  // Each payment at the terminal opens the next drawing.
  const [payments, setPayments] = useState(0);
  const onPaid = useCallback(() => setPayments((count) => count + 1), []);

  return (
    <Section id={SECTION_IDS.payments}>
      <Anchor id={AUDIENCE_ANCHORS.payments} aria-hidden="true" />
      <SectionText intro={intro} />
      <TerminalSlot ref={slotRef}>
        {isNear && <PayTerminal content={content.terminal} onPaid={onPaid} />}
      </TerminalSlot>
      <Drawings>
        {/* Where the menu's links to each drawing land; the showcase opens the one the link names. */}
        {PAYMENT_DRAWINGS.map((drawing) => <DrawingAnchor key={drawing} id={PAYMENT_DRAWING_ANCHORS[drawing]} aria-hidden="true" />)}
        <BlueprintSection section={blueprintSection} advance={payments} />
      </Drawings>
      <Closing>
        <Panel>
          <PanelTitle>{content.caseStudies.title}</PanelTitle>
          <PanelText>{content.caseStudies.description}</PanelText>
          <Cases>
            {caseStudies.map((title) => (
              <Case key={title}>{title}</Case>
            ))}
          </Cases>
          <ActionLink isPrimary={false} href={`#${PAYMENT_CASES_ANCHOR}`}>{content.caseStudies.link}</ActionLink>
        </Panel>
      </Closing>
    </Section>
  );
};
