import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { portfolioData, PortfolioData } from "@/data/resume";
import { formatPeriod, toMonthIndex } from "@/packages/insights/career";
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
import { collapseWhitespace, fill } from "@/packages/text/format";
import { createContactDialog } from "@/services/contact";
import { createRosterLevels } from "@/services/roster";
import { createRedCommand } from "@/services/terminal/redCommand";
import { Audience } from "@/types/case-studies";
import { SkillGroup } from "@/types/skills";

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

// How help groups the commands.
const GROUPS = {
  me: "Get to know me",
  work: "See the work",
  contact: "Get in touch",
  red: "Ask me to do it",
  around: "Get around",
  fun: "Just for fun",
  terminal: "Terminal",
} as const;

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


const PERIOD = "{from} to {to}";
const PRESENT = "now";

const matches = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

// The portfolio as commands. Every answer is built from the same data the page renders, so the terminal
// never says something the page does not.
export const createPortfolioCommands = (data: PortfolioData): Command[] => {
  const experience = [...data.experience].sort((first, second) => toMonthIndex(second.from) - toMonthIndex(first.from));
  const rosterLevels = createRosterLevels(data.roster);
  const linkedIn = SOCIAL_URLS.linkedIn(data.socialMedia.byUsername.linkedIn);

  const contactDialog = createContactDialog(data);
  // Commands by name, for cat to run the one a file stands for.
  const commandsByName = new Map<string, Command>();

  const commands: Command[] = [
    { ...createRedCommand(data), group: GROUPS.red },
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
      name: "services",
      group: GROUPS.work,
      aliases: ["offer"],
      summary: "What I can take on",
      run: () => ({
        lines: data.serviceGroups.flatMap((group) => [heading(group.label), ...group.services.map((service) => output(`  ${service.title}`))]),
      }),
    },
    {
      name: "ai",
      group: GROUPS.work,
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
      group: GROUPS.work,
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
      group: GROUPS.work,
      aliases: ["quests"],
      summary: "Projects and achievements",
      run: () => ({
        lines: [heading("Projects"), ...data.projects.map((project) => output(`  ${project.title.padEnd(32)}${project.category}`))],
      }),
    },
    {
      name: "contact",
      group: GROUPS.contact,
      aliases: ["connect"],
      summary: "Every way to reach me, with buttons",
      run: () => ({
        lines: [
          heading("Contact"),
          output(`  Email     ${data.details.email}`),
          output(`  LinkedIn  ${linkedIn}`),
          output(`  Phone     ${data.details.phone}, ${data.details.contactTime.toLowerCase()}`),
          ...data.github.map((account) => output(`  GitHub    ${account.link}`)),
          system("Opening the contact card..."),
        ],
        effect: { type: "dialog", dialog: contactDialog },
      }),
    },
    {
      name: "email",
      group: GROUPS.contact,
      aliases: ["mail"],
      summary: "Write me an email",
      run: () => ({ lines: [system(`Opening an email to ${data.details.email}...`)], effect: { type: "open", url: `mailto:${data.details.email}` } }),
    },
    {
      name: "linkedin",
      group: GROUPS.contact,
      summary: "Connect on LinkedIn",
      run: () => ({ lines: [system("Opening LinkedIn...")], effect: { type: "open", url: linkedIn } }),
    },
    {
      name: "github",
      group: GROUPS.contact,
      aliases: ["git"],
      summary: "My code on GitHub",
      run: () => ({ lines: [system("Opening GitHub...")], effect: { type: "open", url: data.github[0].link } }),
    },
    {
      name: "phone",
      group: GROUPS.contact,
      aliases: ["call"],
      summary: "My number",
      run: () => ({ lines: [output(`${data.details.phone}, ${data.details.contactTime.toLowerCase()}`)] }),
    },
    {
      name: "socials",
      group: GROUPS.contact,
      summary: "Where else I am",
      run: () => ({
        lines: [
          heading("Socials"),
          output(`  LinkedIn   ${linkedIn}`),
          output(`  X          https://x.com/${data.socialMedia.byUsername.twitter.replace("@", "")}`),
          output(`  Instagram  https://www.instagram.com/${data.socialMedia.byUsername.instagram}`),
          output(`  Facebook   https://www.facebook.com/${data.socialMedia.byUsername.facebook}`),
          output(`  My game    https://www.youtube.com/${data.socialMedia.byProjectsUsername.gameYt}`),
        ],
      }),
    },
    {
      name: "cv",
      group: GROUPS.contact,
      aliases: ["resume"],
      summary: "Download my CV",
      run: () => ({ lines: [system("Opening the CV...")], effect: { type: "open", url: data.cv } }),
    },
    {
      name: "hire",
      group: GROUPS.contact,
      summary: "Availability and the fastest way to talk",
      run: () => ({
        lines: [heading("Hire me"), output(data.headline.availability), output(`Email ${data.details.email}, or type cv for the PDF.`)],
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
    {
      name: "references",
      group: GROUPS.work,
      aliases: ["testimonials"],
      summary: "What people I worked with say",
      run: () => ({
        lines: [
          heading("References"),
          ...data.recommendations.map((recommendation) => output(`  "${collapseWhitespace(recommendation.quote)}" ${recommendation.role}, ${recommendation.company}`)),
        ],
      }),
    },
    {
      name: "play",
      group: GROUPS.work,
      aliases: ["game"],
      summary: "Play Bug Raid",
      run: () => ({ lines: [system("Loading Bug Raid...")], effect: { type: "navigate", target: SECTION_IDS.arena } }),
    },
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
      name: "sudo",
      group: GROUPS.fun,
      usage: "sudo <anything>",
      summary: "Try it",
      run: () => ({
        lines: [
          system("[sudo] password for visitor: ********"),
          output("Access granted. You never needed sudo to hire me, but I like the confidence."),
          system("Opening the contact card..."),
        ],
        effect: { type: "dialog", dialog: contactDialog },
      }),
    },
    {
      name: "coffee",
      group: GROUPS.fun,
      summary: "Take a break",
      run: () => ({
        lines: [
          output("   ( ("),
          output("    ) )"),
          output("  ........"),
          output("  |      |]"),
          output("  \\      /"),
          output("   `----'"),
          output("Brewed. The best architecture starts over coffee: type contact and let's have one."),
        ],
      }),
    },
    {
      name: "matrix",
      group: GROUPS.fun,
      summary: "Follow the white rabbit",
      run: () => ({
        lines: [
          system("Wake up, visitor..."),
          system("The page has you."),
          output("Follow the rain back up: type goto about."),
        ],
      }),
    },
    {
      name: "echo",
      group: GROUPS.fun,
      usage: "echo <text>",
      summary: "Say something back",
      run: (args) => ({ lines: [output(args.join(" ") || " ")] }),
    },
    {
      name: "date",
      group: GROUPS.fun,
      summary: "Today",
      run: () => ({ lines: [output(new Date().toDateString())] }),
    },
    {
      name: "exit",
      group: GROUPS.fun,
      aliases: ["quit", "logout"],
      summary: "Leave",
      run: () => ({ lines: [output("There is no exit, only the next quest. Type hire.")] }),
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

  commands.forEach((command) => commandsByName.set(command.name, command));

  return commands;
};

export const createPortfolioTerminal = (data: PortfolioData = portfolioData) => {
  const registry = new CommandRegistry();

  createPortfolioCommands(data).forEach((command) => registry.register(command));
  registry.register(clearCommand).register(createHelpCommand(registry, data.terminal.helpTitle, GROUPS.terminal));

  return new TerminalSession(registry, {
    prompt: data.terminal.prompt,
    welcome: data.terminal.welcome.map(system),
    unknownCommand: (name) => fill(data.terminal.unknownCommand, { name }),
  });
};
