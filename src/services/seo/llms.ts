import { SOCIAL_URLS } from "@/config/social";
import { PortfolioData } from "@/data/resume";
import { collapseWhitespace } from "@/packages/text/format";
import { PortfolioKnowledgeMapper } from "@/services/ask/knowledge";
import { absoluteUrl, siteRoot } from "@/services/seo/structuredData";
import { SeoDetails } from "@/types/seo";

// Server only: this pulls in the whole knowledge mapper, so only the text routes import it, never the page.
// /llms.txt in the shape llmstxt.org sets out: a title, a one line summary as a quote, a few paragraphs, then
// lists of links. Built from the content, so it never says anything the page does not.
export const createLlmsTxt = (data: PortfolioData, seo: SeoDetails, host: string): string => {
  const root = siteRoot(host);
  const { details, headline, cvDocument, socialMedia } = data;

  return [
    `# ${details.name}`,
    `> ${cvDocument.headline}. ${collapseWhitespace(headline.lines.join(" "))}`,
    ...cvDocument.summary.map(collapseWhitespace),
    `${headline.availability} Works: ${details.location}. Job type: ${details.jobType}.`,
    `## ${seo.llms.pagesLabel}`,
    seo.llms.links.map((link) => `- [${link.label}](${absoluteUrl(root, link.path)}): ${link.note}`).join("\n"),
    `## ${seo.llms.contactLabel}`,
    [
      `- Email: ${details.email}`,
      `- LinkedIn: ${SOCIAL_URLS.linkedIn(socialMedia.byUsername.linkedIn)}`,
      ...data.github.slice(0, 1).map((account) => `- GitHub: ${account.link}`),
    ].join("\n"),
  ].join("\n\n").concat("\n");
};

// /llms-full.txt: everything the site says as plain text, the same text the Ask Red agent answers from, without
// the keys it cites sources by.
export const createLlmsFullTxt = (data: PortfolioData, host: string): string =>
  `# ${data.details.name} (${siteRoot(host)}/)\n\n${new PortfolioKnowledgeMapper({ citeKeys: false }).map(data)}\n`;
