import { FC, Fragment } from "react";

import tw, { css, styled } from "twin.macro";

import { BlueprintLabels, Wireframe as WireframeContent, WireframeRegion, WireframeScreen } from "@/types/blueprints";

interface WireframeProps extends WireframeContent {
  labels: BlueprintLabels;
}

const Layout = tw.div`flex flex-col gap-[18px]`;

// Screens in a flow read left to right, and scroll sideways on a phone rather than shrink to nothing.
const Strip = styled.ol(() => [
  tw`list-none m-0 p-0 pb-[6px] flex flex-row items-start gap-[10px] overflow-x-auto`,
  css`
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
  `,
]);

const Step = styled.li(() => [
  tw`flex flex-col gap-[8px] flex-shrink-0`,
  css`
    scroll-snap-align: start;
  `,
]);

const StepTitle = tw.span`flex flex-row items-center gap-[6px] text-xs font-semibold text-white`;

const StepNumber = tw.span`inline-flex items-center justify-center w-[18px] h-[18px] text-[10px] text-[#101010] bg-[var(--accent)] rounded-full`;

const Arrow = tw.li`self-center flex-shrink-0 text-[var(--accent-muted)] text-lg pt-[20px]`;

const Phone = styled.div(() => [
  tw`relative flex flex-col gap-[5px] w-[160px] h-[316px] p-[8px] pt-[18px] bg-[#0b0b0b] border-[2px] border-solid border-[#2f2f2f] rounded-[20px]`,
  css`
    &::before {
      content: "";
      position: absolute;
      top: 6px;
      left: 50%;
      width: 36px;
      height: 4px;
      border-radius: 4px;
      background: #2f2f2f;
      transform: translateX(-50%);
    }
  `,
]);

// In a flow each screen keeps a fixed width and the strip scrolls; on its own a screen takes the room it has.
const Desktop = styled.div(({ hasAreas, isInFlow }: { hasAreas: boolean; isInFlow: boolean }) => [
  tw`relative p-[8px] pt-[22px] bg-[#0b0b0b] border-[2px] border-solid border-[#2f2f2f] rounded-[6px]`,
  isInFlow ? tw`w-[420px] max-w-[78vw]` : tw`w-full max-w-[640px]`,
  css`
    min-height: 320px;

    &::before {
      content: "";
      position: absolute;
      top: 7px;
      left: 9px;
      width: 30px;
      height: 6px;
      background: radial-gradient(circle, #3a3a3a 2.5px, transparent 3px) 0 0 / 10px 6px repeat-x;
    }
  `,
  hasAreas ? css`
    display: grid;
    grid-template-columns: 1fr 1.6fr 1fr;
    grid-template-rows: auto minmax(220px, 1fr) auto;
    grid-template-areas: "header header header" "left main right" "footer footer footer";
    gap: 6px;
  ` : tw`flex flex-col gap-[6px]`,
]);

const Area = styled.div(({ area }: { area: string }) => [
  tw`flex flex-col gap-[6px] min-h-0`,
  css`
    grid-area: ${area};
  `,
]);

const Region = styled.div(({ size, kind }: { size: number; kind: WireframeRegion["kind"] }) => [
  tw`relative flex flex-col justify-center gap-[4px] px-[7px] py-[5px] min-h-[22px] overflow-hidden bg-[#141414]
     border-[1px] border-solid border-[#2b2b2b] rounded-[3px]`,
  css`
    flex: ${size} 1 0;
  `,
  kind === "overlay" && tw`border-dashed border-[var(--accent-muted)]`,
  kind === "overlay" && css`
    background: rgba(var(--accent-rgb), 0.05);
  `,
  kind === "canvas" && css`
    background:
      linear-gradient(rgba(var(--accent-rgb), 0.12) 1px, transparent 1px) 0 0 / 12px 12px,
      linear-gradient(90deg, rgba(var(--accent-rgb), 0.12) 1px, transparent 1px) 0 0 / 12px 12px,
      #141414;
  `,
]);

const RegionLabel = tw.span`relative z-[1] self-start px-[2px] text-[9px] md:text-[10px] leading-tight text-[#a8a8a8] bg-[#141414]`;

// The classic placeholder for an image or video: a box with its diagonals.
const Media = styled.span(() => [
  tw`absolute inset-0`,
  css`
    background:
      linear-gradient(to top right, transparent calc(50% - 0.5px), #2e2e2e calc(50% - 0.5px), #2e2e2e calc(50% + 0.5px), transparent calc(50% + 0.5px)),
      linear-gradient(to bottom right, transparent calc(50% - 0.5px), #2e2e2e calc(50% - 0.5px), #2e2e2e calc(50% + 0.5px), transparent calc(50% + 0.5px));
  `,
]);

