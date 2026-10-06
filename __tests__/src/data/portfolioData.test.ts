import { isLens, LENS_SETTINGS, LENS_STAT_MAX, LENSES } from "@/config/lenses";
import { AUDIENCE_ANCHORS, industryAnchor, ROLE_ANCHORS } from "@/config/sections";
import { portfolioData } from "@/data/resume";

const normalise = (name: string) => name.trim().toLowerCase();

describe("skill areas content", () => {
  const items = portfolioData.skillAreas.flatMap((area) => area.items);

  test("every area has a unique label and at least one item", () => {
    const labels = portfolioData.skillAreas.map((area) => area.label);

    expect(new Set(labels).size).toBe(labels.length);
    expect(portfolioData.skillAreas.every((area) => area.items.length > 0)).toBe(true);
  });

  test("no item is listed twice across areas", () => {
    expect(new Set(items.map(normalise)).size).toBe(items.length);
  });

  test("no item repeats a skill that already has a scored bar", () => {
    const scored = new Set(Object.values(portfolioData.skills)
      .flat()
      .map((skill) => normalise(skill.name)));

    expect(items.filter((item) => scored.has(normalise(item)))).toEqual([]);
  });
});

describe("portfolio copy", () => {
  test("no case study repeats a title and each one has points to read", () => {
    const titles = portfolioData.caseStudies.map((caseStudy) => caseStudy.title);

    expect(new Set(titles).size).toBe(titles.length);
    expect(portfolioData.caseStudies.every((caseStudy) => caseStudy.points.length > 0)).toBe(true);
  });

  test("nothing in the portfolio data uses an em dash", () => {
    expect(JSON.stringify(portfolioData)).not.toContain(String.fromCharCode(0x2014));
  });
});

describe("first screen chips", () => {
  test("every industry chip lands on at least one role", () => {
    const empty = portfolioData.headline.industries
      .filter(({ industry }) => !portfolioData.experience.some((entry) => entry.industries?.includes(industry)))
      .map(({ label }) => label);

    expect(empty).toEqual([]);
  });

  test("every role link points at an anchor that exists on the page", () => {
    const anchors = [
      ...Object.values(AUDIENCE_ANCHORS),
      ...Object.values(ROLE_ANCHORS),
      ...portfolioData.headline.industries.map(({ industry }) => industryAnchor(industry)),
    ];

    expect(portfolioData.headline.roles.filter(({ target }) => !anchors.includes(target))).toEqual([]);
  });
});

describe("audience views", () => {
  test("the chooser offers every view exactly once", () => {
    expect(portfolioData.lens.cards.map((card) => card.lens).sort()).toEqual([...LENSES].sort());
  });

  test("card stats stay within the scale the pips draw", () => {
    const stats = portfolioData.lens.cards.flatMap((card) => card.stats);

    expect(stats.filter((stat) => stat.value < 1 || stat.value > LENS_STAT_MAX)).toEqual([]);
  });

  test("only real views are recognised from a link", () => {
    expect(LENSES.every(isLens)).toBe(true);
    expect([null, "", "Recruiter", "admin", 1].some(isLens)).toBe(false);
  });

  test("every role has a product outcome for product readers", () => {
    expect(portfolioData.experience.filter((entry) => !entry.productOutcome).map((entry) => entry.title)).toEqual([]);
  });

  test("every skill the recruiter glance names is a skill the forge knows", () => {
    const known = new Set(Object.values(portfolioData.skills).flat()
.map((skill) => skill.name));
    const named = portfolioData.lens.glance.recruiter.skillGroups.flatMap((group) => group.names);

    expect(named.filter((name) => !known.has(name))).toEqual([]);
  });

  test("the glance picks proof figures and roster classes that exist", () => {
    const { recruiter, product } = portfolioData.lens.glance;
    const classes = new Set(portfolioData.roster.characters.map((character) => character.characterClass));
    const values = new Set(portfolioData.details.proof.map((figure) => figure.value));

    expect([...recruiter.roleClasses, ...product.levelClasses].filter((name) => !classes.has(name))).toEqual([]);
    expect(product.proofValues.filter((value) => !values.has(value))).toEqual([]);
    expect(portfolioData.serviceGroups.some((group) => group.label === portfolioData.lens.productServiceGroup)).toBe(true);
  });

  test("immersion only grows from the quick view to the full one", () => {
    const rank = { still: 0, animated: 1, none: 0, soft: 1, full: 2, off: 0, headings: 1, all: 2 };
    const ordered = LENSES.map((lens) => LENS_SETTINGS[lens]);

    ordered.slice(1).forEach((settings, index) => {
      const previous = ordered[index];

      expect(rank[settings.backdrop]).toBeGreaterThanOrEqual(rank[previous.backdrop]);
      expect(rank[settings.transitions]).toBeGreaterThanOrEqual(rank[previous.transitions]);
      expect(rank[settings.decode]).toBeGreaterThanOrEqual(rank[previous.decode]);
    });
  });
});

describe("blueprints", () => {
  const { labels, ...placed } = portfolioData.blueprints;
  const deepDives = portfolioData.projects.flatMap((project) => (project.deepDive ? [project.deepDive.blueprint] : []));
  const blueprints = [...Object.values(placed).flat(), ...deepDives.filter((blueprint) => !Object.values(placed).flat().includes(blueprint))];
  const EMPLOYERS = ["Conrad", "Chiliz", "HyperPlay", "Authentic", "KPMG", "reNFT", "CoinOn"];

  test("no blueprint names an employer: they show kinds of architecture, not companies", () => {
    const named = blueprints.filter((blueprint) => EMPLOYERS.some((name) => JSON.stringify(blueprint).includes(name)));

    expect(named.map((blueprint) => blueprint.id)).toEqual([]);
  });

  test("every blueprint gives recruiters a role, a scale and a stack, and every journey has steps", () => {
    const thin = blueprints.filter(({ summary, journeys = [] }) =>
      !summary.role || !summary.scale || summary.stack.length === 0 || journeys.some((journey) => journey.steps.length === 0));

    expect(thin.map((blueprint) => blueprint.id)).toEqual([]);
  });

  test("every blueprint has a unique id", () => {
    const ids = Object.values(placed).flat().map((blueprint) => blueprint.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.values(labels).every(Boolean)).toBe(true);
  });

  test.each(blueprints.map((blueprint) => [blueprint.id, blueprint] as const))("%s: every wire joins boxes that exist", (_, blueprint) => {
    const { groups, edges } = blueprint.architecture;
    const ids = [...groups.map((group) => group.id), ...groups.flatMap((group) => group.nodes.map((node) => node.id))];
    const known = new Set(ids);

    expect(known.size).toBe(ids.length);
    expect(edges.filter((edge) => !known.has(edge.from) || !known.has(edge.to))).toEqual([]);
  });

  test.each(blueprints.map((blueprint) => [blueprint.id, blueprint] as const))("%s: every frame fits the grid", (_, blueprint) => {
    const { columns, groups } = blueprint.architecture;

    expect(groups.filter(({ place }) => place.col < 1 || place.col + (place.colSpan ?? 1) - 1 > columns)).toEqual([]);
  });
});
