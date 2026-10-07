import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { LensSwitch } from "@/components/Lens/LensSwitch";
import { Menu } from "@/components/Menu";
import useJourneyNav from "@/components/Menu/hooks/useJourneyNav";
import { MobileMenu } from "@/components/Menu/MobileMenu";
import { JOURNEY_STOPS } from "@/config/journey";
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
    transition: top 0.7s cubic-bezier(0.165, 0.85, 0.45, 1), padding 0.7s cubic-bezier(0.165, 0.85, 0.45, 1), background-color 0.3s ease;
  `,
  // Past the first screen the menu sits on a dark bar, so it never reads over the content. Nearly opaque
  // rather than blurred: a backdrop blur re-samples everything under the bar on every scrolled frame.
  isScrolled && tw`top-0 py-[14px] lg:py-[14px]`,
  isScrolled && css`
    background-color: rgba(16, 16, 16, 0.95);
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

// The last word in bold, as the logo sets both its lines.
const LastWordStrong: FC<{ text: string }> = ({ text }: { text: string }) => {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, index) => (index === words.length - 1
        ? <strong key={index}> {word}</strong>
        : <span key={index}> {word}</span>))}
    </>
  );
};

const Header: FC<HeaderProps> = ({ title = "", lens, menu, contact }: HeaderProps) => {
  const isScrolled = useScrolledPast(SCROLLED_SHARE);
  // One set of scroll-spy listeners for both menus.
  const headerRef = useRef<HTMLElement>(null);
  const selected = useJourneyNav(JOURNEY_STOPS, headerRef);

  return (
    <HeaderContainer ref={headerRef} isScrolled={isScrolled}>
      <HeaderContent>
        <LogoContainer>
          <LogoContents>
            <span className="mask-lnk">
              <LastWordStrong text={title} />
            </span>
            <a href={contact.cv} className="mask-lnk mask-lnk-hover" target="_blank" rel="noopener noreferrer">
              <LastWordStrong text={menu.cv} />
            </a>
          </LogoContents>
        </LogoContainer>
        <SwitchSlot isScrolled={isScrolled}>
          <LensSwitch content={lens} />
        </SwitchSlot>
        <Menu selected={selected} content={menu} />
        <MobileMenu selected={selected} content={menu} contact={contact} />
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
