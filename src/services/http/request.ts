import type { NextApiRequest } from "next";

// The first value of a header, and the first entry of a comma separated one (a proxy's list of addresses).
export const firstHeader = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value)?.split(",")[0].trim();

// Whether a request comes from the site itself: a browser on another origin cannot forge this header.
export const isSameOrigin = (request: NextApiRequest): boolean => {
  const origin = firstHeader(request.headers.origin);

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
};

// The visitor's address as Vercel's edge passes it on, for counting visitors without keeping who they are.
export const clientAddress = (request: NextApiRequest): string =>
  firstHeader(request.headers["x-real-ip"]) ?? firstHeader(request.headers["x-forwarded-for"]) ?? request.socket.remoteAddress ?? "unknown";
