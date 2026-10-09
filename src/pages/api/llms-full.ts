import type { NextApiRequest, NextApiResponse } from "next";

import { SITE_URL } from "@/config/site";
import { portfolioData } from "@/data/resume";
import { createLlmsFullTxt } from "@/services/seo/llms";
import { servePlainText } from "@/services/seo/text";

// Served at /llms-full.txt (a rewrite in next.config.js): everything the site says as plain text, for language
// models that read a site whole.
export default function handler(_request: NextApiRequest, response: NextApiResponse) {
  servePlainText(response, createLlmsFullTxt(portfolioData, SITE_URL));
}
