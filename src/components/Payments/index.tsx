import { FC, useCallback, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import dynamic from "next/dynamic";

import { BlueprintSection } from "@/components/Blueprint";
import { NEAR_MARGIN } from "@/components/Blueprint/config";
import { ActionLink } from "@/components/Controls";
import { Anchor, Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { AUDIENCE_ANCHORS, PAYMENT_CASES_ANCHOR, SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { media } from "@/styles/mixins";
import { BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { PaymentsContent } from "@/types/payments";
import { SectionIntros } from "@/types/sections-intros";

interface PaymentsProps {
  intro: SectionIntros;
  content: PaymentsContent;
  // Which drawings this section shows, fetched as it nears the screen.
  blueprintSection: BlueprintSectionId;
}

// The terminal and its marks load with the drawings, once the section is within a screen of view.
const PayTerminal = dynamic(() => import("@/components/Payments/PayTerminal").then((module) => module.PayTerminal), { ssr: false });

// Room held for the terminal before it arrives, so the page below barely moves when it does: stacked on
// phones and tablets, side by side on wide screens.
const TerminalSlot = styled.div(() => [
  tw`mt-[25px] lg:mt-[35px]`,
  css`
    min-height: 520px;

    ${media.md} {
      min-height: 440px;
    }

    ${media.xl} {
      min-height: 300px;
    }
  `,
]);

const Drawings = tw.div`mt-[22px]`;

const Foot = tw.div`mt-[22px] flex flex-row flex-wrap`;

// Payments from the till to the bank: a terminal the reader pays at, and the drawings it opens one by one.
// Every word is in the intro and the content; the drawings are the payments blueprints.
export const Payments: FC<PaymentsProps> = ({ intro, content, blueprintSection }: PaymentsProps) => {
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
        <BlueprintSection section={blueprintSection} advance={payments} />
      </Drawings>
      <Foot>
        <ActionLink isPrimary={false} href={`#${PAYMENT_CASES_ANCHOR}`}>{content.caseStudies}</ActionLink>
      </Foot>
    </Section>
  );
};
