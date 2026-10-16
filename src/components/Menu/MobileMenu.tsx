import { CSSProperties, MouseEvent, useRef, useState } from "react";

import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faChevronRight, faEnvelope, faFileArrowDown, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { progressOf } from "@/components/Menu/config";
import {
  Action,
  Actions,
  Chevron,
  Close,
  Dialog,
  Heading,
  Here,
  Kicker,
  Node,
  Panel,
  PartLink,
  Parts,
  Progress,
  Route,
  Stop,
  StopLink,
  StopName,
  StopState,
  StopText,
  StopZone,
  Title,
  Toggle,
  Top,
} from "@/components/Menu/MobileMenu.styles";
import { MotionSwitch } from "@/components/Motion/MotionSwitch";
import { JOURNEY_STOPS, JourneyStop } from "@/config/journey";
import { SOCIAL_URLS } from "@/config/social";
import { THEME_ACCENTS } from "@/config/themes";
import { ZONE_ACCENTS } from "@/config/zones";
import useModalDialog from "@/hooks/useModalDialog";
import { scrollBehavior } from "@/packages/accessibility/motion";
import { rgbChannels } from "@/packages/graphics/colour";
import { focusLanding } from "@/packages/interaction/focus";
import { scrollToElement } from "@/packages/interaction/scroll-frame";
import { fill } from "@/packages/text/format";
import { MenuContent } from "@/types/menu";

interface MobileMenuProps {
  selected: boolean[];
  content: MenuContent;
  contact: { cv: string; email: string; linkedIn: string };
}

// A stop's colour: its own section's theme where it is one themed section, else its zone's.
const accentOf = (stop: JourneyStop) => (stop.theme ? THEME_ACCENTS[stop.theme] : ZONE_ACCENTS[stop.zone]);

const stopStyle = (stop: JourneyStop, next: JourneyStop) => ({
  "--zone": accentOf(stop),
  "--zone-rgb": rgbChannels(accentOf(stop)),
  "--next-zone": accentOf(next),
} as CSSProperties);

const hereStyle = (stop: JourneyStop) => ({ "--here": accentOf(stop), "--here-rgb": rgbChannels(accentOf(stop)) } as CSSProperties);

// The journey on a phone, drawn as a route: a real button opens a full screen menu where every stop is a
// node on one line in its zone's colour, the stops behind the reader filled in, the one they are at
// glowing with a pin and how far through it they are, and the quickest ways to get in touch underneath.
export const MobileMenu = ({ selected, content, contact }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Two stops can share the screen; the reader is at the first of them. Before the first stop, at the top.
  const here = Math.max(0, selected.indexOf(true));
  const hereZone = JOURNEY_STOPS[here].zone;

  useModalDialog(dialogRef, isOpen);

  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setIsOpen(false);
    // After the dialog has closed and the page can scroll again.
    window.requestAnimationFrame(() => {
      const target = document.querySelector(href);

      if (target) {
        scrollToElement(target, scrollBehavior());
        // Focus follows the jump rather than going back to the menu's button as the dialog closes.
        focusLanding(target);
      }

      window.history.replaceState(null, "", href);
      // replaceState fires no event, so whatever reads the hash (a drawing a link names, a filter) is told directly.
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  };

  return (
    <>
      <Toggle type="button" aria-label={content.open} aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
        <span />
        <span />
        <span />
      </Toggle>
      <Dialog ref={dialogRef} aria-label={content.label} onClose={() => setIsOpen(false)} style={hereStyle(JOURNEY_STOPS[here])}>
        {isOpen && (
          <Panel>
            <Top>
              <Heading>
                <Kicker>
                  {fill(content.kicker, { n: here + 1, total: JOURNEY_STOPS.length, zone: content.zones[hereZone] })}
                </Kicker>
                <Title>{content.title}</Title>
              </Heading>
              <Close type="button" aria-label={content.close} onClick={() => setIsOpen(false)}>
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              </Close>
            </Top>
            <nav aria-label={content.label}>
              <Route>
                {JOURNEY_STOPS.map((item, index) => {
                  const state: StopState = index < here ? "passed" : index === here ? "here" : "ahead";

                  return (
                    <Stop
                      key={item.key}
                      order={index}
                      isLast={index === JOURNEY_STOPS.length - 1}
                      style={stopStyle(item, JOURNEY_STOPS[index + 1] ?? item)}
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
                            {content.stops[item.key]}
                            {state === "here" && <Here>{content.here}</Here>}
                          </StopName>
                          <StopZone>{content.zones[item.zone]}</StopZone>
                          {state === "here" && <Progress aria-hidden="true" />}
                        </StopText>
                        <Chevron aria-hidden="true"><FontAwesomeIcon icon={faChevronRight} /></Chevron>
                      </StopLink>
                      {item.parts && (
                        <Parts aria-label={fill(content.partsLabel, { stop: content.stops[item.key] })}>
                          {item.parts.map((part) => (
                            <li key={part.key}>
                              <PartLink href={part.href} onClick={(event) => go(event, part.href)}>{content.parts[part.key]}</PartLink>
                            </li>
                          ))}
                        </Parts>
                      )}
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
              <Action href={SOCIAL_URLS.linkedIn(contact.linkedIn)} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faLinkedin} aria-hidden="true" />
                {content.linkedIn}
              </Action>
            </Actions>
            <MotionSwitch label={content.motion} variant="row" />
          </Panel>
        )}
      </Dialog>
    </>
  );
};
