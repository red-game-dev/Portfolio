import { portfolioData } from "@/data/resume";
import { SeoDetails } from "@/types/seo";

const { details, headline, cvDocument, fullResume, cv } = portfolioData;

const name = details.name;
// Proof figures are picked by id, never by value, so the description changes when the figure does.
const industryYears = details.proof.find((figure) => figure.id === "industry")?.value ?? "";

// What search engines, link previews and AI crawlers read about the site. Every fact comes from the content the
// page shows; only the questions and the joining words are written here.
const seoDetails: SeoDetails = {
  defaultTitle: `${name}, ${cvDocument.headline}`,
  titleTemplate: `%s | ${name}`,
  description: `${details.hook} ${industryYears} years in the industry. ${headline.availability}`,
  resume: {
    title: `${name}, CV`,
    description: `The short CV of ${name}, ${cvDocument.headline}: every role with its dates, figures and skill years. ${headline.availability}`,
  },
  socialCard: { path: "/images/social-card.png", width: 1200, height: 630, alt: `${name}, ${cvDocument.headline}` },
  faq: [
    { question: `Who is ${name}?`, answer: cvDocument.summary.join(" ") },
    { question: `What roles is ${name} open to?`, answer: headline.lines.join(" ") },
    { question: `Is ${name} open to relocation?`, answer: `${headline.availability} Works: ${details.location}.` },
    { question: `What contracts does ${name} take?`, answer: details.jobType },
    { question: `What has ${name} done?`, answer: cvDocument.highlights.join(" ") },
    {
      question: `What are ${name}'s main skills?`,
      answer: cvDocument.skills.map((line) => `${line.label}: ${line.names.join(", ")}.`).join(" "),
    },
    { question: `How do I contact ${name}?`, answer: `Email ${details.email}. ${details.contactTime}.` },
  ],
  llms: {
    pagesLabel: "Pages",
    contactLabel: "Contact",
    links: [
      { label: "Portfolio", path: "/", note: "the whole site: roles, systems built, AI work, projects and recommendations" },
      { label: "CV", path: "/resume/", note: "the short CV as a page" },
      { label: "CV (PDF)", path: cv, note: "the same CV to download" },
      { label: fullResume.label, path: fullResume.url, note: "every role in full" },
      { label: "Everything on the site as text", path: "/llms-full.txt", note: "the content this site's Ask Red agent answers from" },
    ],
  },
};

export default seoDetails;
