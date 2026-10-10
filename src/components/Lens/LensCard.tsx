import { FC, KeyboardEvent } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { LENS_SPRITES } from "@/components/Lens/config";
import { PixelSprite } from "@/components/PixelSprite";
import { Lens, LENS_ACCENTS, LENS_STAT_MAX } from "@/config/lenses";
import { media, squareBullet, svgFill } from "@/styles/mixins";
import { LensCard as LensCardContent } from "@/types/lens";

interface LensCardProps extends LensCardContent {
  selectLabel: string;
  order: number;
  onChoose: (lens: Lens) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

const dealIn = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
`;

const idle = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

// The whole card is the button, so it can be chosen by click, tap, Enter or Space.
const Card = styled.button(({ order }: { order: number }) => [
  tw`relative flex flex-row md:flex-col gap-[14px] md:gap-[16px] w-full p-[16px] md:p-[22px] text-left cursor-pointer
     text-[#ccc] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E] rounded-[2px]`,
  css`
    /* Backwards, not both: once dealt, the card's own styles apply again, so the hover lift still works. */
    animation: ${dealIn} 0.5s cubic-bezier(0.165, 0.85, 0.45, 1) ${order * 120}ms backwards;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--lens-accent);
      box-shadow: 0 0 28px rgba(var(--lens-rgb), 0.22), inset 0 0 0 1px rgba(var(--lens-rgb), 0.35);
      transform: translateY(-3px);
      outline: none;
    }

    ${media.reducedMotion} {
      animation: none;
      transition: none;

      &:hover,
      &:focus-visible {
        transform: none;
      }
    }
  `,
]);

// A lit pedestal under the portrait, like a character select screen.
const Portrait = styled.span(() => [
  tw`relative flex items-end justify-center flex-shrink-0 w-[84px] h-[96px] md:w-full md:h-[150px]`,
  css`
    background: radial-gradient(ellipse at 50% 92%, rgba(var(--lens-rgb), 0.28) 0, rgba(var(--lens-rgb), 0) 60%);

    &::after {
      content: "";
      position: absolute;
      left: 18%;
      right: 18%;
      bottom: 6px;
      height: 4px;
      background: repeating-linear-gradient(90deg, rgba(var(--lens-rgb), 0.55) 0 6px, transparent 6px 9px);
    }
  `,
]);

const Sprite = styled.span(() => [
  tw`block w-[72px] h-[72px] md:w-[120px] md:h-[120px] mb-[8px]`,
  css`
    filter: drop-shadow(0 0 8px rgba(var(--lens-rgb), 0.35));

    ${svgFill}

    button:hover &,
    button:focus-visible & {
      animation: ${idle} 0.7s steps(2) infinite;
    }

    ${media.reducedMotion} {
      button:hover &,
      button:focus-visible & {
        animation: none;
      }
    }
  `,
]);

const Body = tw.span`flex flex-col gap-[10px] min-w-0 md:flex-1`;

const CharacterClass = tw.span`text-xs font-semibold text-[var(--lens-accent)]`;

const Name = tw.span`block text-lg md:text-xl font-semibold text-white leading-tight`;

const Tagline = tw.span`block text-sm text-[#aaa]`;

// On every screen, so a phone gets the character select too.
const Stats = tw.span`grid grid-cols-[auto 1fr] gap-x-[10px] gap-y-[4px] sm:gap-y-[5px] items-center text-xs text-[#888]`;

const Pips = tw.span`flex flex-row gap-[3px]`;

const Pip = styled.span(({ isOn }: { isOn: boolean }) => [
  tw`block w-[14px] h-[6px]`,
  isOn ? tw`bg-[var(--lens-accent)]` : tw`bg-[#222]`,
]);

const Perks = tw.span`hidden md:flex flex-col gap-[6px] text-sm text-[#bbb]`;

const Perk = styled.span(() => [
  tw`relative block pl-[14px]`,
  squareBullet({ size: 5, top: "0.55em", colour: "var(--lens-accent)" }),
]);

const Select = styled.span(() => [
  tw`hidden md:block mt-auto pt-[10px] text-sm font-semibold text-[var(--lens-accent)]`,
  css`
    border-top: 1px solid #1e1e1e;
  `,
]);

const STAT_STEPS = Array.from({ length: LENS_STAT_MAX }, (_, index) => index);

// One way to read the site, as a playable character: portrait, class, stats and what the view gives.
export const LensCard: FC<LensCardProps> = ({
  lens, name, characterClass, tagline, perks, stats, selectLabel, order, onChoose, onKeyDown,
}: LensCardProps) => {
  const accent = LENS_ACCENTS[lens];

  return (
    <Card
      type="button"
      order={order}
      data-lens-card={lens}
      onClick={() => onChoose(lens)}
      onKeyDown={onKeyDown}
      style={{ "--lens-accent": accent.color, "--lens-rgb": accent.rgb } as React.CSSProperties}
    >
      <Portrait>
        <Sprite>
          <PixelSprite {...LENS_SPRITES[lens]} />
        </Sprite>
      </Portrait>
      <Body>
        <CharacterClass>{characterClass}</CharacterClass>
        <Name>{name}</Name>
        <Tagline>{tagline}</Tagline>
        <Stats>
          {stats.map((stat) => (
            <span key={stat.name} style={{ display: "contents" }}>
              <span>{stat.name}</span>
              <Pips role="img" aria-label={`${stat.value} of ${LENS_STAT_MAX}`}>
                {STAT_STEPS.map((step) => <Pip key={step} isOn={step < stat.value} />)}
              </Pips>
            </span>
          ))}
        </Stats>
        <Perks>
          {perks.map((perk) => <Perk key={perk}>{perk}</Perk>)}
        </Perks>
        <Select aria-hidden="true">{selectLabel}</Select>
      </Body>
    </Card>
  );
};
