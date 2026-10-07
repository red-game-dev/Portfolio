import { SECTION_IDS } from "@/config/sections";
import { SOCIAL_URLS } from "@/config/social";
import { PortfolioData } from "@/data/resume";
import { TerminalDialog, TerminalDialogAction } from "@/packages/interaction/terminal";
import { collapseWhitespace, fill } from "@/packages/text/format";
import { createRosterLevels } from "@/services/roster";
import { Character } from "@/types/roster";


const linkedInOf = (data: PortfolioData) => SOCIAL_URLS.linkedIn(data.socialMedia.byUsername.linkedIn);

// The ways to get in touch, with the email subject prefilled for what the visitor was looking at.
export const contactActions = (data: PortfolioData, subject: string): TerminalDialogAction[] => {
  const { labels } = data.terminal.red;

  return [
    { label: labels.email, kind: "link", target: `mailto:${data.details.email}?subject=${encodeURIComponent(subject)}` },
    { label: labels.linkedIn, kind: "link", target: linkedInOf(data) },
    { label: labels.cv, kind: "link", target: data.cv },
    { label: labels.caseStudies, kind: "navigate", target: SECTION_IDS.caseStudies },
  ];
};

export const quotesOf = (data: PortfolioData, count = 2) => data.recommendations
  .slice(0, count)
  .map((recommendation) => `"${collapseWhitespace(recommendation.quote)}" ${recommendation.role}, ${recommendation.company}`);

// The contact card the terminal's contact and sudo commands open.
export const createContactDialog = (data: PortfolioData): TerminalDialog => {
  const { contact } = data.terminal;

  return {
    title: contact.title,
    subtitle: contact.subtitle,
    sections: [
      { heading: contact.heading, items: [data.details.email, `${data.details.phone}, ${data.details.contactTime.toLowerCase()}`, linkedInOf(data)] },
      { heading: data.terminal.red.labels.recommendations, items: quotesOf(data) },
    ],
    actions: contactActions(data, contact.subject),
  };
};

// The card a role opens, from the terminal (red hire as ...) or from the character select: the level,
// the abilities, what people say and a way to get in touch. It never names where the role was played.
export const createHireDialog = (data: PortfolioData, character: Character): TerminalDialog => {
  const { red } = data.terminal;
  const level = createRosterLevels(data.roster).level(character);

  return {
    title: red.hireTitle,
    subtitle: `${character.characterClass}, ${red.labels.level} ${level}`,
    sections: [
      { heading: red.labels.abilities, items: character.abilities },
      { heading: red.labels.recommendations, items: quotesOf(data) },
    ],
    actions: contactActions(data, fill(red.hireSubject, { role: character.characterClass })),
  };
};

export const createHireDialogs = (data: PortfolioData): Record<string, TerminalDialog> => Object.fromEntries(
  data.roster.characters.map((character) => [character.characterClass, createHireDialog(data, character)]),
);
