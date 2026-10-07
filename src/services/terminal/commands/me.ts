import { formatPeriod } from "@/packages/insights/career";
import { Command, error, heading, output, system } from "@/packages/interaction/terminal";
import { collapseWhitespace } from "@/packages/text/format";
import { CommandContext, GROUPS, matches, PERIOD, PRESENT } from "@/services/terminal/commands/shared";
import { SkillGroup } from "@/types/skills";

// Get to know me.
export const createMeCommands = (context: CommandContext): Command[] => {
  const { data, experience, rosterLevels } = context;

  return [
    {
      name: "whoami",
      group: GROUPS.me,
      summary: "Who I am and what I am looking for",
      run: () => ({
        lines: [heading(data.details.name), ...data.headline.lines.map(output), output(data.headline.availability)],
      }),
    },
    {
      name: "about",
      group: GROUPS.me,
      summary: "The longer version",
      run: () => ({
        lines: [
          heading(data.details.intro),
          output(collapseWhitespace(data.details.hook)),
          ...data.details.paragraphs.map((paragraph) => output(collapseWhitespace(paragraph))),
          ...data.details.facts.map((fact) => output(`  - ${fact}`)),
        ],
      }),
    },
    {
      name: "experience",
      group: GROUPS.me,
      aliases: ["history", "jobs"],
      usage: "experience [name]",
      summary: "Every role, or one role in detail",
      run: (args) => {
        const query = args.join(" ");

        if (!query) {
          return { lines: [heading("Experience"), ...experience.map((entry) => output(`  ${formatPeriod(entry, PERIOD, PRESENT).padEnd(22)}${entry.title}`))] };
        }

        const entry = experience.find((item) => matches(item.title, query));

        if (!entry) {
          return { lines: [error(`No role matches "${query}". Try experience on its own for the list.`)] };
        }

        return {
          lines: [
            heading(entry.title),
            system(formatPeriod(entry, PERIOD, PRESENT)),
            ...(entry.outcome ? [output(entry.outcome)] : []),
            ...entry.description.slice(0, 1).map((paragraph) => output(collapseWhitespace(paragraph))),
            ...(entry.bullets ?? []).slice(0, 5).map((bullet) => output(`  - ${collapseWhitespace(bullet)}`)),
            system("goto history for every bullet and the stack"),
          ],
        };
      },
    },
    {
      name: "skills",
      group: GROUPS.me,
      usage: "skills [group]",
      summary: "Skill groups, or every skill in one group",
      run: (args) => {
        const groups = (Object.entries(data.skills) as Array<[SkillGroup, string[]]>).map(([key, names]) => ({
          key,
          title: data.sections[key].title,
          names,
        }));
        const query = args.join(" ");

        if (!query) {
          return {
            lines: [
              heading("Skills"),
              ...groups.map((group) => output(`  ${group.key.padEnd(15)}${group.names.slice(0, 5).join(", ")}${group.names.length > 5 ? ", ..." : ""}`)),
              system("skills <group> for the whole group"),
            ],
          };
        }

        const group = groups.find((item) => item.key === query.toLowerCase() || matches(item.title, query));

        return group
          ? { lines: [heading(group.title), output(group.names.join(", "))] }
          : { lines: [error(`No skill group matches "${query}".`)] };
      },
    },
    {
      name: "characters",
      group: GROUPS.me,
      aliases: ["party"],
      summary: "The roles I play, with their level",
      run: () => ({
        lines: [
          heading("Characters"),
          ...data.roster.characters.map((character) => output(
            `  ${character.characterClass.padEnd(20)}Level ${rosterLevels.level(character)}`
          )),
        ],
      }),
    },
    {
      name: "ventures",
      group: GROUPS.me,
      aliases: ["startups"],
      summary: "Companies I founded or co-founded",
      run: () => ({
        lines: [
          heading("Ventures"),
          ...experience.filter((entry) => entry.isVenture).map((entry) => output(`  ${formatPeriod(entry, PERIOD, PRESENT).padEnd(22)}${entry.title}`)),
        ],
      }),
    },
    {
      name: "industries",
      group: GROUPS.me,
      summary: "Sectors I have worked in",
      run: () => ({ lines: [heading("Industries"), ...data.headline.industries.map((link) => output(`  ${link.label}`))] }),
    },
    {
      name: "languages",
      group: GROUPS.me,
      summary: "Languages I speak",
      run: () => ({ lines: [output(data.skills.language.join(", "))] }),
    },
  ];
};
