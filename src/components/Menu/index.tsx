import { useRef } from "react";

import tw, { css, styled } from "twin.macro";

import Link from "next/link";

import useNavProgress, { NavGroup } from "@/components/Menu/hooks/useNavProgress";
import { SECTION_IDS } from "@/config/sections";
import useCollision from "@/hooks/useCollision";

// The forge holds every skill station; the old per group sections are gone.
const SKILLS_SECTION_ID = "section-skills";

interface MenuProps {
  active?: boolean;
}

interface MenuItemProps {
  selected?: boolean;
}

const MenuContainer = styled.div(({ active = false }: MenuProps) => [
  tw`
  flex-col justify-evenly
  text-center lg:text-right 
  w-full h-full lg:h-auto lg:w-auto 
  mx-0 mt-0
  bg-[#191919]
  lg:bg-[transparent]
  top-16 left-0 right-0 bottom-0 
  lg:top-0 lg:right-auto lg:bottom-auto
  fixed lg:relative float-none 
  opacity-0 hidden 
  lg:block 
  invisible lg:visible lg:opacity-100`,
  active && tw`visible flex opacity-100`,
  css`
    transition: opacity 0.35s cubic-bezier(0.165, 0.85, 0.45, 1);
  `
]);

const MenuButton = styled.div(({ active = false }: MenuProps) => [
  tw`m-2 w-[30px] h-[20px] top-0 right-0 absolute lg:invisible transition-[all 0.3s ease 0s] rotate-0 z-10`,
  tw`before:content-['']
    after:content-['']
    before:absolute
    after:absolute
    before:top-0
    after:top-auto
    after:bottom-0
    before:left-0
    after:left-0
    before:w-full
    after:w-full
    before:height[2px]
    after:height[2px]
    before:bg-white
    after:bg-white
    before:transition-[all 0.3s ease 0s]
    after:transition-[all 0.3s ease 0s]
  `,
  active && tw`rotate-45`,
]);

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

// Each item covers a run of sections in page order: one stop on the journey.
const NAV_ITEMS: Array<NavGroup & { label: string; href: string }> = [
  { label: "Who I am", href: "#section-about", first: "section-about", last: "section-terminal" },
  { label: "Offer", href: "#section-services", first: "section-services", last: "section-services" },
  { label: "History", href: "#section-history", first: "section-history", last: "section-history" },
  { label: "AI", href: `#${SECTION_IDS.aiUsage}`, first: SECTION_IDS.aiUsage, last: SECTION_IDS.aiUsage },
  { label: "Web3", href: `#${SECTION_IDS.web3}`, first: SECTION_IDS.web3, last: SECTION_IDS.web3 },
  { label: "Engineering", href: `#${SECTION_IDS.skillAreas}`, first: SECTION_IDS.skillAreas, last: SECTION_IDS.codeReview },
  { label: "iGaming", href: `#${SECTION_IDS.igaming}`, first: SECTION_IDS.igaming, last: SECTION_IDS.igaming },
  { label: "Game world", href: `#${SECTION_IDS.roster}`, first: SECTION_IDS.roster, last: "section-Wow" },
];

export const Menu = ({ active }: MenuProps) => {
  const [isOnGlanceSection] = useCollision(SECTION_IDS.glance);
  const [isOnAboutOnly] = useCollision("section-about");
  const [isOnTerminalSection] = useCollision("section-terminal");
  const [isOnSectionHistory] = useCollision("section-history");
  const [isOnSectionServices] = useCollision("section-services");
  const [isOnAiUsageSection] = useCollision(SECTION_IDS.aiUsage);
  const [isOnSkillAreasSection] = useCollision(SECTION_IDS.skillAreas);
  const [isOnPlatformSection] = useCollision(SECTION_IDS.platform);
  const [isOnCodeReviewSection] = useCollision(SECTION_IDS.codeReview);
  const [isOnWeb3Section] = useCollision(SECTION_IDS.web3);
  const [isOnIGamingSection] = useCollision(SECTION_IDS.igaming);
  const [isOnRosterSection] = useCollision(SECTION_IDS.roster);
  const [isOnForgeSection] = useCollision(SKILLS_SECTION_ID);
  const [isOnTalentsSection] = useCollision("section-talents");
  const [isOnCaseStudiesSection] = useCollision(SECTION_IDS.caseStudies);
  const [isOnDuelsSection] = useCollision(SECTION_IDS.duels);
  const [isOnProjectsOnly] = useCollision("section-projects");
  const [isOnEngineRoomSection] = useCollision(SECTION_IDS.engineRoom);
  const [isOnRecommendationsSection] = useCollision("section-Recommendations");
  const [isOnArenaSection] = useCollision(SECTION_IDS.arena);
  const [isOnFinaleSection] = useCollision("section-Wow");

  // One item per stop on the journey: each zone's sections light up the item that leads into it.
  const isOnSectionAbout = isOnGlanceSection || isOnAboutOnly || isOnTerminalSection;
  const isOnEngineering = isOnSkillAreasSection || isOnPlatformSection || isOnCodeReviewSection;
  const isOnGameWorld = isOnRosterSection || isOnForgeSection || isOnTalentsSection || isOnCaseStudiesSection || isOnDuelsSection ||
    isOnProjectsOnly || isOnEngineRoomSection || isOnRecommendationsSection || isOnArenaSection || isOnFinaleSection;

  const selected = [
    isOnSectionAbout, isOnSectionServices, isOnSectionHistory, isOnAiUsageSection, isOnWeb3Section, isOnEngineering, isOnIGamingSection, isOnGameWorld,
  ];
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useNavProgress(NAV_ITEMS, itemRefs);

  return (
    <>
      <MenuButton active={active} />
      <MenuContainer active={active}>
        <MenuList>
          {NAV_ITEMS.map((item, index) => (
            <MenuItem
              key={item.label}
              ref={(element: HTMLAnchorElement | null) => {
                itemRefs.current[index] = element;
              }}
              href={item.href}
              selected={selected[index]}
              aria-label={item.label}
            >
              <Label>{item.label}</Label>
            </MenuItem>
          ))}
        </MenuList>
      </MenuContainer>
    </>
  );
};
