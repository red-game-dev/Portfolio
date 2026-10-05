import { FORGE_STATIONS, SKILL_ALIASES, SKILL_MENTION_EXCLUDE, skillStationId } from "@/config/skills";
import { PortfolioData } from "@/data/resume";
import { findMentions, SkillExperienceMapper, SkillRecord, SkillSource } from "@/packages/insights/skills";

export interface ForgeStation {
  id: string;
  title: string;
  description: string[];
  items: SkillRecord[];
}

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

// "Senior Full Stack Engineer, HyperPlay Labs" is HyperPlay Labs; "Founder, CEO at TasteTravellers" is TasteTravellers.
const placeOf = (title: string) => (title.includes(" at ") ? title.split(" at ").pop() : title.split(", ").pop()) ?? title;

// Evidence is the stack list plus any skill named in the role's own bullets and description. Formal study
// counts too, under the school's name; open ended courses opt out.
export const createSkillSources = (data: PortfolioData): SkillSource[] => {
  const names = Object.values(data.skills)
    .flat()
    .map((skill) => skill.name)
    .filter((name) => !SKILL_MENTION_EXCLUDE.includes(name));

  return [
    ...data.experience.map((entry) => ({
      place: placeOf(entry.title),
      from: entry.from,
      to: entry.to,
      skills: [...(entry.techStack ?? []), ...findMentions([...entry.description, ...(entry.bullets ?? [])].join(" "), names)],
    })),
    ...data.education
      .filter((entry) => entry.countsForSkills !== false)
      .map((entry) => ({ place: placeOf(entry.title), from: entry.from, to: entry.to, skills: entry.techStack ?? [] })),
    ...data.projects
      .filter((project) => project.countsForSkills !== false)
      .map((project) => ({
        place: project.title,
        from: project.from,
        to: project.to,
        skills: [...project.techStack, ...findMentions(`${project.intro} ${project.responsibilities.join(" ")}`, names)],
      })),
  ];
};

// The forge view: every skill with the years and places that back it, strongest first. Computed against
// the roster's "as of" date, so the build and the browser always agree.
export const createForgeStations = (data: PortfolioData): ForgeStation[] => {
  const mapper = new SkillExperienceMapper({ sources: createSkillSources(data), asOf: data.roster.asOf, aliases: SKILL_ALIASES });

  return FORGE_STATIONS.map((key) => {
    const intro = data.sections[key];

    return {
      id: skillStationId(intro.title),
      title: intro.title,
      description: intro.description,
      items: mapper
        .mapMany(data.skills[key].map((skill) => skill.name))
        .sort((first, second) => RARITY_ORDER[first.rarity] - RARITY_ORDER[second.rarity] || second.years - first.years || first.name.localeCompare(second.name)),
    };
  });
};
