import type { NextApiRequest, NextApiResponse } from "next";

import { readBoard, submitRun } from "@/services/voyage/board/server";

export const config = { api: { bodyParser: { sizeLimit: "2kb" } } };

const firstHeader = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.split(",")[0].trim();

// Only the site itself may post a run: a browser on another origin cannot forge this header.
const isSameOrigin = (request: NextApiRequest) => {
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

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// The daily voyage's board: GET a day's best runs, POST a run to it. Only initials and a score are ever kept; the
// route only speaks HTTP, and the rules are the board's.
const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  try {
    // Everyone sees the same board for a day, so a read is cached at the edge for a few seconds: a burst of reads
    // costs the shared store one, and the pilot who posts gets the fresh board back from the post itself.
    if (request.method === "GET") {
      const day = typeof request.query.day === "string" ? request.query.day : "";

      response.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");

      return DAY.test(day) ? response.status(200).json(await readBoard(day)) : response.status(400).json({ error: "invalid" });
    }

    response.setHeader("Cache-Control", "no-store");

    if (request.method === "POST") {
      if (!isSameOrigin(request)) {
        return response.status(403).json({ error: "invalid" });
      }

      const address = firstHeader(request.headers["x-real-ip"]) ?? firstHeader(request.headers["x-forwarded-for"]) ?? request.socket.remoteAddress ?? "unknown";
      const result = await submitRun(request.body, address);

      if ("error" in result) {
        return response.status(result.error === "busy" ? 429 : 400).json(result);
      }

      return response.status(200).json(result);
    }

    response.setHeader("Allow", "GET, POST");

    return response.status(405).json({ error: "invalid" });
  } catch {
    return response.status(503).json({ error: "unavailable" });
  }
};

export default handler;
