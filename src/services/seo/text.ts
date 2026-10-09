import type { ServerResponse } from "http";

// Answers a page request with plain text instead of a page, cached by the CDN for a day and served stale for a
// week while it refreshes, so crawlers never wait on a render.
export const servePlainText = (res: ServerResponse, body: string): void => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.end(body);
};
