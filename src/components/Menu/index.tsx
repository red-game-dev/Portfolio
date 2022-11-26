import tw, { css, styled } from "twin.macro";

import Link from "next/link";

import useCollision from "@/hooks/useCollision";

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
  tw`w-full lg:w-auto m-4 p-4 py-8 lg:p-0 lg:m-0 inline text-base leading-loose text-white font-semibold 
      lg:px-4 border-dotted border-2 border-[#121212ed] border-[transparent] border-r-[#4bffa5]
     opacity-50 relative align-top overflow-hidden hover:text-white hover:opacity-100`,
  selected && tw`text-white opacity-100 animate-[move-text 0.75s forwards, text-color 0.75s forwards, border-transition 1s ease-in-out 0s]`,
  css`
    transition: color 0.7s cubic-bezier(0.165, 0.85, 0.45, 1);
  `
]);

export const Menu = ({ active }: MenuProps) => {
  const [isOnSectionStarted] = useCollision("section-scroller-link");
  const [isOnSectionAbout] = useCollision("section-about");
  const [isOnSectionHistory] = useCollision("section-history");
  const [isOnSectionServices] = useCollision("section-services");
  const [isOnProjectsSection] = useCollision("section-projects");
  const [isOnSectionTechSkills] = useCollision("section-skills-TechSkills");
  const [isOnSectionToolsSkills] = useCollision("section-skills-ToolsSkills");
  const [isOnSectionDesignSkills] = useCollision("section-skills-DesignSkills");
  const [isOnSectionLanguageSkills] = useCollision("section-skills-LanguageSkills");
  const [isOnSectionKnowladgeSkills] = useCollision("section-skills-KnowladgeSkills");

  const isOnSkillsSection = (isOnSectionTechSkills || isOnSectionToolsSkills ||
    isOnSectionDesignSkills || isOnSectionLanguageSkills ||
    isOnSectionKnowladgeSkills);
  const isOnBeginningSection = isOnSectionStarted ||
  (!isOnProjectsSection && !isOnSectionAbout &&
    !isOnSectionAbout && !isOnSectionHistory &&
    !isOnSectionServices && !isOnSkillsSection);

  return (
    <>
      <MenuButton active={active} />
      <MenuContainer active={active}>
        <MenuList>
          <MenuItem href="#section-started" selected={isOnBeginningSection} aria-label="Beginning">
            Beginning
          </MenuItem>
          <MenuItem href="#section-about" selected={isOnSectionAbout} aria-label="Who I am">
            Who I am
          </MenuItem>
          <MenuItem href="#section-history" selected={isOnSectionHistory} aria-label="My History">
            My History
          </MenuItem>
          <MenuItem href="#section-services" selected={isOnSectionServices} aria-label="What can I offer">
            What can I offer
          </MenuItem>
          <MenuItem href="#section-skills-TechSkills" selected={isOnSkillsSection} aria-label="Skills">
            Skills
          </MenuItem>
          <MenuItem href="#section-projects" selected={isOnProjectsSection} aria-label="Achievements">
            Projects & Achievements
          </MenuItem>
        </MenuList>
      </MenuContainer>
    </>
  );
};
