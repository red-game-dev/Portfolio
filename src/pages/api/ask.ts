import type { NextApiRequest, NextApiResponse } from "next";

import { AskErrorCode, encodeAskEvent } from "@/packages/ai/ask";
import { getAskService, visitorKey } from "@/services/ask/server";

const STATUS: Record<AskErrorCode, number> = { invalid: 400, limited: 429, unavailable: 503, failed: 502 };

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

const firstHeader = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.split(",")[0].trim();

// Only the site itself may ask: a browser on another origin cannot forge this header.
const isSameOrigin = (request: NextApiRequest) => {
  const origin = firstHeader(request.headers.origin);

  try {
    return Boolean(origin) && new URL(origin as string).host === request.headers.host;
  } catch {
    return false;
  }
};

const refuse = (response: NextApiResponse, code: AskErrorCode) => response.status(STATUS[code]).json({ error: code });

// Ask Red: a question about this site, answered by Claude from the site's own content, streamed back as one
// JSON event per line.
const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");

    return response.status(405).json({ error: "invalid" });
  }

  if (!isSameOrigin(request)) {
    return refuse(response, "invalid");
  }

  const service = getAskService();

  if (!service) {
    return refuse(response, "unavailable");
  }

  const address = firstHeader(request.headers["x-real-ip"]) ?? firstHeader(request.headers["x-forwarded-for"]) ?? request.socket.remoteAddress ?? "unknown";
  const prepared = await service.prepare(request.body, visitorKey(address));

  if ("error" in prepared) {
    return refuse(response, prepared.error);
  }

  const controller = new AbortController();

  response.on("close", () => {
    if (!response.writableEnded) {
      controller.abort();
    }
  });

  response.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  });

  // Runs to the end even if the reader leaves: a stopped answer still has to be priced and logged.
  for await (const event of service.answer(prepared.plan, controller.signal)) {
    if (!controller.signal.aborted) {
      response.write(encodeAskEvent(event));
    }
  }

  response.end();
};

export default handler;
