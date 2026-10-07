import { SECTION_IDS } from "@/config/sections";
import { Command, error, output, system } from "@/packages/interaction/terminal";
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
};

// What ls shows, and the command each file runs when it is read with cat.
const FILES: Record<string, string> = {
  "about.txt": "about",
  "experience.log": "experience",
  "skills.json": "skills",
  "projects/": "projects",
  "cases/": "cases",
  "ventures.md": "ventures",
  "contact.txt": "contact",
  "cv.pdf": "cv",
};

// Get around.
export const createAroundCommands = (context: CommandContext): Command[] => {
  const { commandsByName } = context;

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
  ];
};
