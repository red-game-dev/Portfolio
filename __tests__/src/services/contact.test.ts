import { portfolioData } from "@/data/resume";
import { contactActions, createContactDialog, createHireDialog, createHireDialogs, quotesOf } from "@/services/contact";

describe("contact service", () => {
  it("offers email with the subject filled in, LinkedIn, the CV and the case studies", () => {
    const actions = contactActions(portfolioData, "Hiring: a lead & more");

    expect(actions.map((action) => action.kind)).toEqual(["link", "link", "link", "navigate"]);
    expect(actions[0].target).toBe(`mailto:${portfolioData.details.email}?subject=Hiring%3A%20a%20lead%20%26%20more`);
    expect(actions[1].target).toContain(portfolioData.socialMedia.byUsername.linkedIn);
    expect(actions[2].target).toBe(portfolioData.cv);
  });

  it("quotes recommendations on one line each, with who said them", () => {
    const quotes = quotesOf(portfolioData, 2);

    expect(quotes).toHaveLength(2);
    quotes.forEach((quote) => {
      expect(quote).not.toMatch(/\s{2,}|\n/);
      expect(quote.startsWith("\"")).toBe(true);
    });
  });

  it("builds the contact card from the details", () => {
    const dialog = createContactDialog(portfolioData);

    expect(dialog.sections[0].items).toContain(portfolioData.details.email);
    expect(dialog.actions).toHaveLength(4);
  });

  it("opens a hire card per character, with its level and abilities, naming no employer outside the quotes", () => {
    const dialogs = createHireDialogs(portfolioData);
    const companies = new Set(portfolioData.roster.characters.flatMap((character) => character.tenures.map((tenure) => tenure.company)));

    expect(Object.keys(dialogs)).toEqual(portfolioData.roster.characters.map((character) => character.characterClass));
    portfolioData.roster.characters.forEach((character) => {
      const dialog = createHireDialog(portfolioData, character);
      // The quotes say who recommended me; the role itself never says where it was played.
      const text = JSON.stringify([dialog.title, dialog.subtitle, dialog.sections[0]]);

      expect(dialog.subtitle).toMatch(new RegExp(`^${character.characterClass}, .+ \\d+$`));
      expect(dialog.sections[0].items).toEqual(character.abilities);
      companies.forEach((company) => expect(text).not.toContain(company));
    });
  });
});
