import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { DecodedText } from "@/components/DecodedText";
import { ZoneId } from "@/config/zones";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { Journey } from "@/types/journey";

interface ZoneBannerProps extends Journey {
  zone: ZoneId;
  zoneIndex: number;
}

interface BannerProps {
  isVisible: boolean;
}

const VISIBLE_MS = 2600;

// Like a zone name in an MMO: it decodes in when you cross into a new zone, then gets out of the way.
const Banner = styled.div(({ isVisible }: BannerProps) => [
  tw`fixed left-1/2 top-[22%] z-[9] pointer-events-none flex flex-col items-center gap-[6px] px-[28px] py-[14px] text-center
     bg-[rgba(16, 16, 16, 0.78)] border-[1px] border-solid border-[#2f6b4d]`,
  css`
    opacity: ${isVisible ? 1 : 0};
    transform: translate(-50%, ${isVisible ? "0" : "-12px"});
    transition: opacity 0.45s ease, transform 0.45s ease;
    box-shadow: 0 0 24px rgba(75, 255, 165, 0.12);

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
]);

const Counter = tw.span`text-xs font-medium text-[#4bffa5]`;

const Title = tw.span`text-xl lg:text-2xl font-semibold text-white`;

export const ZoneBanner: FC<ZoneBannerProps> = ({ zone, zoneIndex, zoneLabel, zones }: ZoneBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shownZone, setShownZone] = useState<ZoneId | null>(null);
  const previousZone = useRef<ZoneId>(zone);

  useEffect(() => {
    // The first zone is where the page opens, not somewhere the reader travelled to.
    if (previousZone.current === zone || prefersReducedMotion()) {
      previousZone.current = zone;

      return;
    }

    previousZone.current = zone;
    setShownZone(zone);
    setIsVisible(true);

    const timeout = setTimeout(() => setIsVisible(false), VISIBLE_MS);

    return () => clearTimeout(timeout);
  }, [zone]);

  const label = zones.find((item) => item.zone === shownZone);

  return (
    <Banner isVisible={isVisible} aria-hidden="true">
      {label && (
        <>
          <Counter>{`${zoneLabel} ${zoneIndex + 1} of ${zones.length}`}</Counter>
          <Title>
            <DecodedText key={label.zone} text={label.title} isActive={isVisible} />
          </Title>
        </>
      )}
    </Banner>
  );
};
