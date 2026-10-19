import { readFileSync } from "fs";
import { join } from "path";

import { SITE_URL } from "@/config/site";
import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";
import { isRecord, isText } from "@/packages/core/domain";
import { createLlmsFullTxt, createLlmsTxt } from "@/services/seo/llms";
import { createStructuredData, serializeStructuredData } from "@/services/seo/structuredData";

const ROOT = join(__dirname, "../../../..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const HOST = SITE_URL;

type Node = Record<string, unknown>;

// The graph's nodes, each read as the plain object schema.org JSON is.
const graphOf = (page: "home" | "resume"): Node[] => {
  const graph: unknown = createStructuredData(portfolioData, seoDetails, HOST, page);
  const nodes = isRecord(graph) ? graph["@graph"] : null;

  return Array.isArray(nodes) ? nodes.filter(isRecord) : [];
};

// The strings in a list, none where it is not one.
const textsOf = (value: unknown): string[] => (Array.isArray(value) ? value.filter(isText) : []);

// Every { "@id": ... } reference anywhere in a value.
const references = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(references);
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    const id = value["@id"];
    const ref = entries.length === 1 && isText(id) ? [id] : [];

    return [...ref, ...entries.flatMap(([, child]) => references(child))];
  }

  return [];
};

describe("SEO", () => {
  // The bare domain redirects to www, so www is the only address that may be canonical.
  test("the canonical address is the www one the bare domain redirects to", () => {
    expect(HOST).toBe("https://www.redgame.dev");
  });

  test.each(["home", "resume"] as const)("the %s graph only links to nodes it holds", (page) => {
    const nodes = graphOf(page);
    const ids = new Set(nodes.map((node) => node["@id"]).filter(Boolean));

    expect(references(nodes).filter((id) => !ids.has(id))).toEqual([]);
  });

  test("the person carries the facts a recruiter's search reads, with working profile links", () => {
    const person = graphOf("home").find((node) => node["@type"] === "Person") ?? {};
    const sameAs = textsOf(person.sameAs);

    expect(person.name).toBe(portfolioData.details.name);
    expect(person.jobTitle).toBe(portfolioData.cvDocument.headline);
    expect(person.worksFor).toEqual({ "@type": "Organization", "name": "Conrad Electronic Group" });
    expect(sameAs).toEqual(expect.arrayContaining([expect.stringContaining("linkedin.com/in/"), "https://github.com/red-game-dev"]));
    expect(sameAs.filter((url) => url.includes("/@"))).toEqual([]);
    expect(textsOf(person.knowsAbout).length).toBeGreaterThan(50);
  });

  test("every question has an answer, and every project date is an ISO month", () => {
    const nodes = graphOf("home");
    const faq = nodes.find((node) => node["@type"] === "FAQPage") ?? {};
    const questions: unknown[] = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
    const answerOf = (question: unknown) => {
      const answer = isRecord(question) ? question.acceptedAnswer : null;

      return isRecord(answer) && isText(answer.text) ? answer.text : "";
    };
    const answers = questions.map(answerOf);

    expect(questions).toHaveLength(seoDetails.faq.length);

    expect(answers.filter((answer) => answer.trim().length < 20)).toEqual([]);
    expect(nodes.filter((node) => node["@type"] === "CreativeWork" && !/^\d{4}(-\d{2})?$/.test(String(node.dateCreated)))).toEqual([]);
  });

  test("the script body cannot close its tag early and carries no em dash", () => {
    const body = serializeStructuredData(createStructuredData(portfolioData, seoDetails, HOST, "home"));

    expect(body).not.toContain("<");
    expect(body).not.toContain("—");
    expect(JSON.parse(body)).toHaveProperty("@graph");
  });

  test("llms.txt follows llmstxt.org and links only to absolute URLs on this site", () => {
    const text = createLlmsTxt(portfolioData, seoDetails, HOST);
    const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);

    expect(text.startsWith(`# ${portfolioData.details.name}\n\n> `)).toBe(true);
    expect(links.filter((link) => !link.startsWith(`${HOST}/`))).toEqual([]);
    expect(links).toEqual(expect.arrayContaining([`${HOST}/resume/`, `${HOST}/llms-full.txt`]));
    expect(text).not.toContain("—");
  });

  test("llms-full.txt is the agent's knowledge without the keys it cites by", () => {
    const text = createLlmsFullTxt(portfolioData, HOST);

    expect(text).not.toContain("[key:");
    expect(text).toContain(portfolioData.cvDocument.headline);
  });

  test("the sitemap lists only pages and files that exist, on the canonical host", () => {
    const locations = [...read("public/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const exists = (path: string) => {
      if (path === "/") {
        return true;
      }

      try {
        return Boolean(read(path.endsWith("/") ? `src/pages${path.slice(0, -1)}.tsx` : `public${path}`));
      } catch {
        return false;
      }
    };

    expect(locations.filter((location) => !location.startsWith(`${HOST}/`))).toEqual([]);
    expect(locations.map((location) => location.slice(HOST.length)).filter((path) => !exists(path))).toEqual([]);
    expect(locations).toEqual(expect.arrayContaining([`${HOST}/`, `${HOST}/resume/`, `${HOST}${portfolioData.cv}`]));
  });

  test("robots.txt points at the sitemap, and every group keeps the API out", () => {
    const robots = read("public/robots.txt");
    const groups = robots.split(/\n\s*\n/).filter((group) => /^User-agent:/m.test(group));

    expect(robots).toContain(`Sitemap: ${HOST}/sitemap.xml`);
    expect(groups.filter((group) => !/^Disallow: \/api\/$/m.test(group))).toEqual([]);
  });
});
