import { SECTION_IDS } from "@/config/sections";
import useCollision from "@/hooks/useCollision";

// The forge holds every skill station; the old per group sections are gone.
const SKILLS_SECTION_ID = "section-skills";

// Which stop of the journey the reader is at, in NAV_ITEMS order. Every section needs its call here, in the
// group of the stop it belongs to, or nothing is lit while it is on screen.
export default function useMenuSelection(): boolean[] {
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

  return selected;
}
