import { CSSProperties, FC, useEffect, useId, useRef, useState } from "react";

import tw from "twin.macro";

import { faBook, faBoxOpen, faGear, faRocket, faScroll, faUserAstronaut, faXmark } from "@fortawesome/free-solid-svg-icons";
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
  SmallButton,
  TabBar,
  TabButton,
  TabPanel,
} from "@/components/Finale/Voyage/Hangar/HangarPanel.styles";
import { Ledger, YourData } from "@/components/Finale/Voyage/Hangar/Ledger";
import { Loadout } from "@/components/Finale/Voyage/Hangar/Loadout";
import { Pilot } from "@/components/Finale/Voyage/Hangar/Pilot";
import { PilotTransfer as PilotTransferPanel } from "@/components/Finale/Voyage/Hangar/PilotTransfer";
import { ActiveQuests, CompletedQuests } from "@/components/Finale/Voyage/Hangar/Quests";
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
import { useScrollEdges } from "@/components/Finale/Voyage/Hangar/useScrollEdges";
import type { PilotTransfer } from "@/components/Finale/Voyage/hooks/useVoyage";
import { useVoyageSettings } from "@/components/Finale/Voyage/hooks/useVoyageSettings";
import { Money } from "@/components/Finale/Voyage/Money";
import { IconButton } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { SettingsPanel } from "@/components/Preferences/SettingsPanel";
import { Tab, TabList } from "@/components/Tabs";
import useTabs from "@/hooks/useTabs";
import { readStored, writeStored } from "@/packages/browser/storage";
import type { ArmoryView, CareerView, CurrencyCode, EconomyView, ProgressView, VoyageAction } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";
import { PreferencesContent } from "@/types/preferences";

// A place the hangar can be opened on from elsewhere in the voyage.
export type HangarTab = "loadout" | "ship" | "forge" | "badges" | "quests";

const OPENS_ON: Record<HangarTab, HangarSectionId> = { loadout: "loadout", ship: "sheet", forge: "forge", badges: "badges", quests: "quests" };

// Where the hangar was last left, and the codex finds, badges and quests done already seen there: conveniences of this
// browser.
const PLACE_KEY = "redgame.hangarPlace";
const SEEN_KEY = "redgame.hangarSeen";

const TAB_ICONS = { pilot: faUserAstronaut, quests: faScroll, ship: faRocket, cargo: faBoxOpen, log: faBook, settings: faGear };
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
  // The quest pinned to the HUD, and pinning one; starting today's daily voyage (null while a run is flying).
  pinned: string | null;
  onTrack: (id: string | null) => void;
  onDaily: (() => void) | null;
  onClose: () => void;
}

