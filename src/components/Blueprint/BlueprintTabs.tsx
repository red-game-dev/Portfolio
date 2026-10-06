import { FC, useCallback } from "react";

import tw, { css, styled } from "twin.macro";

import { Blueprint } from "@/components/Blueprint/Blueprint";
import { BLEED } from "@/components/Blueprint/config";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { Tab, TabList } from "@/components/Tabs";
import useTabs from "@/hooks/useTabs";
import { Blueprint as BlueprintContent, BlueprintLabels } from "@/types/blueprints";

interface BlueprintTabsProps {
  blueprints: BlueprintContent[];
  labels: BlueprintLabels;
}

const Showcase = styled.div(() => [
  tw`flex flex-col gap-[14px]`,
  css`
    @media (min-width: 1024px) {
      margin-left: ${BLEED};
      margin-right: ${BLEED};
    }
  `,
]);

// Several blueprints become a showcase: one tab each, and an animated switch between them, so a section
// shows one system at a time instead of a long stack.
export const BlueprintTabs: FC<BlueprintTabsProps> = ({ blueprints, labels }: BlueprintTabsProps) => {
  const switcher = useSwitch();
  const { play } = switcher;
  // The drawing's own universe decides the switch, so it matches the look of the boxes.
  const onSelect = useCallback((next: number, previous: number) => play(next > previous ? 1 : -1, blueprints[next].zone), [blueprints, play]);
  const { active, listProps, tabProps, panelProps } = useTabs({ count: blueprints.length, onSelect });
  const current = blueprints[active];

  return (
    <Showcase>
      <TabList {...listProps} aria-label={labels.showcase} data-scroll-x>
        {blueprints.map((blueprint, index) => (
          <Tab key={blueprint.id} {...tabProps(index)} isOn={index === active}>
            {blueprint.tab ?? blueprint.title}
          </Tab>
        ))}
      </TabList>
      <SwitchStage switcher={switcher} {...panelProps(active)}>
        <Blueprint key={current.id} {...current} labels={labels} isBleed={false} isEager={switcher.count > 0} />
      </SwitchStage>
    </Showcase>
  );
};
