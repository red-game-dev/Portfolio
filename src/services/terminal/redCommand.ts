import { PortfolioData } from "@/data/resume";
import { Command, CommandResult, error, heading, output, system } from "@/packages/interaction/terminal";
import { fill } from "@/packages/text/format";
import { contactActions, createHireDialog, quotesOf } from "@/services/contact";
import { TerminalIntent } from "@/types/terminal";

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, " ")
.trim();

const HIRE_PATTERN = /^hire(\s+as)?(\s+|$)/;

// "red <something>": ask me to do a job, or pick the role to hire me for. Each answer streams a short
// "working on it" trail and ends in a dialog with the services, the proof and a way to get in touch.
export const createRedCommand = (data: PortfolioData): Command => {
  const { red } = data.terminal;
  const serviceTitles = new Set(data.serviceGroups.flatMap((group) => group.services.map((service) => service.title)));
  const caseTitles = new Set(data.caseStudies.map((caseStudy) => caseStudy.title));
  const quotes = quotesOf(data);
  const roles = [...data.roster.characters.map((character) => character.characterClass), ...data.headline.audiences.map((link) => link.label)];
  const menu = [...red.intents.map((intent) => `  red ${intent.phrase}`), "  red hire as <role>"];

  const actionsFor = (subject: string) => contactActions(data, subject);

  const runIntent = (intent: TerminalIntent): CommandResult => ({
    lines: [
      heading(intent.title),
      output(intent.pitch),
      ...intent.scan.map((step) => system(`  > ${step} ... ${red.scanDone}`)),
      system(red.opening),
    ],
    effect: {
      type: "dialog",
      dialog: {
        title: red.questTitle,
        subtitle: intent.title,
        sections: [
          { heading: red.labels.services, items: intent.services.filter((title) => serviceTitles.has(title)) },
          { heading: red.labels.proof, items: intent.cases.filter((title) => caseTitles.has(title)) },
          { heading: red.labels.recommendations, items: quotes },
        ],
        actions: actionsFor(intent.subject),
      },
    },
  });

  const listRoles = (message: string): CommandResult => ({
    lines: [heading(red.rolesHeading), output(message), ...roles.map((role) => output(`  red hire as ${role.toLowerCase()}`))],
  });

  const runHire = (role: string): CommandResult => {
    if (!role) {
      return listRoles(red.usage);
    }

    const isMatch = (name: string) => normalise(name) === role || normalise(name).includes(role);
    const names = (candidate: (typeof data.roster.characters)[number]) => [candidate.characterClass, ...(candidate.titles ?? [])];
    const character = data.roster.characters.find((candidate) => names(candidate).some((name) => normalise(name) === role))
      ?? data.roster.characters.find((candidate) => names(candidate).some(isMatch));
    const audience = character ? undefined : data.headline.audiences.find((link) => isMatch(link.label));

    if (!character && !audience) {
      return { lines: [error(fill(red.unknownRole, { role })), ...roles.map((name) => output(`  red hire as ${name.toLowerCase()}`))] };
    }

    if (character) {
      const dialog = createHireDialog(data, character);

      return {
        lines: [heading(`${red.hireTitle}: ${character.characterClass}`), output(`${dialog.subtitle ?? ""}, ${character.abilities.join(", ")}`), system(red.opening)],
        effect: { type: "dialog", dialog },
      };
    }

    const label = audience?.label ?? role;
    const cases = data.caseStudies.filter((caseStudy) => audience && caseStudy.audiences.includes(audience.audience)).map((caseStudy) => caseStudy.title);

    return {
      lines: [heading(`${red.hireTitle}: ${label}`), ...cases.map((title) => output(`  ${title}`)), system(red.opening)],
      effect: {
        type: "dialog",
        dialog: {
          title: red.hireTitle,
          subtitle: label,
          sections: [{ heading: red.labels.proof, items: cases }, { heading: red.labels.recommendations, items: quotes }],
          actions: actionsFor(fill(red.hireSubject, { role: label })),
        },
      },
    };
  };

  return {
    name: "red",
    usage: red.usage,
    summary: red.summary,
    run: (args) => {
      const input = normalise(args.join(" "));

      if (!input) {
        return { lines: [heading(red.summary), ...menu.map(output)] };
      }

      if (HIRE_PATTERN.test(input)) {
        return runHire(input.replace(HIRE_PATTERN, "").trim());
      }

      const intent = red.intents.find((candidate) => [candidate.phrase, ...candidate.aliases].some((phrase) => input === phrase || input.startsWith(`${phrase} `)));

      return intent ? runIntent(intent) : { lines: [error(fill(red.unknownIntent, { input })), ...menu.map(output)] };
    },
  };
};
