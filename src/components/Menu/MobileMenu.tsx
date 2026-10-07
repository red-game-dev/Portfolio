import { CSSProperties, MouseEvent, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faChevronRight, faEnvelope, faFileArrowDown, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { NAV_ITEMS, progressOf } from "@/components/Menu/config";
import { ZONE_ACCENTS, ZoneId } from "@/config/zones";
import useModalDialog from "@/hooks/useModalDialog";
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
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: none; }
`;

const draw = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.4); opacity: 0; }
`;

// Full screen, in the top layer, so no transformed or filtered ancestor can clip it. Solid, so nothing of
// the page shows through, with a glow in the colour of the zone the reader is in.
const Dialog = styled.dialog(() => [
  tw`m-0 p-0 w-screen h-screen max-w-none border-0 text-white`,
  css`
    max-height: none;
    height: 100dvh;
    background: radial-gradient(120% 55% at 50% 0%, rgba(var(--here-rgb), 0.2), transparent 62%), #09090b;

    &::backdrop {
      background: #09090b;
    }

    &[open] {
      display: flex;
    }
  `,
]);

const Panel = tw.div`flex flex-col w-full max-w-[520px] mx-auto px-[22px] pt-[16px] pb-[28px] overflow-y-auto`;

const Top = tw.div`flex flex-row items-start justify-between gap-[12px] mb-[22px]`;

const Heading = tw.div`flex flex-col gap-[4px] pt-[8px]`;

const Kicker = tw.span`text-xs font-semibold text-[var(--here)]`;

const Title = tw.h2`m-0 text-2xl font-semibold`;

