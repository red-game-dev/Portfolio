import { CSSProperties, FC, KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import tw from "twin.macro";

import { faBook, faBoxOpen, faGear, faRocket, faUserAstronaut, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useSwipe } from "@/components/Carousel/hooks/useSwipe";
import { suggestionText } from "@/components/Finale/Voyage/economy";
import { Badges } from "@/components/Finale/Voyage/Hangar/Badges";
import { Hold, Plans } from "@/components/Finale/Voyage/Hangar/Cargo";
import { Codex } from "@/components/Finale/Voyage/Hangar/Codex";
import { Forge } from "@/components/Finale/Voyage/Hangar/Forge";
import {
  Body,
  Dot,
  Header,
  Heading,
  NextStep,
  NextStepLabel,
  NextStepText,
  Note,
  Panel,
  Purse,
  PurseButton,
  PurseNote,
  PurseNoteTitle,
  SectionBar,
  SectionButton,
  SmallButton,
  TabBar,
  TabButton,
  TabPanel,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { Ledger, YourData } from "@/components/Finale/Voyage/Hangar/Ledger";
import { Loadout } from "@/components/Finale/Voyage/Hangar/Loadout";
import { Pilot } from "@/components/Finale/Voyage/Hangar/Pilot";
import { PilotTransfer as PilotTransferPanel } from "@/components/Finale/Voyage/Hangar/PilotTransfer";
import { Sheet } from "@/components/Finale/Voyage/Hangar/Sheet";
import { Style } from "@/components/Finale/Voyage/Hangar/Style";
import {
  HANGAR_TABS,
  HangarSectionId,
  HangarSeen,
  HangarTabId,
  isHangarSeen,
  isHangarSection,
  sectionDots,
  seenNow,
  swipeTab,
  tabOf,
} from "@/components/Finale/Voyage/Hangar/tabs";
import { Talents } from "@/components/Finale/Voyage/Hangar/Talents";
import type { PilotTransfer } from "@/components/Finale/Voyage/hooks/useVoyage";
import { useVoyageSettings } from "@/components/Finale/Voyage/hooks/useVoyageSettings";
import { Money } from "@/components/Finale/Voyage/Money";
import { IconButton } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { SettingsPanel } from "@/components/Preferences/SettingsPanel";
import { rovingTarget } from "@/packages/accessibility/roving";
import { readStored, writeStored } from "@/packages/browser/storage";
import type { ArmoryView, CareerView, CurrencyCode, EconomyView, ProgressView, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";
import { PreferencesContent } from "@/types/preferences";

// A place the hangar can be opened on from elsewhere in the voyage.
export type HangarTab = "loadout" | "ship" | "forge" | "badges";

const OPENS_ON: Record<HangarTab, HangarSectionId> = { loadout: "loadout", ship: "sheet", forge: "forge", badges: "badges" };

// Where the hangar was last left, and the codex finds and badges already seen there: conveniences of this browser.
const PLACE_KEY = "redgame.hangarPlace";
const SEEN_KEY = "redgame.hangarSeen";

const TAB_ICONS = { pilot: faUserAstronaut, ship: faRocket, cargo: faBoxOpen, log: faBook, settings: faGear };
const CURRENCY_COLOURS: Record<CurrencyCode, string> = { RED: "#ffd76a", VOID: "#c58bff" };
// How far a finger must travel sideways for a swipe to change tabs (px).
const SWIPE_PX = 60;

const Hidden = tw.span`sr-only`;
const MainPanel = tw.div`flex flex-col flex-1 min-h-0`;

interface HangarPanelProps {
  content: FinaleVoyage;
  settings: PreferencesContent;
  economy: EconomyView;
  career: CareerView | null;
  gear: ArmoryView | null;
  progress: ProgressView | null;
  // Draws the ship as it looks now, or in a paint being tried on.
  drawShip: (context: CanvasRenderingContext2D, width: number, height: number, paint?: string) => void;
  opensOn?: HangarTab | null;
  isFlying: boolean;
  // Moving the pilot to another device, from the Settings tab.
  transfer: PilotTransfer;
  onAct: (action: VoyageAction) => boolean;
  // Does the hangar's one suggestion.
  onFollow: () => void;
  onClose: () => void;
}

// The hangar, as a flight deck: the purse (each currency a button that says what it is), the one thing most worth
// doing now a tap away, and five tabs (the pilot, the ship, the cargo, the log, the settings), each a row of
// sections. A tab with something to do carries a dot. It opens where it was last left (or where the voyage sends
// it), a sideways swipe moves between tabs, and opening it focuses its heading.
export const HangarPanel: FC<HangarPanelProps> = ({ content, settings, economy, career, gear, progress, drawShip, opensOn = null, isFlying, transfer, onAct,
  onFollow, onClose }: HangarPanelProps) => {
  const copy = content.economy;
  const words = content.hangar;
  const views = { economy, career, gear, progress };
  const baseId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const sectionListRef = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState<HangarSectionId>(() => (opensOn ? OPENS_ON[opensOn] : readStored(PLACE_KEY, isHangarSection) ?? "overview"));
  const [lastSections, setLastSections] = useState<Partial<Record<HangarTabId, HangarSectionId>>>(() => ({ [tabOf(section)]: section }));
  const [seen, setSeen] = useState<HangarSeen>(() => readStored(SEEN_KEY, isHangarSeen) ?? seenNow(views));
  const [purseNote, setPurseNote] = useState<CurrencyCode | null>(null);
  const voyageSettings = useVoyageSettings();
  const tab = tabOf(section);
  const tabSpec = HANGAR_TABS.find(({ id }) => id === tab) ?? HANGAR_TABS[0];
  const dots = sectionDots(views, seen);
  const tabId = (id: HangarTabId) => `${baseId}-tab-${id}`;
  const sectionId = (id: HangarSectionId) => `${baseId}-section-${id}`;
  const found = seenNow(views);

  const open = (next: HangarSectionId) => {
    setSection(next);
    setLastSections((now) => ({ ...now, [tabOf(next)]: next }));
  };
  const openTab = (next: HangarTabId) => open(lastSections[next] ?? HANGAR_TABS.find(({ id }) => id === next)?.sections[0] ?? "overview");
  const swipe = useSwipe((direction) => openTab(swipeTab(tab, direction)), SWIPE_PX);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // The voyage asks for a place while the hangar is open (an empty slot of the bar pressed, say).
  useEffect(() => {
    if (opensOn) {
      open(OPENS_ON[opensOn]);
    }
    // Only a new request moves the hangar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opensOn]);

  // A new section starts at its top, with its segment in view, and is where the hangar opens next time.
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    sectionListRef.current?.querySelector<HTMLElement>("[aria-selected=true]")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    writeStored(PLACE_KEY, section);
  }, [section]);

  // The codex and the badges, once looked at, are seen as they stand.
  useEffect(() => {
    const next = {
      codex: section === "codex" ? Math.max(seen.codex, found.codex) : seen.codex,
      badges: section === "badges" ? Math.max(seen.badges, found.badges) : seen.badges,
    };

    if (next.codex !== seen.codex || next.badges !== seen.badges) {
      setSeen(next);
      writeStored(SEEN_KEY, next);
    }
  }, [section, found.codex, found.badges, seen]);

  // Arrows, Home and End move along a row of tabs, opening each as it is reached.
  const roving = <T extends string>(ids: readonly T[], current: T, go: (id: T) => void, list: HTMLDivElement | null) => (event: KeyboardEvent<HTMLElement>) => {
    const next = rovingTarget(event.key, ids.indexOf(current), ids.length);

    if (next === null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    go(ids[next]);
    list?.querySelectorAll<HTMLElement>("[role=tab]")[next]?.focus();
  };

  const body = (() => {
    switch (section) {
      case "overview":
        return <Pilot content={content} career={career} progress={progress} />;
      case "talents":
        return progress && <Talents content={content} progress={progress} onAct={onAct} />;
      case "sheet":
        return <Sheet content={content} economy={economy} gear={gear} progress={progress} drawShip={drawShip} onAct={onAct} />;
      case "loadout":
        return <Loadout content={content} economy={economy} gear={gear} onAct={onAct} />;
      case "forge":
        return gear && <Forge content={content} gear={gear} onAct={onAct} />;
      case "style":
        return progress && <Style content={content} progress={progress} drawShip={drawShip} onAct={onAct} />;
      case "hold":
        return <Hold content={content} economy={economy} isFlying={isFlying} onAct={onAct} />;
      case "plans":
        return <Plans content={content} economy={economy} onAct={onAct} />;
      case "codex":
        return career && <Codex content={content} career={career} />;
      case "badges":
        return progress && <Badges content={content} progress={progress} />;
      case "ledger":
        return <Ledger content={content} economy={economy} />;
      default:
        return (
          <>
            <SettingsPanel copy={settings} names={voyageSettings.names} onPick={voyageSettings.onPick} />
            <PilotTransferPanel copy={content.transfer} transfer={transfer} isFlying={isFlying} isShown />
            <YourData content={content} isFlying={isFlying} onAct={onAct} />
          </>
        );
    }
  })();

  return (
    <Panel aria-labelledby="hangar-heading" style={{ "--tab-accent": tabSpec.accent } as CSSProperties}>
      <Header>
        <Heading id="hangar-heading" ref={headingRef} tabIndex={-1}>{copy.hangar}</Heading>
        <Purse>
          {(["RED", "VOID"] as const).map((code) => (
            <PurseButton
              key={code}
              type="button"
              colour={CURRENCY_COLOURS[code]}
              isOpen={purseNote === code}
              aria-expanded={purseNote === code}
              aria-controls={`${baseId}-purse`}
              title={fill(words.currencies.open, { name: copy.currencies[code] })}
              onClick={() => setPurseNote(purseNote === code ? null : code)}
            >
              <Money copy={copy} amount={economy.purse[code]} code={code} />
            </PurseButton>
          ))}
        </Purse>
        <IconButton type="button" onClick={onClose} aria-label={copy.closeHangar}>
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </IconButton>
      </Header>
      <div id={`${baseId}-purse`} aria-live="polite">
        {purseNote && (
          <PurseNote>
            <PurseNoteTitle>{copy.currencies[purseNote]}</PurseNoteTitle>
            {words.currencies[purseNote]}
          </PurseNote>
        )}
      </div>
      {economy.suggestion && (
        <NextStep>
          <NextStepText>
            <NextStepLabel>{words.nextStep.label}</NextStepLabel>
            {suggestionText(copy, economy.suggestion)}
          </NextStepText>
          <SmallButton type="button" isPrimary onClick={onFollow}>{words.nextStep.act}</SmallButton>
        </NextStep>
      )}
      <TabBar ref={tabListRef} role="tablist" aria-label={copy.hangar}>
        {HANGAR_TABS.map(({ id, sections, accent }) => {
          const isOn = id === tab;
          const hasDot = sections.some((entry) => dots.has(entry));

          return (
            <TabButton
              key={id}
              id={tabId(id)}
              type="button"
              role="tab"
              aria-selected={isOn}
              aria-controls={`${baseId}-panel`}
              tabIndex={isOn ? 0 : -1}
              isOn={isOn}
              accent={accent}
              onClick={() => openTab(id)}
              onKeyDown={roving(HANGAR_TABS.map((entry) => entry.id), tab, openTab, tabListRef.current)}
            >
              <FontAwesomeIcon icon={TAB_ICONS[id]} aria-hidden="true" />
              {words.tabs[id]}
              {hasDot && (
                <>
                  <Dot colour={accent} aria-hidden="true" />
                  <Hidden>{`, ${words.ready}`}</Hidden>
                </>
              )}
            </TabButton>
          );
        })}
      </TabBar>
      <MainPanel id={`${baseId}-panel`} role="tabpanel" aria-labelledby={tabId(tab)}>
        {tabSpec.sections.length > 1 && (
          <SectionBar ref={sectionListRef} role="tablist" aria-label={words.tabs[tab]} data-scroll-x>
            {tabSpec.sections.map((id) => (
              <SectionButton
                key={id}
                id={sectionId(id)}
                type="button"
                role="tab"
                aria-selected={id === section}
                aria-controls={`${baseId}-body`}
                tabIndex={id === section ? 0 : -1}
                isOn={id === section}
                onClick={() => open(id)}
                onKeyDown={roving(tabSpec.sections, section, open, sectionListRef.current)}
              >
                {words.sections[id]}
                {dots.has(id) && (
                  <>
                    <Dot colour={tabSpec.accent} data-dot aria-hidden="true" />
                    <Hidden>{`, ${words.ready}`}</Hidden>
                  </>
                )}
              </SectionButton>
            ))}
          </SectionBar>
        )}
        <Body
          ref={bodyRef}
          id={`${baseId}-body`}
          role={tabSpec.sections.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={tabSpec.sections.length > 1 ? sectionId(section) : undefined}
          onPointerDown={swipe.onPointerDown}
          onPointerUp={swipe.onPointerUp}
        >
          <TabPanel key={section}>
            {body ?? <Note>{words.sections[section]}</Note>}
          </TabPanel>
        </Body>
      </MainPanel>
    </Panel>
  );
};
