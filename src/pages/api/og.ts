import type { NextApiRequest, NextApiResponse } from "next";

import { portfolioData } from "@/data/resume";
import { shareCardOf } from "@/services/seo/shareCard";
import { renderShareImage } from "@/services/seo/shareImage";

// Served at /og/card.png (a rewrite in next.config.js, since robots.txt keeps crawlers out of /api/ and a share card
// a crawler may not fetch is not shown): the share picture, drawn from the content on each cache miss.
export default async function handler(_request: NextApiRequest, response: NextApiResponse) {
  const png = await renderShareImage(shareCardOf(portfolioData));

  response.setHeader("Content-Type", "image/png");
  response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  response.status(200).send(png);
}
