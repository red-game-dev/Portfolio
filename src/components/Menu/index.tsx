import { useEffect, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { progressOf } from "@/components/Menu/config";
import { JOURNEY_STOPS, StopPart } from "@/config/journey";
import useFocusLeave from "@/hooks/useFocusLeave";
import { fill } from "@/packages/text/format";
import { focusRing, media, noTransitionWhenReduced, progressText } from "@/styles/mixins";
import { MenuContent } from "@/types/menu";

interface MenuProps {
  // Which stops are on screen, in JOURNEY_STOPS order.
  selected: boolean[];
  content: MenuContent;
}

interface MenuItemProps {
  selected?: boolean;
}

// The journey across the top where all eleven stops fit beside the name and the view switch, compact until there is
// room for the full size. Smaller screens use MobileMenu instead.
const MenuContainer = tw.div`hidden xl:block xl:relative`;

const MenuList = styled.nav`
  ${tw`flex flex-col justify-evenly xl:justify-end text-center list-none p-0 m-0 xl:flex-row xl:text-right`}

  transition: opacity 0.35s cubic-bezier(0.165, 0.85, 0.45, 1);
`;

const MenuItem = styled(Link)(({ selected = false }: MenuItemProps) => [
  tw`w-full xl:w-auto m-4 p-4 py-8 xl:p-0 xl:m-0 inline text-base xl:text-sm 2xl:text-base leading-loose text-white font-semibold 
      xl:px-2 2xl:px-4 border-dotted border-2 border-[#121212ed] border-[transparent] border-r-[var(--accent)]
     relative align-top overflow-hidden hover:text-white`,
  selected && tw`animate-[move-text 0.75s forwards, border-transition 1s ease-in-out 0s]`,
  css`
    --nav-rest: ${selected ? "#ffffff" : "#9a9a9a"};

    &:hover,
    &:focus-visible {
      --nav-rest: #ffffff;
    }

    /* The current stop's text bob and border fill, kept still like everything else. */
    ${media.reducedMotion} {
      animation: none;
    }
  `
]);

// The label fills with the zone's colour as the reader moves through the item's sections, so the menu reads
// as the same progress bar as the trail on the left.
// Not faded with opacity, which would take the zone's colour below a readable contrast; the rest of the label is a
// softer grey until the item is hovered, focused or current.
const Label = styled.span`
  ${progressText("right", "--nav-progress", "var(--nav-rest, #9a9a9a)")}
`;

const Caret = tw.span`ml-[6px] text-[10px] align-middle`;

// A stop with parts keeps them in a list that opens under it on hover or keyboard focus, so a reader can
// go straight to Projects without knowing it lives in the game world. Hidden lists take no focus. Focus from a
// click does not open it (only focus a keyboard shows), and Escape puts it away until the pointer or focus leaves.
const Group = styled.div`
  ${tw`relative flex`}

  &:hover > ul,
  &:has(:focus-visible) > ul {
    visibility: visible;
    opacity: 1;
    transform: none;
  }

  &[data-dismissed] > ul {
    visibility: hidden;
    opacity: 0;
    transform: translateY(-4px);
  }
`;

// Padded at the top rather than spaced, so the pointer never crosses a gap that would close it.
const Parts = styled.ul`
  ${tw`absolute right-0 top-full z-[12] m-0 pt-[10px] px-0 pb-0 list-none text-left`}

  min-width: 210px;
  visibility: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;

  ${noTransitionWhenReduced}
`;

const Part = styled.li`
  ${tw`m-0`}

  background: rgba(16, 16, 16, 0.97);
  border: 1px solid rgba(var(--accent-rgb), 0.25);

  & + & {
    border-top: 0;
  }
`;

const PartLink = styled(Link)`
  ${tw`block px-[16px] py-[10px] text-sm font-semibold text-[#ccc] no-underline hover:text-white`}

  &:hover {
    background: rgba(var(--accent-rgb), 0.12);
  }

  ${focusRing("var(--accent)", -2)}
`;

interface StopWithPartsProps {
  link: JSX.Element;
  label: string;
  parts: StopPart[];
  names: MenuContent["parts"];
}

const StopWithParts = ({ link, label, parts, names }: StopWithPartsProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const show = () => setIsDismissed(false);
  const onBlur = useFocusLeave(show);

  useEffect(() => {
    if (isDismissed) {
      return undefined;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDismissed(true);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [isDismissed]);

  return (
    <Group data-dismissed={isDismissed || undefined} onMouseEnter={show} onMouseLeave={show} onFocus={show} onBlur={onBlur}>
      {link}
      <Parts aria-label={label}>
        {parts.map((part) => (
          <Part key={part.key}>
            <PartLink href={part.href}>{names[part.key]}</PartLink>
          </Part>
        ))}
      </Parts>
    </Group>
  );
};

export const Menu = ({ selected, content }: MenuProps) => (
    <MenuContainer>
      <MenuList aria-label={content.label}>
        {JOURNEY_STOPS.map((item, index) => {
          const link = (
            <MenuItem
              key={item.key}
              href={item.href}
              style={progressOf(index)}
              selected={selected[index]}
              aria-current={selected[index] ? "location" : undefined}
            >
              <Label>{content.stops[item.key]}</Label>
              {item.parts && <Caret aria-hidden="true"><FontAwesomeIcon icon={faChevronDown} /></Caret>}
            </MenuItem>
          );

          return item.parts ? (
            <StopWithParts
              key={item.key}
              link={link}
              label={fill(content.partsLabel, { stop: content.stops[item.key] })}
              parts={item.parts}
              names={content.parts}
            />
          ) : link;
        })}
      </MenuList>
    </MenuContainer>
);
