import type { NextApiRequest, NextApiResponse } from "next";

import { CONTACT_STATUS } from "@/packages/contact";
import { contactVisitor, getContactService } from "@/services/contact/server";
import { clientAddress, isSameOrigin } from "@/services/http/request";

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

// The site's messages and feedback: GET says whether the site can send one now, POST sends one. Nothing is kept: the
// message goes on by email, and the visitor is counted only by a salted hash. The route only speaks HTTP; every
// decision is the contact service's.
const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  try {
    if (request.method === "GET") {
      // The same answer for everyone, so it is cached at the edge for a moment.
      response.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

      return response.status(200).json(await getContactService().status());
    }

    response.setHeader("Cache-Control", "no-store");

    if (request.method === "POST") {
      // Only the site itself may send.
      if (!isSameOrigin(request)) {
        return response.status(403).json({ error: "invalid" });
      }

      const outcome = await getContactService().send(request.body, await contactVisitor(clientAddress(request)));

      return "error" in outcome ? response.status(CONTACT_STATUS[outcome.error]).json(outcome) : response.status(200).json(outcome);
    }

    response.setHeader("Allow", "GET, POST");

    return response.status(405).json({ error: "invalid" });
  } catch {
    return response.status(503).json({ error: "unavailable" });
  }
};

export default handler;
