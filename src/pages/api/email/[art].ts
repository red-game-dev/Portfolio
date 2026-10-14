import type { NextApiRequest, NextApiResponse } from "next";

import { emailArt } from "@/services/contact/art";

// The art in the site's emails (each kind's light along the top bar and my portrait's reveal, each with its rest), drawn
// on the first request and kept at the edge for good: its address carries a version, so new art comes at a new address.
const handler = (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");

    return response.status(405).end();
  }

  const art = emailArt(String(request.query.art));

  if (!art) {
    response.setHeader("Cache-Control", "public, s-maxage=300");

    return response.status(404).end();
  }

  response.setHeader("Content-Type", "image/gif");
  response.setHeader("Content-Length", art.length);
  response.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  return response.status(200).send(Buffer.from(art));
};

export default handler;
