import { CSSProperties, MouseEvent, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faFileArrowDown, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { NAV_ITEMS } from "@/components/Menu/config";
import useNavProgress from "@/components/Menu/hooks/useNavProgress";
import { ZONE_ACCENTS } from "@/config/zones";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { MenuContent } from "@/types/menu";

interface MobileMenuProps {
  selected: boolean[];
  content: MenuContent;
  contact: { cv: string; email: string; linkedIn: string };
}

const Toggle = styled.button(() => [
  tw`absolute top-[-8px] right-[-8px] z-[11] flex flex-col items-center justify-center gap-[5px] w-[44px] h-[44px] p-0 cursor-pointer
     bg-transparent border-0 lg:hidden`,
  css`
    & > span {
      display: block;
      width: 24px;
      height: 2px;
      background: #ffffff;
      border-radius: 2px;
    }

    & > span:nth-of-type(2) {
      width: 16px;
      align-self: flex-end;
      margin-right: 10px;
      background: var(--accent);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -4px;
    }
  `,
]);

const rise = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`;

// Full screen, in the top layer, so no transformed or filtered ancestor can clip it.
const Dialog = styled.dialog(() => [
  tw`m-0 p-0 w-screen h-screen max-w-none border-0 text-white`,
  css`
    max-height: none;
    height: 100dvh;
    background: rgba(10, 10, 12, 0.97);

    &::backdrop {
      background: transparent;
    }

    &[open] {
      display: flex;
    }
  `,
]);

const Panel = tw.div`flex flex-col w-full max-w-[520px] mx-auto px-[20px] pt-[18px] pb-[24px] overflow-y-auto`;

const Top = tw.div`flex flex-row items-center justify-between mb-[18px]`;

const Title = tw.h2`m-0 text-lg font-semibold`;

const Close = styled.button(() => [
  tw`flex items-center justify-center w-[44px] h-[44px] cursor-pointer text-lg text-white bg-transparent border-0 rounded-full`,
  css`
    &:focus-visible {
      outline: 2px solid var(--accent);
    }
  `,
]);

const Stops = tw.ol`list-none m-0 p-0 flex flex-col gap-[8px]`;

const Stop = styled.li(({ order }: { order: number }) => [
  css`
    animation: ${rise} 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) ${order * 35}ms both;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
]);

// Each stop in its zone's colour, with how far through it the reader is as a bar along the bottom.
const StopLink = styled.a(({ isHere }: { isHere: boolean }) => [
  tw`relative flex flex-row items-center gap-[14px] min-h-[58px] px-[16px] py-[10px] no-underline text-white rounded-[6px] overflow-hidden`,
  css`
    background: ${isHere ? "rgba(var(--zone-rgb), 0.16)" : "rgba(255, 255, 255, 0.04)"};
    border: 1px solid ${isHere ? "var(--zone)" : "rgba(255, 255, 255, 0.08)"};

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--zone);
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      width: calc(var(--nav-progress, 0) * 100%);
      background: var(--zone);
      opacity: 0.8;
    }

    &:focus-visible {
      outline: 2px solid var(--zone);
      outline-offset: 2px;
    }
  `,
]);

const StopNumber = tw.span`w-[26px] text-xs font-semibold text-[var(--zone)]`;

const StopText = tw.span`flex flex-col flex-1 min-w-0`;

const StopName = tw.span`text-lg font-semibold leading-tight`;

const StopZone = tw.span`text-xs text-[#9a9a9a]`;

const Here = tw.span`text-[11px] font-semibold text-[#101010] bg-[var(--zone)] rounded-full px-[8px] py-[3px]`;

const Actions = tw.div`grid grid-cols-3 gap-[8px] mt-[22px]`;

const Action = styled.a(() => [
  tw`flex flex-col items-center justify-center gap-[6px] h-[64px] text-xs font-semibold no-underline text-white rounded-[6px]`,
  css`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);

    & > svg {
      font-size: 16px;
      color: var(--accent);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
    }
  `,
]);

const zoneStyle = (zone: keyof typeof ZONE_ACCENTS) => {
  const hex = ZONE_ACCENTS[zone];
  const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(", ");

  return { "--zone": hex, "--zone-rgb": rgb } as CSSProperties;
};

// The journey on a phone: a real button opens a full screen menu with every stop as a big row in its
// zone's colour, where the reader is marked, and the quickest ways to get in touch underneath.
export const MobileMenu = ({ selected, content, contact }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useNavProgress(NAV_ITEMS, itemRefs);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    if (!isOpen) {
      return;
    }

    // The page behind stays put while the menu is open.
    const root = document.documentElement;
    const previous = root.style.overflow;

    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previous;
    };
  }, [isOpen]);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setIsOpen(false);
    // After the dialog has closed and the page can scroll again.
    window.requestAnimationFrame(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      window.history.replaceState(null, "", href);
    });
  };

  return (
    <>
      <Toggle type="button" aria-label={content.open} aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
        <span />
        <span />
        <span />
      </Toggle>
      <Dialog ref={dialogRef} aria-label={content.label} onClose={() => setIsOpen(false)}>
        {isOpen && (
          <Panel>
            <Top>
              <Title>{content.title}</Title>
              <Close type="button" aria-label={content.close} onClick={() => setIsOpen(false)}>
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              </Close>
            </Top>
            <nav aria-label={content.label}>
              <Stops>
                {NAV_ITEMS.map((item, index) => (
                  <Stop key={item.label} order={index} style={zoneStyle(item.zone)}>
                    <StopLink
                      ref={(element: HTMLAnchorElement | null) => {
                        itemRefs.current[index] = element;
                      }}
                      href={item.href}
                      isHere={selected[index]}
                      aria-current={selected[index] ? "location" : undefined}
                      onClick={(event) => go(event, item.href)}
                    >
                      <StopNumber aria-hidden="true">{String(index + 1).padStart(2, "0")}</StopNumber>
                      <StopText>
                        <StopName>{item.label}</StopName>
                        <StopZone>{content.zones[item.zone]}</StopZone>
                      </StopText>
                      {selected[index] && <Here>{content.here}</Here>}
                    </StopLink>
                  </Stop>
                ))}
              </Stops>
            </nav>
            <Actions>
              <Action href={contact.cv} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faFileArrowDown} aria-hidden="true" />
                {content.cv}
              </Action>
              <Action href={`mailto:${contact.email}`}>
                <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                {content.email}
              </Action>
              <Action href={`https://www.linkedin.com/in/${contact.linkedIn}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faLinkedin} aria-hidden="true" />
                {content.linkedIn}
              </Action>
            </Actions>
          </Panel>
        )}
      </Dialog>
    </>
  );
};
