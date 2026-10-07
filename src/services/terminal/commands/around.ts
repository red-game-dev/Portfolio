import { SECTION_IDS } from "@/config/sections";
import { ZONE_BOUNDARIES } from "@/config/zones";
import { Command, error, heading, output, system } from "@/packages/interaction/terminal";
import { createJourneyTrail } from "@/services/journey/trail";
import { CommandContext, GROUPS } from "@/services/terminal/commands/shared";

const GOTO_TARGETS: Record<string, string> = {
  about: SECTION_IDS.about,
  history: SECTION_IDS.history,
  services: SECTION_IDS.services,
  skills: SECTION_IDS.forge,
  ai: SECTION_IDS.aiUsage,
  web3: SECTION_IDS.web3,
  igaming: SECTION_IDS.igaming,
  cases: SECTION_IDS.caseStudies,
  characters: SECTION_IDS.roster,
  projects: SECTION_IDS.projects,
  review: SECTION_IDS.codeReview,
  arena: SECTION_IDS.arena,
};

// What ls shows, and the command each file runs when it is read with cat.
const FILES: Record<string, string> = {
  "about.txt": "about",
  "experience.log": "experience",
  "skills.json": "skills",
  "projects/": "projects",
  "cases/": "cases",
  "ventures.md": "ventures",
  "education.md": "education",
  "stats.csv": "stats",
  "contact.txt": "contact",
  "cv.pdf": "cv",
};

// Get around.
export const createAroundCommands = (context: CommandContext): Command[] => {
  const { commandsByName, data } = context;

  return [
    {
      name: "ls",
      group: GROUPS.around,
      aliases: ["dir"],
      summary: "What is here",
      run: () => ({ lines: [output(Object.keys(FILES).join("  "))] }),
    },
    {
      name: "cat",
      group: GROUPS.around,
      aliases: ["open"],
      usage: "cat <file>",
      summary: "Read a file from ls",
      run: ([file]) => {
        const command = file ? FILES[file.toLowerCase()] : undefined;
        const target = command ? commandsByName.get(command) : undefined;

        return target ? target.run([]) : { lines: [error(`cat: ${file ?? ""}: no such file. Try ls.`)] };
      },
    },
    {
      name: "pwd",
      group: GROUPS.around,
      summary: "Where you are",
      run: () => ({ lines: [output("/home/visitor/redgame.dev")] }),
    },
    {
      name: "goto",
      group: GROUPS.around,
      aliases: ["cd"],
      usage: "goto <section>",
      summary: "Jump to a part of the page",
      run: ([target]) => {
        const id = target ? GOTO_TARGETS[target.toLowerCase()] : undefined;

        if (!id) {
          return { lines: [system(`Sections: ${Object.keys(GOTO_TARGETS).join(", ")}`)] };
        }

        return { lines: [system(`Going to ${target}...`)], effect: { type: "navigate", target: id } };
      },
    },
    {
      name: "tree",
      group: GROUPS.around,
      aliases: ["sitemap"],
      summary: "The page as a map, zone by zone",
      run: () => {
        const trail = createJourneyTrail(data);
        const starts = ZONE_BOUNDARIES.map(({ startsAt }) => trail.findIndex((section) => section.id === startsAt));

        return {
          lines: [
            heading("redgame.dev"),
            ...ZONE_BOUNDARIES.flatMap(({ zone }, index) => {
              const sections = trail.slice(Math.max(0, starts[index]), starts[index + 1] ?? trail.length);
              const isLast = index === ZONE_BOUNDARIES.length - 1;

              return [
                output(`${isLast ? "└──" : "├──"} ${data.menu.zones[zone]}`),
                ...sections.map((section, position) => output(`${isLast ? "    " : "│   "}${position === sections.length - 1 ? "└──" : "├──"} ${section.title}`)),
              ];
            }),
          ],
        };
      },
    },
  ];
};
