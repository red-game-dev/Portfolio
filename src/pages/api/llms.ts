import type { NextApiRequest, NextApiResponse } from "next";

import { SITE_URL } from "@/config/site";
import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";
import { createLlmsTxt } from "@/services/seo/llms";
import { servePlainText } from "@/services/seo/text";

// Served at /llms.txt (a rewrite in next.config.js): the site in brief for language models (llmstxt.org),
// written from the content on each cache miss.
export default function handler(_request: NextApiRequest, response: NextApiResponse) {
  servePlainText(response, createLlmsTxt(portfolioData, seoDetails, SITE_URL));
}
