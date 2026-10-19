import type { NextApiRequest, NextApiResponse } from "next";

import { portfolioData } from "@/data/resume";
import { shareCardOf, shareCardVersion } from "@/services/seo/shareCard";
import { renderShareImage } from "@/services/seo/shareImage";

// Served at /og/card.png (a rewrite in next.config.js, since robots.txt keeps crawlers out of /api/ and a share card
// a crawler may not fetch is not shown): the share picture, drawn from the content on each cache miss. An address
// naming a version this deploy does not draw (a preview's next one, or one made up to get past the cache) is turned
// away, never drawn and kept under it.
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");

    return response.status(405).end();
  }

  const card = shareCardOf(portfolioData);
  const asked = request.query.v;

  if (asked !== undefined && asked !== shareCardVersion(card)) {
    response.setHeader("Cache-Control", "no-store");

    return response.status(404).end();
  }

  const png = await renderShareImage(card);

  response.setHeader("Content-Type", "image/png");
  response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  response.status(200).send(png);
}
