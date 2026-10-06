import { FC, useEffect, useId, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Architecture } from "@/components/Blueprint/Architecture";
import { Wireframe } from "@/components/Blueprint/Wireframe";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Lens } from "@/config/lenses";
import useInView from "@/hooks/useInView";
import { Blueprint as BlueprintContent, BlueprintLabels } from "@/types/blueprints";

interface BlueprintProps extends BlueprintContent {
  labels: BlueprintLabels;
}

type View = "architecture" | "wireframe";

const Figure = tw.figure`m-0 flex flex-col gap-[16px] p-[18px] md:p-[24px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Head = tw.div`flex flex-col gap-[6px]`;

const Title = tw.h3`m-0 text-base md:text-lg font-semibold text-white`;

const Caption = tw.figcaption`text-sm text-[#999] max-w-[70ch]`;

const Toggles = tw.div`flex flex-row flex-wrap gap-[8px]`;

const Toggle = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`h-[32px] px-[12px] cursor-pointer text-xs font-semibold rounded-[2px] border-[1px] border-solid`,
  isOn ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[var(--accent)] bg-transparent border-[var(--accent-muted)]`,
  css`
    transition: filter 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
      border-color: var(--accent);
    }
  `,
]);

const Body = styled.div(() => [
  tw`pt-[4px]`,
  css`
    &[hidden] {
      display: none;
    }
  `,
]);

// Which drawing each reader sees first. Engineers open on the architecture, product readers on the
// wireframe where there is one, and recruiters get the title and caption with both a click away.
const defaultView = (lens: Lens, hasWireframe: boolean): View | null => {
  if (lens === "engineer") {
    return "architecture";
  }

  return lens === "product" && hasWireframe ? "wireframe" : null;
};

// One system drawn two ways: how it is built, and what a user moves through. Both stay in the page for
// every reader; only which one is open changes with the view.
export const Blueprint: FC<BlueprintProps> = ({ zone, title, caption, architecture, wireframe, labels }: BlueprintProps) => {
  const { lens, settings } = useLensStateHook();
  const [view, setView] = useState<View | null>(() => defaultView(lens, Boolean(wireframe)));
  const figureRef = useRef<HTMLElement>(null);
  const isOnScreen = useInView(figureRef, { once: false, threshold: 0 });
  const bodyId = useId();

  useEffect(() => {
    setView(defaultView(lens, Boolean(wireframe)));
  }, [lens, wireframe]);

  const toggle = (next: View) => setView((current) => (current === next ? null : next));

  return (
    <Figure ref={figureRef}>
      <Head>
        <Title>{title}</Title>
        <Caption>{caption}</Caption>
      </Head>
      <Toggles>
        <Toggle type="button" isOn={view === "architecture"} aria-pressed={view === "architecture"} aria-controls={bodyId} onClick={() => toggle("architecture")}>
          {labels.architecture}
        </Toggle>
        {wireframe && (
          <Toggle type="button" isOn={view === "wireframe"} aria-pressed={view === "wireframe"} aria-controls={bodyId} onClick={() => toggle("wireframe")}>
            {labels.productFlow}
          </Toggle>
        )}
      </Toggles>
      <Body id={bodyId} hidden={view === null}>
        {view === "architecture" && (
          <Architecture {...architecture} zone={zone} isShown={isOnScreen} isMoving={isOnScreen && settings.backdrop === "animated"} />
        )}
        {view === "wireframe" && wireframe && <Wireframe {...wireframe} labels={labels} />}
      </Body>
    </Figure>
  );
};

const List = tw.div`flex flex-col gap-[22px] lg:gap-[30px]`;

interface BlueprintListProps {
  blueprints: BlueprintContent[];
  labels: BlueprintLabels;
}

export const BlueprintList: FC<BlueprintListProps> = ({ blueprints, labels }: BlueprintListProps) => (
  <List>
    {blueprints.map((blueprint) => <Blueprint key={blueprint.id} {...blueprint} labels={labels} />)}
  </List>
);
