import { NavGroup } from "@/components/Menu/hooks/useNavProgress";
import { SECTION_IDS } from "@/config/sections";
import { ZoneId } from "@/config/zones";

export interface NavItem extends NavGroup {
  label: string;
  href: string;
  // The zone the stop belongs to, for its colour in the mobile menu.
  zone: ZoneId;
}

// Each item covers a run of sections in page order: one stop on the journey.
export const NAV_ITEMS: NavItem[] = [
  { label: "Who I am", href: "#section-about", first: "section-about", last: "section-terminal", zone: "matrix" },
  { label: "Offer", href: "#section-services", first: "section-services", last: "section-services", zone: "matrix" },
  { label: "History", href: "#section-history", first: "section-history", last: "section-history", zone: "matrix" },
  { label: "AI", href: `#${SECTION_IDS.aiUsage}`, first: SECTION_IDS.aiUsage, last: SECTION_IDS.aiUsage, zone: "ai" },
  { label: "Web3", href: `#${SECTION_IDS.web3}`, first: SECTION_IDS.web3, last: SECTION_IDS.web3, zone: "chain" },
  { label: "Engineering", href: `#${SECTION_IDS.skillAreas}`, first: SECTION_IDS.skillAreas, last: SECTION_IDS.codeReview, zone: "chain" },
  { label: "iGaming", href: `#${SECTION_IDS.igaming}`, first: SECTION_IDS.igaming, last: SECTION_IDS.igaming, zone: "casino" },
  { label: "Game world", href: `#${SECTION_IDS.roster}`, first: SECTION_IDS.roster, last: "section-Wow", zone: "mmo" },
];
