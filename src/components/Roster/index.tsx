import { FC, useMemo, useRef, useState } from "react";

import tw from "twin.macro";

import { Carousel } from "@/components/Carousel";
import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Panel } from "@/components/Panel";
import { CharacterCard } from "@/components/Roster/CharacterCard";
import { Anchor, Section } from "@/components/Section";
import { LazyTerminalDialog } from "@/components/Terminal/LazyTerminalDialog";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import useInView from "@/hooks/useInView";
import { scrollBehavior } from "@/packages/accessibility/motion";
import { scrollToElement } from "@/packages/interaction/scroll-frame";
import { TerminalDialog as TerminalDialogContent } from "@/packages/interaction/terminal";
import { createRosterLevels } from "@/services/roster";
import { CarouselLabels } from "@/types/carousel";
import { Roster as RosterContent } from "@/types/roster";
import { SectionIntros } from "@/types/sections-intros";

interface RosterProps extends RosterContent {
  intro: SectionIntros;
  // The card each role opens, by class name: level, abilities, what people say and how to reach me.
  hireDialogs: Record<string, TerminalDialogContent>;
  carouselLabels: CarouselLabels;
  closeLabel: string;
}

const Cards = tw.div`mt-[10px]`;

const goTo = (target: string) => {
  const element = document.getElementById(target);

  if (element) {
    scrollToElement(element, scrollBehavior());
  }
};

// The roles I have held as an MMO party, two at a time, and the reader's character select. Level is
// computed from real dates, never typed in by hand. Picking a character also opens its card, with every
// way to get in touch.
export const Roster: FC<RosterProps> = ({ intro, asOf, labels, characters, hireDialogs, carouselLabels, closeLabel }: RosterProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const isRevealed = useInView(gridRef, { threshold: 0.15 });
  const levels = useMemo(() => createRosterLevels({ asOf }), [asOf]);
  const { characterClass, selectCharacter } = useGameStateHook();
  const { settings } = useLensStateHook();
  const [dialog, setDialog] = useState<TerminalDialogContent | null>(null);

  const choose = (chosen: string) => {
    if (settings.gameLayer) {
      selectCharacter(chosen);
    }

    setDialog(hireDialogs[chosen] ?? null);
  };

  return (
    <Section id={SECTION_IDS.roster}>
      <Anchor id={ROLE_ANCHORS.leadership} aria-hidden="true" />
      <SectionText intro={intro} />
      <Panel>
        <Cards ref={gridRef}>
          <Carousel
            items={characters}
            getKey={(character) => character.characterClass}
            label={intro.title}
            labels={carouselLabels}
            renderItem={(character, order) => (
              <CharacterCard
                {...character}
                level={levels.level(character)}
                since={levels.since(character)}
                labels={labels}
                isRevealed={isRevealed}
                order={order}
                isSelected={settings.gameLayer && character.characterClass === characterClass}
                isGameLayer={settings.gameLayer}
                onSelect={choose}
              />
            )}
          />
        </Cards>
      </Panel>
      {dialog && <LazyTerminalDialog dialog={dialog} closeLabel={closeLabel} onClose={() => setDialog(null)} onNavigate={goTo} />}
    </Section>
  );
};