// The hangar, as a flight deck: the purse (each currency a button that says what it is), the one thing most worth
// doing now a tap away, and six tabs (the pilot, the quests, the ship, the cargo, the log, the settings), each a row of
// sections. A tab with something to do carries a dot. It opens where it was last left (or where the voyage sends
// it), a sideways swipe moves between tabs, and opening it focuses its heading.
export const HangarPanel: FC<HangarPanelProps> = ({ content, settings, economy, career, gear, progress, drawShip, opensOn = null, isFlying, transfer, onAct,
  onFollow, pinned, onTrack, onDaily, onClose }: HangarPanelProps) => {
  const copy = content.economy;
  const words = content.hangar;
  const views = { economy, career, gear, progress };
  const baseId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const found = seenNow(views);
  const [section, setSection] = useState<HangarSectionId>(() => (opensOn ? OPENS_ON[opensOn] : readStored(PLACE_KEY, isHangarSection) ?? "overview"));
  const [lastSections, setLastSections] = useState<Partial<Record<HangarTabId, HangarSectionId>>>(() => ({ [tabOf(section)]: section }));
  // What was seen before, never more than there is now (after a reset, or another device's pilot taken on); the
  // first time, everything found so far.
  const [seen, setSeen] = useState<HangarSeen>(() => {
    const stored = readStored(SEEN_KEY, isHangarSeen);

    return stored
      ? { codex: Math.min(stored.codex, found.codex), badges: Math.min(stored.badges, found.badges), quests: Math.min(stored.quests ?? found.quests, found.quests) }
      : found;
  });
  const [purseNote, setPurseNote] = useState<CurrencyCode | null>(null);
  const voyageSettings = useVoyageSettings();
  const tab = tabOf(section);
  const tabIndex = HANGAR_TABS.findIndex(({ id }) => id === tab);
  const tabSpec = HANGAR_TABS[tabIndex] ?? HANGAR_TABS[0];
  const sectionIndex = Math.max(0, tabSpec.sections.indexOf(section));
  const dots = sectionDots(views, seen);

  const open = (next: HangarSectionId) => {
    setSection(next);
    setLastSections((now) => ({ ...now, [tabOf(next)]: next }));
  };
  const openTab = (next: HangarTabId) => open(lastSections[next] ?? HANGAR_TABS.find(({ id }) => id === next)?.sections[0] ?? "overview");
  const mainTabs = useTabs({ count: HANGAR_TABS.length, active: tabIndex, onSelect: (next) => openTab(HANGAR_TABS[next].id) });
  const sectionTabs = useTabs({ count: tabSpec.sections.length, active: sectionIndex, onSelect: (next) => open(tabSpec.sections[next]) });
  const sectionList = sectionTabs.listProps.ref;
  const mainList = mainTabs.listProps.ref;
  const tabEdges = useScrollEdges(mainList);
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

    [sectionList.current, mainList.current].forEach((list) =>
      list?.querySelector<HTMLElement>("[aria-selected=true]")?.scrollIntoView?.({ block: "nearest", inline: "nearest" }));
    writeStored(PLACE_KEY, section);
  }, [section, sectionList, mainList]);

  // The codex, the badges and the quests, once looked at, are seen as they stand; and nothing counts as seen that is
  // not there.
  useEffect(() => {
    const isQuests = tabOf(section) === "quests";
    const next = {
      codex: section === "codex" ? found.codex : Math.min(seen.codex, found.codex),
      badges: section === "badges" ? found.badges : Math.min(seen.badges, found.badges),
      quests: isQuests ? found.quests : Math.min(seen.quests ?? found.quests, found.quests),
    };

    if (next.codex !== seen.codex || next.badges !== seen.badges || next.quests !== seen.quests) {
      setSeen(next);
    }
  }, [section, found.codex, found.badges, found.quests, seen]);

  // Kept from the first open, so what is found while the hangar is closed is marked the next time.
  useEffect(() => {
    writeStored(SEEN_KEY, seen);
  }, [seen]);

  const body = (() => {
    switch (section) {
      case "overview":
        return <Pilot content={content} career={career} progress={progress} onAct={onAct} />;
      case "quests":
        return career && <ActiveQuests content={content} career={career} pinned={pinned} onTrack={onTrack} onDaily={onDaily} />;
      case "completed":
        return career && <CompletedQuests content={content} career={career} />;
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
      <TabBar {...mainTabs.listProps} aria-label={copy.hangar} fadeStart={tabEdges.start} fadeEnd={tabEdges.end}>
        {HANGAR_TABS.map(({ id, sections, accent }, index) => {
          const hasDot = sections.some((entry) => dots.has(entry));

          return (
            <TabButton key={id} {...mainTabs.tabProps(index)} isOn={index === tabIndex} accent={accent}>
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
      <MainPanel {...mainTabs.panelProps(tabIndex)}>
        {tabSpec.sections.length > 1 && (
          <SectionBar data-scroll-x>
            <TabList {...sectionTabs.listProps} aria-label={words.tabs[tab]}>
              {tabSpec.sections.map((id, index) => (
                <Tab key={id} {...sectionTabs.tabProps(index)} isOn={index === sectionIndex}>
                  {words.sections[id]}
                  {dots.has(id) && (
                    <>
                      <Dot colour={tabSpec.accent} isCorner aria-hidden="true" />
                      <Hidden>{`, ${words.ready}`}</Hidden>
                    </>
                  )}
                </Tab>
              ))}
            </TabList>
          </SectionBar>
        )}
        <Body
          ref={bodyRef}
          {...(tabSpec.sections.length > 1 ? sectionTabs.panelProps(sectionIndex) : {})}
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