const Close = styled.button(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[44px] h-[44px] cursor-pointer text-lg text-white rounded-full`,
  css`
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);

    &:focus-visible {
      outline: 2px solid var(--here);
    }
  `,
]);

// The journey as a route: a line down the left through every stop, each stop a node in its zone's colour.
const Route = tw.ol`list-none m-0 p-0 flex flex-col`;

interface StopProps {
  order: number;
  isLast: boolean;
}

const Stop = styled.li(({ order, isLast }: StopProps) => [
  tw`relative pl-[40px]`,
  css`
    animation: ${rise} 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) ${order * 40}ms both;

    /* The stretch of route to the next stop, fading from this zone's colour into the next one's. */
    &::before {
      content: "";
      display: ${isLast ? "none" : "block"};
      position: absolute;
      left: 14px;
      top: 31px;
      bottom: -31px;
      width: 2px;
      background: linear-gradient(to bottom, var(--zone), var(--next-zone));
      opacity: 0.55;
      transform-origin: top;
      animation: ${draw} 0.3s ease-out ${120 + order * 40}ms both;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;

      &::before {
        animation: none;
      }
    }
  `,
]);

type StopState = "passed" | "here" | "ahead";

const Node = styled.span(({ state }: { state: StopState }) => [
  tw`absolute z-[1] rounded-full`,
  state === "here" ? tw`left-[5px] top-[22px] w-[20px] h-[20px]` : tw`left-[8px] top-[25px] w-[14px] h-[14px]`,
  css`
    background: ${state === "ahead" ? "#09090b" : "var(--zone)"};
    border: 2px solid var(--zone);
    box-shadow: ${state === "here" ? "0 0 16px rgba(var(--zone-rgb), 0.8)" : "none"};
  `,
  state === "here" && css`
    &::after {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 9999px;
      border: 2px solid var(--zone);
      animation: ${pulse} 1.6s ease-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        animation: none;
      }
    }
  `,
]);

const StopLink = styled.a(({ state }: { state: StopState }) => [
  tw`relative flex flex-row items-center gap-[12px] min-h-[64px] px-[14px] py-[10px] no-underline text-white rounded-[8px]`,
  css`
    background: ${state === "here" ? "rgba(var(--zone-rgb), 0.12)" : "transparent"};
    transition: background 0.2s ease;

    &:hover,
    &:focus-visible {
      background: rgba(var(--zone-rgb), 0.1);
      outline: none;
    }

    &:focus-visible {
      box-shadow: inset 0 0 0 2px var(--zone);
    }
  `,
]);

const StopText = tw.span`flex flex-col gap-[3px] flex-1 min-w-0`;

const StopName = tw.span`flex flex-row items-center gap-[8px] text-xl font-semibold leading-tight`;

const StopZone = tw.span`text-xs text-[#8f8f8f]`;

// How far through the stop the reader is.
const Progress = styled.span(() => [
  tw`block h-[2px] mt-[4px] rounded-full bg-[rgba(255, 255, 255, 0.08)] overflow-hidden`,
  css`
    &::after {
      content: "";
      display: block;
      height: 100%;
      width: calc(var(--nav-progress, 0) * 100%);
      background: var(--zone);
    }
  `,
]);

const Here = tw.span`text-[11px] font-bold text-[#09090b] bg-[var(--zone)] rounded-full px-[7px] py-[2px]`;

const Chevron = tw.span`text-sm text-[#5a5a5a]`;

const Actions = tw.div`grid grid-cols-3 gap-[8px] mt-[26px] pt-[20px] border-0 border-t-[1px] border-solid border-[rgba(255, 255, 255, 0.08)]`;

const Action = styled.a(() => [
  tw`flex flex-col items-center justify-center gap-[6px] h-[64px] text-xs font-semibold no-underline text-white rounded-[8px]`,
  css`
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(var(--here-rgb), 0.35);

    & > svg {
      font-size: 16px;
      color: var(--here);
    }

    &:hover,
    &:focus-visible {
      background: rgba(var(--here-rgb), 0.12);
      outline: none;
    }
  `,
]);

const rgbOf = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(", ");

const stopStyle = (zone: ZoneId, next: ZoneId) => ({
  "--zone": ZONE_ACCENTS[zone],
  "--zone-rgb": rgbOf(ZONE_ACCENTS[zone]),
  "--next-zone": ZONE_ACCENTS[next],
} as CSSProperties);

const hereStyle = (zone: ZoneId) => ({ "--here": ZONE_ACCENTS[zone], "--here-rgb": rgbOf(ZONE_ACCENTS[zone]) } as CSSProperties);

// The journey on a phone, drawn as a route: a real button opens a full screen menu where every stop is a
// node on one line in its zone's colour, the stops behind the reader filled in, the one they are at
// glowing with a pin and how far through it they are, and the quickest ways to get in touch underneath.
export const MobileMenu = ({ selected, content, contact }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Two stops can share the screen; the reader is at the first of them. Before the first stop, at the top.
  const here = Math.max(0, selected.indexOf(true));
  const hereZone = NAV_ITEMS[here].zone;

  useModalDialog(dialogRef, isOpen);

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
      <Dialog ref={dialogRef} aria-label={content.label} onClose={() => setIsOpen(false)} style={hereStyle(hereZone)}>
        {isOpen && (
          <Panel>
            <Top>
              <Heading>
                <Kicker>
                  {content.kicker
                    .replace("{n}", String(here + 1))
                    .replace("{total}", String(NAV_ITEMS.length))
                    .replace("{zone}", content.zones[hereZone])}
                </Kicker>
                <Title>{content.title}</Title>
              </Heading>
              <Close type="button" aria-label={content.close} onClick={() => setIsOpen(false)}>
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              </Close>
            </Top>
            <nav aria-label={content.label}>
              <Route>
                {NAV_ITEMS.map((item, index) => {
                  const state: StopState = index < here ? "passed" : index === here ? "here" : "ahead";

                  return (
                    <Stop
                      key={item.label}
                      order={index}
                      isLast={index === NAV_ITEMS.length - 1}
                      style={stopStyle(item.zone, NAV_ITEMS[index + 1]?.zone ?? item.zone)}
                    >
                      <Node state={state} aria-hidden="true" />
                      <StopLink
                        href={item.href}
                        style={progressOf(index)}
                        state={state}
                        aria-current={state === "here" ? "location" : undefined}
                        onClick={(event) => go(event, item.href)}
                      >
                        <StopText>
                          <StopName>
                            {item.label}
                            {state === "here" && <Here>{content.here}</Here>}
                          </StopName>
                          <StopZone>{content.zones[item.zone]}</StopZone>
                          {state === "here" && <Progress aria-hidden="true" />}
                        </StopText>
                        <Chevron aria-hidden="true"><FontAwesomeIcon icon={faChevronRight} /></Chevron>
                      </StopLink>
                    </Stop>
                  );
                })}
              </Route>
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
