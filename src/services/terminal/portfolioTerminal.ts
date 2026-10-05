import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { portfolioData, PortfolioData } from "@/data/resume";
import { TenureCalculator, toMonthIndex } from "@/packages/insights/career";
import {
  clearCommand,
  Command,
  CommandRegistry,
  createHelpCommand,
  error,
  heading,
  output,
  system,
  TerminalSession
} from "@/packages/interaction/terminal";
import { createRedCommand } from "@/services/terminal/redCommand";
import { Audience } from "@/types/case-studies";

const GOTO_TARGETS: Record<string, string> = {
  about: "section-about",
  history: "section-history",
  services: "section-services",
  skills: "section-skills-ProgrammingLanguagesFrameworksSkills",
  ai: SECTION_IDS.aiUsage,
  cases: SECTION_IDS.caseStudies,
  characters: SECTION_IDS.roster,
  projects: "section-projects",
};

const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

const period = (from: string, to?: string) => `${from} to ${to ?? "now"}`;

const matches = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

// The portfolio as commands. Every answer is built from the same data the page renders, so the terminal
// never says something the page does not.
export const createPortfolioCommands = (data: PortfolioData): Command[] => {
  const experience = [...data.experience].sort((first, second) => toMonthIndex(second.from) - toMonthIndex(first.from));
  const calculator = new TenureCalculator(data.roster.asOf);
  const linkedIn = `https://www.linkedin.com/in/${data.socialMedia.byUsername.linkedIn}`;

  return [
    createRedCommand(data),
    {
      name: "whoami",
      summary: "Who I am and what I am looking for",
      run: () => ({
        lines: [heading(data.details.name), ...data.headline.lines.map(output), output(data.headline.availability)],
      }),
    },
    {
      name: "about",
      summary: "The longer version",
      run: () => ({
        lines: [
          heading(data.details.intro),
          output(collapse(data.details.description)),
          output(`Location: ${data.details.location}`),
        ],
      }),
    },
    {
      name: "experience",
      aliases: ["history", "jobs"],
      usage: "experience [name]",
      summary: "Every role, or one role in detail",
      run: (args) => {
        const query = args.join(" ");

        if (!query) {
          return { lines: [heading("Experience"), ...experience.map((entry) => output(`  ${period(entry.from, entry.to).padEnd(22)}${entry.title}`))] };
        }

        const entry = experience.find((item) => matches(item.title, query));

        if (!entry) {
          return { lines: [error(`No role matches "${query}". Try experience on its own for the list.`)] };
        }

        return {
          lines: [
            heading(entry.title),
            system(period(entry.from, entry.to)),
            ...(entry.outcome ? [output(entry.outcome)] : []),
            ...entry.description.slice(0, 1).map((paragraph) => output(collapse(paragraph))),
            ...(entry.bullets ?? []).slice(0, 5).map((bullet) => output(`  - ${collapse(bullet)}`)),
            system("goto history for every bullet and the stack"),
          ],
        };
      },
    },
    {
      name: "skills",
      usage: "skills [group]",
      summary: "Skill groups, or every skill in one group",
      run: (args) => {
        const groups = Object.entries(data.skills).map(([key, skills]) => ({
          key,
          title: data.sections[key]?.title ?? key,
          names: skills.map((skill) => skill.name),
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
      aliases: ["party"],
      summary: "The roles I play, with their level",
      run: () => ({
        lines: [
          heading("Characters"),
          ...data.roster.characters.map((character) => output(
            `  ${character.characterClass.padEnd(20)}Level ${Math.max(1, calculator.years(character.tenures))}`
          )),
        ],
      }),
    },
    {
      name: "services",
      aliases: ["offer"],
      summary: "What I can take on",
      run: () => ({
        lines: data.serviceGroups.flatMap((group) => [heading(group.label), ...group.services.map((service) => output(`  ${service.title}`))]),
      }),
    },
    {
      name: "ai",
      summary: "How I use AI, in numbers",
      run: () => {
        const tasks = [...data.aiUsage.mix.tasks].sort((first, second) => second.count - first.count);

        return {
          lines: [
            heading(data.aiUsage.mix.title),
            output(data.aiUsage.mix.description[0] ?? ""),
            ...tasks.slice(0, 4).map((task) => output(`  ${task.name.padEnd(42)}${Math.floor(task.count / 50) * 50}+`)),
            output(`Stages every change goes through: ${data.aiUsage.agents.stages.map((stage) => stage.name).join(", ")}`),
            system("goto ai for the full section"),
          ],
        };
      },
    },
    {
      name: "cases",
      aliases: ["case-studies"],
      usage: "cases [payments|ai|architecture]",
      summary: "Case studies, optionally for one kind of role",
      run: ([audience]) => {
        const filter = (Object.keys(AUDIENCE_ANCHORS) as Audience[]).find((key) => key === audience?.toLowerCase());
        const list = filter ? data.caseStudies.filter((item) => item.audiences.includes(filter)) : data.caseStudies;

        return {
          lines: [heading("Case studies"), ...list.map((item) => output(`  ${item.title}`))],
          // A filtered view is a hash link, so the case studies section applies the same filter.
          effect: filter ? { type: "navigate", target: AUDIENCE_ANCHORS[filter] } : undefined,
        };
      },
    },
    {
      name: "projects",
      aliases: ["quests"],
      summary: "Projects and achievements",
      run: () => ({
        lines: [heading("Projects"), ...data.projects.map((project) => output(`  ${project.title.padEnd(32)}${project.category}`))],
      }),
    },
    {
      name: "contact",
      summary: "How to reach me",
      run: () => ({
        lines: [
          heading("Contact"),
          output(`  Email     ${data.details.email}`),
          output(`  LinkedIn  ${linkedIn}`),
          ...data.github.map((account) => output(`  GitHub    ${account.link}`)),
        ],
      }),
    },
    {
      name: "cv",
      aliases: ["resume"],
      summary: "Download my CV",
      run: () => ({ lines: [system("Opening the CV...")], effect: { type: "open", url: data.cv } }),
    },
    {
      name: "hire",
      summary: "Availability and the fastest way to talk",
      run: () => ({
        lines: [heading("Hire me"), output(data.headline.availability), output(`Email ${data.details.email}, or type cv for the PDF.`)],
      }),
    },
    {
      name: "goto",
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

export const createPortfolioTerminal = (data: PortfolioData = portfolioData) => {
  const registry = new CommandRegistry();

  createPortfolioCommands(data).forEach((command) => registry.register(command));
  registry.register(clearCommand).register(createHelpCommand(registry, data.terminal.helpTitle));

  return new TerminalSession(registry, {
    prompt: data.terminal.prompt,
    welcome: data.terminal.welcome.map(system),
    unknownCommand: (name) => data.terminal.unknownCommand.replace("{name}", name),
  });
};
