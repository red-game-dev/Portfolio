import type { NextApiRequest, NextApiResponse } from "next";

import { ASK_ERROR_STATUS, AskErrorCode, encodeAskEvent } from "@/packages/ai/ask";
import { getAskService, visitorKey } from "@/services/ask/server";
import { clientAddress, isSameOrigin } from "@/services/http/request";

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

const refuse = (response: NextApiResponse, code: AskErrorCode) => response.status(ASK_ERROR_STATUS[code]).json({ error: code });

// Ask Red: a question about this site, answered from the site's own content by the domain service, streamed
// back as one JSON event per line. The route only speaks HTTP; every decision is the service's.
const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");

    return response.status(405).json({ error: "invalid" });
  }

  // Only the site itself may ask.
  if (!isSameOrigin(request)) {
    return refuse(response, "invalid");
  }

  const service = getAskService();

  if (!service) {
    return refuse(response, "unavailable");
  }

  const prepared = await service.prepare(request.body, visitorKey(clientAddress(request)));

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
