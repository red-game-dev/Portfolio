import { FC, useMemo, useRef } from "react";

import tw from "twin.macro";

import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Panel } from "@/components/Panel";
import { CharacterCard } from "@/components/Roster/CharacterCard";
import { Text } from "@/components/Text";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { TenureCalculator } from "@/packages/insights/career";
import { Roster as RosterContent } from "@/types/roster";
import { SectionIntros } from "@/types/sections-intros";

interface RosterProps extends RosterContent {
  intro: SectionIntros;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for the "Technical leadership" link on the first screen.
const Anchor = tw.span`absolute top-0 left-0`;

const Cards = tw.div`grid gap-[18px] md:grid-cols-2 mt-[10px]`;

// The roles I have held as an MMO party, and the reader's character select. Level is computed from real
// dates, never typed in by hand.
export const Roster: FC<RosterProps> = ({ intro, asOf, labels, characters }: RosterProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isRevealed = useInView(gridRef, { threshold: 0.15 });
  const calculator = useMemo(() => new TenureCalculator(asOf), [asOf]);
  const { characterClass, selectCharacter } = useGameStateHook();
  const { settings } = useLensStateHook();

  return (
    <Section id={SECTION_IDS.roster}>
      <Anchor id={ROLE_ANCHORS.leadership} aria-hidden="true" />
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Panel>
        <Cards ref={gridRef}>
          {characters.map((character, index) => (
            <CharacterCard
              key={character.characterClass}
              {...character}
              level={Math.max(1, calculator.years(character.tenures))}
              since={calculator.since(character.tenures)}
              labels={labels}
              isRevealed={isRevealed}
              order={index}
              isSelected={settings.gameLayer && character.characterClass === characterClass}
              isSelectable={settings.gameLayer}
              onSelect={selectCharacter}
            />
          ))}
        </Cards>
      </Panel>
    </Section>
  );
};
