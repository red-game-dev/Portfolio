import { useRef } from "react";

import tw, { css, styled } from "twin.macro";

import Link from "next/link";

import { NAV_ITEMS } from "@/components/Menu/config";
import useNavProgress from "@/components/Menu/hooks/useNavProgress";

interface MenuProps {
  // Which stop the reader is at, in NAV_ITEMS order.
  selected: boolean[];
  label: string;
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
const Label = styled.span(() => [
  css`
    background-image: linear-gradient(
      to right,
      var(--accent) calc(var(--nav-progress, 0) * 100%),
      #ffffff calc(var(--nav-progress, 0) * 100%)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  `,
]);

export const Menu = ({ selected, label }: MenuProps) => {
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useNavProgress(NAV_ITEMS, itemRefs);

  return (
    <MenuContainer>
      <MenuList aria-label={label}>
        {NAV_ITEMS.map((item, index) => (
          <MenuItem
            key={item.label}
            ref={(element: HTMLAnchorElement | null) => {
              itemRefs.current[index] = element;
            }}
            href={item.href}
            selected={selected[index]}
            aria-current={selected[index] ? "location" : undefined}
          >
            <Label>{item.label}</Label>
          </MenuItem>
        ))}
      </MenuList>
    </MenuContainer>
  );
};
