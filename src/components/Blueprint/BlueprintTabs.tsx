import { FC, useCallback, useLayoutEffect, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { Blueprint } from "@/components/Blueprint/Blueprint";
import { BLEED } from "@/components/Blueprint/config";
import { renderPaymentLayer } from "@/components/Payments/scene/lazyLayer";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { Tab, TabList } from "@/components/Tabs";
import useTabs from "@/hooks/useTabs";
import { media } from "@/styles/mixins";
import { Blueprint as BlueprintContent, BlueprintLabels } from "@/types/blueprints";

interface BlueprintTabsProps {
  blueprints: BlueprintContent[];
  labels: BlueprintLabels;
  // Each change opens the next drawing, wrapping round, as a press of its tab would.
  advance?: number;
}

const Showcase = styled.div(() => [
  tw`flex flex-col gap-[14px]`,
  css`
    ${media.lg} {
      margin-left: ${BLEED};
      margin-right: ${BLEED};
    }
  `,
]);

// Several blueprints become a showcase: one tab each, and an animated switch between them, so a section
// shows one system at a time instead of a long stack.
export const BlueprintTabs: FC<BlueprintTabsProps> = ({ blueprints, labels, advance }: BlueprintTabsProps) => {
  const switcher = useSwitch();
  const { play } = switcher;
  // The drawing's own universe decides the switch, so it matches the look of the boxes; a payments drawing
  // opens with its own subject instead.
  const onSelect = useCallback((next: number, previous: number) => {
    play(next > previous ? 1 : -1, blueprints[next].zone, blueprints[next].motion);
  }, [blueprints, play]);
  const { active, select, listProps, tabProps, panelProps } = useTabs({ count: blueprints.length, onSelect });
  const current = blueprints[active];
  const advanced = useRef(advance);

  // Before paint, so the next drawing never shows a frame without its switch.
  useLayoutEffect(() => {
    if (advance !== advanced.current) {
      advanced.current = advance;
      select((active + 1) % blueprints.length);
    }
  }, [advance, active, blueprints.length, select]);

  return (
    <Showcase>
      <TabList {...listProps} layout="wrap" aria-label={labels.showcase} data-scroll-x>
        {blueprints.map((blueprint, index) => (
          <Tab key={blueprint.id} {...tabProps(index)} aria-controls={index === active ? tabProps(index)["aria-controls"] : undefined} isOn={index === active}>
            {blueprint.tab ?? blueprint.title}
          </Tab>
        ))}
      </TabList>
      <SwitchStage switcher={switcher} paymentLayer={renderPaymentLayer} {...panelProps(active)}>
        <Blueprint key={current.id} {...current} labels={labels} isBleed={false} isEager={switcher.count > 0} />
      </SwitchStage>
    </Showcase>
  );
};