const Line = styled.span(({ width }: { width: number }) => [
  tw`block h-[4px] rounded-[2px] bg-[#262626]`,
  css`
    width: ${width}%;
  `,
]);

const Input = tw.span`block h-[9px] border-[1px] border-solid border-[#333] rounded-[2px]`;

const Pills = tw.span`flex flex-row gap-[4px]`;

const Pill = styled.span(({ isPrimary }: { isPrimary: boolean }) => [
  tw`block flex-1 h-[10px] rounded-full`,
  isPrimary ? tw`bg-[var(--accent)]` : tw`bg-[#2a2a2a]`,
]);

const Dots = tw.span`flex flex-row gap-[4px]`;

const Dot = styled.span(({ isLit }: { isLit: boolean }) => [
  tw`block w-[7px] h-[7px] rounded-full border-[1px] border-solid border-[var(--accent-muted)]`,
  isLit && tw`bg-[var(--accent)] border-[var(--accent)]`,
]);

const Big = styled.span(() => [
  tw`block w-[55%] h-[10px] rounded-[2px]`,
  css`
    background: rgba(var(--accent-rgb), 0.35);
  `,
]);

const Notes = tw.dl`grid gap-[12px] m-0 md:grid-cols-2`;

const Note = tw.div`flex flex-col gap-[4px] p-[12px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const NoteTerm = tw.dt`text-xs font-semibold text-[var(--accent)]`;

const NoteText = tw.dd`m-0 text-sm text-[#bbb]`;

const LINE_WIDTHS = [90, 70, 80];

// Each kind of region drawn as low fidelity as a sketch: lines for text, outlines for inputs, pills for
// buttons, a cross for media. Nothing here is a screenshot of a real product.
const RegionBody: FC<{ region: WireframeRegion }> = ({ region }) => {
  switch (region.kind) {
    case "media":
      return <Media aria-hidden="true" />;
    case "list":
    case "card":
      return <>{LINE_WIDTHS.slice(0, region.kind === "card" ? 2 : 3).map((width) => <Line key={width} width={width} aria-hidden="true" />)}</>;
    case "form":
      return <><Input aria-hidden="true" /><Input aria-hidden="true" /></>;
    case "actions":
      return <Pills aria-hidden="true"><Pill isPrimary={false} /><Pill isPrimary={false} /><Pill isPrimary /></Pills>;
    case "steps":
      return <Dots aria-hidden="true"><Dot isLit /><Dot isLit /><Dot isLit={false} /><Dot isLit={false} /></Dots>;
    case "stat":
      return <Big aria-hidden="true" />;
    default:
      return null;
  }
};

const RegionBox: FC<{ region: WireframeRegion }> = ({ region }) => (
  <Region size={region.size ?? 1} kind={region.kind}>
    <RegionBody region={region} />
    <RegionLabel>{region.label}</RegionLabel>
  </Region>
);

const AREAS = ["header", "left", "main", "right", "footer"] as const;

const Screen: FC<{ screen: WireframeScreen; device: WireframeContent["device"]; isInFlow?: boolean }> = ({ screen, device, isInFlow = false }) => {
  if (device === "phone") {
    return <Phone>{screen.regions.map((region) => <RegionBox key={region.label} region={region} />)}</Phone>;
  }

  const hasAreas = screen.regions.some((region) => region.area);

  return (
    <Desktop hasAreas={hasAreas} isInFlow={isInFlow}>
      {hasAreas
        ? AREAS.map((area) => (
          <Area key={area} area={area}>
            {screen.regions.filter((region) => region.area === area).map((region) => <RegionBox key={region.label} region={region} />)}
          </Area>
        ))
        : screen.regions.map((region) => <RegionBox key={region.label} region={region} />)}
    </Desktop>
  );
};

// A product flow as wireframes: the screens a user moves through, then the decision behind them and what
// it achieved.
export const Wireframe: FC<WireframeProps> = ({ device, screens, decision, outcome, labels }: WireframeProps) => (
  <Layout>
    {screens.length === 1 ? (
      <Screen screen={screens[0]} device={device} />
    ) : (
      <Strip data-scroll-x>
        {screens.map((screen, index) => (
          <Fragment key={screen.title}>
            {index > 0 && <Arrow aria-hidden="true">→</Arrow>}
            <Step>
              <StepTitle>
                <StepNumber aria-hidden="true">{index + 1}</StepNumber>
                {screen.title}
              </StepTitle>
              <Screen screen={screen} device={device} isInFlow />
            </Step>
          </Fragment>
        ))}
      </Strip>
    )}
    <Notes>
      <Note>
        <NoteTerm>{labels.decision}</NoteTerm>
        <NoteText>{decision}</NoteText>
      </Note>
      <Note>
        <NoteTerm>{labels.outcome}</NoteTerm>
        <NoteText>{outcome}</NoteText>
      </Note>
    </Notes>
  </Layout>
);
