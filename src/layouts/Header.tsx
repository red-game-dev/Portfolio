import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import Link from "next/link";

import { LensSwitch } from "@/components/Lens/LensSwitch";
import { Menu } from "@/components/Menu";
import useMenuSelection from "@/components/Menu/hooks/useMenuSelection";
import { MobileMenu } from "@/components/Menu/MobileMenu";
import useScrolledPast from "@/hooks/useScrolledPast";
import { LensContent } from "@/types/lens";
import { MenuContent } from "@/types/menu";

interface HeaderContainerProps {
  isScrolled: boolean;
}

const HeaderContainer = styled.header(({ isScrolled }: HeaderContainerProps) => [
  tw`
    flex items-center justify-between m-0 lg:m-auto py-0 px-[30px] bg-transparent border-b-[transparent] fixed lg:p-[50px] top-6 left-0 right-0 w-full z-[8]
    after:content-[''] after:relative after:block after:clear-both
  `,
  css` 
    transition: all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1);
  `,
  // Past the first screen the menu sits on a dark, see through bar, so it never reads over the content.
  isScrolled && tw`top-0 py-[14px] lg:py-[14px]`,
  isScrolled && css`
    background: rgba(16, 16, 16, 0.84);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(var(--accent-rgb), 0.18);
  `,
]);

const HeaderContent = tw.div`w-full relative`;

const LogoContainer = styled.div(() => [
  tw`relative overflow-hidden top-0 w-[150px] text-base leading-loose font-semibold text-white opacity-50 whitespace-nowrap z-[5] lg:top-8`,
  css`
    .mask-lnk {
      position: relative;
      top: 0;
      left: 0;
      width: 100%;
      display: block;
      transform: translateY(0);
      transition: opacity 0.7s cubic-bezier(0.165, 0.85, 0.45, 1),
        color 0.7s cubic-bezier(0.165, 0.85, 0.45, 1),
        transform 0.7s cubic-bezier(0.165, 0.85, 0.45, 1);

      &.mask-lnk-hover {
        position: absolute;
        opacity: 0;
        transform: translateY(32px);
      }
      
      strong {
        color: #fff;
      }
    }
  `
]);

const LogoContents = styled.div(() => [
  css`
    &:hover .mask-lnk {
      opacity: 1;
      transform: translateY(-32px);
       
      &.mask-lnk-hover {
        transform: translateY(0);
      }
    }
  `
]);

// Beside the hamburger on small screens, under the name on large ones.
const SwitchSlot = styled.div(({ isScrolled }: HeaderContainerProps) => [
  tw`absolute top-[-6px] right-[48px] z-[11] lg:right-auto lg:left-0 lg:top-[78px]`,
  // On the slim bar the switch moves up beside the name.
  isScrolled && tw`lg:left-[170px] lg:top-[28px]`,
]);

// How far down, as a share of the viewport, the header turns into a bar.
const SCROLLED_SHARE = 0.6;

interface HeaderProps {
  title?: string;
  lens: LensContent;
  menu: MenuContent;
  contact: { cv: string; email: string; linkedIn: string };
}

const Header: FC<HeaderProps> = ({ title = "", lens, menu, contact }: HeaderProps) => {
  const isScrolled = useScrolledPast(SCROLLED_SHARE);
  // One set of scroll-spy listeners for both menus.
  const selected = useMenuSelection();
  const words = title.split(" ");

  return (
    <HeaderContainer isScrolled={isScrolled}>
      <HeaderContent>
        <LogoContainer>
          <LogoContents>
            <span className="mask-lnk">
              { words.map((word: string, index: number) => {
                if (index === words.length - 1) {
                  return (<strong key={`word-${index}`}> {word}</strong>);
                }

                return (<span key={`word-${index}`}> {word}</span>);
              })}
            </span>
            <Link href="#section-about" className="mask-lnk mask-lnk-hover" aria-label="Download My CV">
              Download <strong>CV</strong>
            </Link>
          </LogoContents>
        </LogoContainer>
        <SwitchSlot isScrolled={isScrolled}>
          <LensSwitch content={lens} />
        </SwitchSlot>
        <Menu selected={selected} label={menu.label} />
        <MobileMenu selected={selected} content={menu} contact={contact} />
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
