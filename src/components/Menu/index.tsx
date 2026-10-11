import tw, { css, styled } from "twin.macro";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { progressOf } from "@/components/Menu/config";
import { JOURNEY_STOPS } from "@/config/journey";
import { fill } from "@/packages/text/format";
import { focusRing, noTransitionWhenReduced, progressText } from "@/styles/mixins";
import { MenuContent } from "@/types/menu";

interface MenuProps {
  // Which stops are on screen, in JOURNEY_STOPS order.
  selected: boolean[];
  content: MenuContent;
}

interface MenuItemProps {
  selected?: boolean;
}

// The journey across the top on large screens. Smaller screens use MobileMenu instead.
const MenuContainer = tw.div`hidden lg:block lg:relative`;

const MenuList = styled.nav(() => [
  tw`flex flex-col justify-evenly lg:justify-end text-center list-none p-0 m-0 lg:flex-row lg:text-right`,
  css`
    transition: opacity 0.35s cubic-bezier(0.165, 0.85, 0.45, 1);
  `
]);

const MenuItem = styled(Link)(({ selected = false }: MenuItemProps) => [
  tw`w-full lg:w-auto m-4 p-4 py-8 lg:p-0 lg:m-0 inline text-base lg:text-sm xl:text-base leading-loose text-white font-semibold 
      lg:px-2 xl:px-4 border-dotted border-2 border-[#121212ed] border-[transparent] border-r-[var(--accent)]
     opacity-50 relative align-top overflow-hidden hover:text-white hover:opacity-100`,
  selected && tw`opacity-100 animate-[move-text 0.75s forwards, border-transition 1s ease-in-out 0s]`,
  css`
    transition: opacity 0.4s ease;
  `
]);

// The label fills with the zone's colour as the reader moves through the item's sections, so the menu reads
// as the same progress bar as the trail on the left.
const Label = styled.span(() => [progressText("right", "--nav-progress", "#ffffff")]);

const Caret = tw.span`ml-[6px] text-[10px] align-middle`;

// A stop with parts keeps them in a list that opens under it on hover or keyboard focus, so a reader can
// go straight to Projects without knowing it lives in the game world. Hidden lists take no focus.
const Group = styled.div(() => [
  tw`relative inline-block align-top`,
  css`
    &:hover > ul,
    &:focus-within > ul {
      visibility: visible;
      opacity: 1;
      transform: none;
    }
  `,
]);

// Padded at the top rather than spaced, so the pointer never crosses a gap that would close it.
const Parts = styled.ul(() => [
  tw`absolute right-0 top-full z-[12] m-0 pt-[10px] px-0 pb-0 list-none text-left`,
  css`
    min-width: 210px;
    visibility: hidden;
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  `,
  noTransitionWhenReduced,
]);

const Part = styled.li(() => [
  tw`m-0`,
  css`
    background: rgba(16, 16, 16, 0.97);
    border: 1px solid rgba(var(--accent-rgb), 0.25);

    & + & {
      border-top: 0;
    }
  `,
]);

const PartLink = styled(Link)(() => [
  tw`block px-[16px] py-[10px] text-sm font-semibold text-[#ccc] no-underline hover:text-white`,
  css`
    &:hover {
      background: rgba(var(--accent-rgb), 0.12);
    }
  `,
  focusRing("var(--accent)", -2),
]);

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
            <Group key={item.key}>
              {link}
              <Parts aria-label={fill(content.partsLabel, { stop: content.stops[item.key] })}>
                {item.parts.map((part) => (
                  <Part key={part.key}>
                    <PartLink href={part.href}>{content.parts[part.key]}</PartLink>
                  </Part>
                ))}
              </Parts>
            </Group>
          ) : link;
        })}
      </MenuList>
    </MenuContainer>
);
