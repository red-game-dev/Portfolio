import { CSSProperties, FC, KeyboardEvent, useId, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Blueprint } from "@/components/Blueprint/Blueprint";
import { BLEED } from "@/components/Blueprint/config";
import { Stage, SwitchEffect, SwitchOverlay, ZONE_EFFECTS } from "@/components/Blueprint/switchEffects";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
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
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasSwitched, setHasSwitched] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const current = blueprints[active];

  const open = (index: number) => {
    if (index === active) {
      return;
    }

    setDirection(index > active ? 1 : -1);
    setActive(index);
    setHasSwitched(true);
  };

  // Arrows step through the tabs and wrap; Home and End jump to the first and last, as a tablist does.
  const targetOf = (key: string): number | null => {
    const last = blueprints.length - 1;

    switch (key) {
      case "ArrowRight":
        return active === last ? 0 : active + 1;
      case "ArrowLeft":
        return active === 0 ? last : active - 1;
      case "Home":
        return 0;
      case "End":
        return last;
      default:
        return null;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = targetOf(event.key);

    if (next === null) {
      return;
    }

    event.preventDefault();
    // The dialog around a venture's drawing also listens for arrows, to travel between regions.
    event.stopPropagation();
    open(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };

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
      <TabList ref={tabsRef} role="tablist" aria-label={labels.showcase} data-scroll-x>
        {blueprints.map((blueprint, index) => (
          <Tab
            key={blueprint.id}
            id={`${baseId}-tab-${index}`}
            type="button"
            role="tab"
            isOn={index === active}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => open(index)}
            onKeyDown={onKeyDown}
          >
            {blueprint.tab ?? blueprint.title}
          </Tab>
        ))}
      </TabList>
      <Stage
        key={current.id}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        effect={effect}
        style={stageStyle}
      >
        {effect && <SwitchOverlay effect={effect} />}
        <Blueprint {...current} labels={labels} isBleed={false} isEager={hasSwitched} />
      </Stage>
    </Showcase>
  );
};
