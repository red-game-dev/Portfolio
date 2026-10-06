import { CSSProperties, FC, useCallback, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Blueprint } from "@/components/Blueprint/Blueprint";
import { BLEED } from "@/components/Blueprint/config";
import { Stage, SwitchEffect, SwitchOverlay, ZONE_EFFECTS } from "@/components/Blueprint/switchEffects";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
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

const TabList = styled.div(() => [
  tw`flex flex-row gap-[6px] overflow-x-auto pb-[4px]`,
  css`
    scrollbar-width: thin;
  `,
]);

const Tab = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`relative flex-shrink-0 h-[36px] px-[14px] cursor-pointer text-xs md:text-sm font-semibold whitespace-nowrap rounded-[2px]
     border-[1px] border-solid`,
  isOn ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[#ccc] bg-[#0d0d0d] border-[#262626]`,
  css`
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--accent);
      color: ${isOn ? "#101010" : "#fff"};
    }
  `,
]);

// Several blueprints become a showcase: one tab each, and an animated switch between them, so a section
// shows one system at a time instead of a long stack.
export const BlueprintTabs: FC<BlueprintTabsProps> = ({ blueprints, labels }: BlueprintTabsProps) => {
  const { settings } = useLensStateHook();
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasSwitched, setHasSwitched] = useState(false);
  const onSelect = useCallback((next: number, previous: number) => {
    setDirection(next > previous ? 1 : -1);
    setHasSwitched(true);
  }, []);
  const { active, listProps, tabProps, panelProps } = useTabs({ count: blueprints.length, onSelect });
  const current = blueprints[active];

  const effect: SwitchEffect | null = !hasSwitched ? null : settings.transitions === "none" ? "fade" : ZONE_EFFECTS[current.zone];
  const stageStyle = {
    "--from-left": direction === 1 ? "0" : "100%",
    "--from-right": direction === 1 ? "100%" : "0",
    "--beam-from": direction === 1 ? "0" : "calc(100cqw - 3px)",
    "--beam-to": direction === 1 ? "calc(100cqw - 3px)" : "0",
    "containerType": "inline-size",
  } as CSSProperties;

  return (
    <Showcase>
      <TabList {...listProps} aria-label={labels.showcase} data-scroll-x>
        {blueprints.map((blueprint, index) => (
          <Tab key={blueprint.id} {...tabProps(index)} isOn={index === active}>
            {blueprint.tab ?? blueprint.title}
          </Tab>
        ))}
      </TabList>
      <Stage key={current.id} {...panelProps(active)} effect={effect} style={stageStyle}>
        {effect && <SwitchOverlay effect={effect} />}
        <Blueprint {...current} labels={labels} isBleed={false} isEager={hasSwitched} />
      </Stage>
    </Showcase>
  );
};
