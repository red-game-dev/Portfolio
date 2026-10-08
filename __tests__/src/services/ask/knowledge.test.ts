import { ASK_SOURCES } from "@/config/ask";
import { portfolioData } from "@/data/resume";
import { ASK_EVALS } from "@/services/ask/evals";
import { createAskKnowledge } from "@/services/ask/knowledge";
import { createAskInstructions } from "@/services/ask/prompt";

const knowledge = createAskKnowledge(portfolioData);
const lower = knowledge.toLowerCase();

describe("what the agent knows", () => {
  test("every source it may cite has its block, headed with its key", () => {
    ASK_SOURCES.forEach((key) => expect(knowledge).toContain(`[key: ${key}]`));
  });

  test("the instructions name exactly the keys the knowledge is cited by", () => {
    expect(createAskInstructions(portfolioData.details.email)).toContain(`The keys are: ${ASK_SOURCES.join(", ")}.`);
  });

  test("it holds no em dash and never claims a skill year it cannot back", () => {
    expect(knowledge).not.toContain("—");
    expect(knowledge).not.toMatch(/ 0y\b/);
  });

  test("the phone number stays off it: the agent points people to email", () => {
    expect(knowledge).not.toContain(portfolioData.details.phone);
    expect(knowledge).toContain(portfolioData.details.email);
  });

  test("the terminal names every source it can link to", () => {
    expect(Object.keys(portfolioData.terminal.ask.sources).sort()).toEqual([...ASK_SOURCES].sort());
  });
});

describe("the evals", () => {
  test("ids are unique", () => {
    expect(new Set(ASK_EVALS.map((item) => item.id)).size).toBe(ASK_EVALS.length);
  });

  test("everything an answer must mention is on the site, so a good answer can pass", () => {
    const missing = ASK_EVALS.flatMap((item) => [
      ...(item.mentionsAll ?? []).filter((term) => !lower.includes(term.toLowerCase())).map((term) => `${item.id}: ${term}`),
      ...(item.mentionsAny && !item.mentionsAny.some((term) => lower.includes(term.toLowerCase())) ? [`${item.id}: any of ${item.mentionsAny.join(", ")}`] : []),
    ]);

    expect(missing).toEqual([]);
  });
});
