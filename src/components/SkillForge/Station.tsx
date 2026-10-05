import { FC, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { faHammer } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Panel, PanelText } from "@/components/Panel";
import useAnimationProgress from "@/hooks/useAnimationProgress";
import useInView from "@/hooks/useInView";
import { decodeFrame, toBinaryMask } from "@/packages/encoding/binary";
import { ForgeStation } from "@/services/skills";
import { ForgeContent } from "@/types/forge";

interface StationProps extends ForgeStation {
  content: ForgeContent;
}

interface RefiningProps {
  isActive: boolean;
}

const REFINE_MS = 1400;
const STARS = { legendary: 4, epic: 3, rare: 2, common: 1 };

const Heading = tw.h3`relative m-[0 0 10px 0] flex flex-row items-center gap-[10px] text-xl font-semibold text-white`;

const Refining = styled.div(({ isActive }: RefiningProps) => [
  tw`relative h-[3px] my-[14px] bg-[#1d1d1d] overflow-hidden`,
  css`
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, var(--accent-muted), var(--accent), #ffc45c);
      transform-origin: left center;
      transform: scaleX(${isActive ? 1 : 0});
      transition: transform ${REFINE_MS}ms cubic-bezier(0.165, 0.85, 0.45, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        transition: none;
      }
    }
  `,
]);

// Items are plain list items styled from here by their rarity, so a station of fifty skills is one styled
// element rather than fifty while the page hydrates.
const Items = styled.ul(({ isActive }: RefiningProps) => [
  tw`list-none m-0 p-0 grid gap-[10px] grid-cols-2 md:grid-cols-3 xl:grid-cols-4`,
  css`
    & > li {
      --rarity: #9aa0a6;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      padding: 12px;
      background: #0d0d0d;
      border: 1px solid #1e1e1e;
      border-top: 2px solid var(--rarity);
      opacity: ${isActive ? 1 : 0.35};
      transform: translateY(${isActive ? "0" : "6px"});
      transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease;
      transition-delay: inherit;
    }

    & > li[data-rarity="rare"] { --rarity: #5aa9ff; }
    & > li[data-rarity="epic"] { --rarity: #b388ff; }
    & > li[data-rarity="legendary"] { --rarity: #ffc45c; }

    & > li[data-rarity="legendary"] {
      box-shadow: ${isActive ? "0 0 18px rgba(255, 196, 92, 0.12)" : "none"};
    }

    & > li:hover {
      box-shadow: 0 0 18px rgba(var(--accent-rgb), 0.12);
    }

    & .name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      overflow-wrap: anywhere;
    }

    & .tier {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--rarity);
    }

    & .meta {
      font-size: 12px;
      color: #999;
      overflow-wrap: anywhere;
    }

    @media (prefers-reduced-motion: reduce) {
      & > li {
        opacity: 1;
        transform: none;
        transition: none;
      }
    }
  `,
]);

const formatDuration = (content: ForgeContent, years: number, months: number) => (
  years >= 1 ? `${years} ${content.years}` : `${Math.max(1, months)} ${content.months}`
);

const formatMeta = (content: ForgeContent, years: number, months: number, places: string[]) => content.tracked
  .replace("{duration}", formatDuration(content, years, months))
  .replace("{places}", places.slice(0, 2).join(", ") + (places.length > 2 ? ` +${places.length - 2}` : ""));

// One crafting station: its skills are "refined" in turn when it comes into view, names decoding from
// binary on one shared clock and each item settling into its rarity.
export const Station: FC<StationProps> = ({ id, title, description, items, content }: StationProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const isActive = useInView(panelRef, { threshold: 0.15 });
  const progress = useAnimationProgress(isActive, REFINE_MS);
  const masks = useMemo(() => items.map((item) => toBinaryMask(item.name)), [items]);

  return (
    <Panel id={id} ref={panelRef}>
      <Heading>
        <FontAwesomeIcon icon={faHammer} aria-hidden="true" />
        {title}
      </Heading>
      {description.map((paragraph) => (
        <PanelText key={paragraph}>{paragraph}</PanelText>
      ))}
      <Refining isActive={isActive} aria-hidden="true" />
      <Items isActive={isActive}>
        {items.map((item, index) => {
          const length = Array.from(item.name).length;
          const revealed = Math.floor(Math.min(1, Math.max(0, progress * 1.6 - index * 0.02)) * length);

          return (
            <li key={item.name} data-rarity={item.rarity} style={{ transitionDelay: `${index * 25}ms` }}>
              <span className="name">
                <span className="sr-only">{item.name}</span>
                <span aria-hidden="true">{decodeFrame(item.name, masks[index], revealed, Math.floor(progress * 40))}</span>
              </span>
              <span className="tier">
                <span>{content.rarity[item.rarity]}</span>
                <span aria-hidden="true">{"★".repeat(STARS[item.rarity])}</span>
              </span>
              <span className="meta">{item.isTracked ? formatMeta(content, item.years, item.months, item.places) : content.untracked}</span>
            </li>
          );
        })}
      </Items>
    </Panel>
  );
};
