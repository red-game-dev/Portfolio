import { FC, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import useTrail from "@/components/Journey/hooks/useTrail";
import { ZoneId } from "@/config/zones";
import { TrailSection } from "@/services/journey/trail";
import { JourneyTrailContent } from "@/types/game";

interface ZoneTrailProps {
  zone: ZoneId;
  zoneIndex: number;
  zoneCount: number;
  sections: TrailSection[];
  labels: JourneyTrailContent;
  isEnabled: boolean;
}

// The title is painted with a gradient clipped to its letters: zone colour up to the progress, dim after.
const fill = (direction: "bottom" | "right") => css`
  background-image: linear-gradient(
    to ${direction},
    var(--accent) calc(var(--trail-progress, 0) * 100%),
    rgba(255, 255, 255, 0.24) calc(var(--trail-progress, 0) * 100%)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

// Down the left edge on desktop, mirroring "Follow Me" on the right, reading top to bottom.
const Vertical = styled.div(() => [
  tw`fixed z-[7] left-[22px] top-1/2 pointer-events-none hidden lg:flex flex-col gap-[10px] whitespace-nowrap`,
  css`
    writing-mode: vertical-lr;
    transform: translateY(-50%);
  `,
]);

const VerticalZone = tw.span`text-xs font-semibold text-[var(--accent)]`;

const VerticalTitle = styled.span(() => [tw`text-sm font-semibold`, fill("bottom")]);

// A slim line under the header on phones and tablets.
const Horizontal = tw.div`fixed z-[7] left-0 right-0 top-[72px] lg:hidden pointer-events-none flex flex-row items-baseline justify-center
gap-[8px] px-[16px] py-[5px] text-[11px] whitespace-nowrap overflow-hidden bg-[rgba(16, 16, 16, 0.94)] border-0 border-b-[1px] border-solid
border-[#1E1E1E]`;

const HorizontalZone = tw.span`flex-shrink-0 font-semibold text-[var(--accent)]`;

const HorizontalTitle = styled.span(() => [tw`font-semibold truncate`, fill("right")]);

// Progress as text: the zone the reader is in and the section they are reading, its title filling with the
// zone's colour as they scroll through it.
export const ZoneTrail: FC<ZoneTrailProps> = ({ zone, zoneIndex, zoneCount, sections, labels, isEnabled }: ZoneTrailProps) => {
  const verticalRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const targets = useMemo(() => [verticalRef, horizontalRef], []);
  const index = useTrail(sections, targets, isEnabled);
  const zoneText = labels.zoneLabel
    .replace("{index}", String(zoneIndex + 1))
    .replace("{total}", String(zoneCount))
    .replace("{zone}", labels.zones[zone]);
  const title = sections[index]?.title ?? "";

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <Vertical ref={verticalRef} aria-hidden="true">
        <VerticalZone>{zoneText}</VerticalZone>
        <VerticalTitle>{title}</VerticalTitle>
      </Vertical>
      <Horizontal ref={horizontalRef} aria-hidden="true">
        <HorizontalZone>{zoneText}</HorizontalZone>
        <HorizontalTitle>{title}</HorizontalTitle>
      </Horizontal>
    </>
  );
};
