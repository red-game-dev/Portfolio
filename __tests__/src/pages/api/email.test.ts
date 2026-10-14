/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from "next";

import handler from "@/pages/api/email/[art]";

const request = (method: string, art: string) => ({ method, query: { art } } as unknown as NextApiRequest);

const response = () => {
  const result = { status: 0, body: null as unknown, headers: {} as Record<string, string | number> };
  const res = {
    setHeader: (name: string, value: string | number) => {
      result.headers[name] = value;
    },
    status: (code: number) => {
      result.status = code;

      return res;
    },
    send: (body: unknown) => {
      result.body = body;

      return res;
    },
    end: () => res,
  };

  return { res: res as unknown as NextApiResponse, result };
};

describe("the email art route", () => {
  test("serves a kind's art as a GIF kept at the edge for good, since its address carries its version", () => {
    const { res, result } = response();

    handler(request("GET", "message.gif"), res);

    expect(result.status).toBe(200);
    expect(result.headers["Content-Type"]).toBe("image/gif");
    expect(result.headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
    expect((result.body as Buffer).subarray(0, 6).toString()).toBe("GIF89a");
    expect(result.headers["Content-Length"]).toBe((result.body as Buffer).length);
  });

  test("answers 404 for any other name and 405 for anything but a read", () => {
    const missing = response();
    const posted = response();

    handler(request("GET", "secret.gif"), missing.res);
    handler(request("POST", "message.gif"), posted.res);

    expect(missing.result.status).toBe(404);
    expect(posted.result.status).toBe(405);
    expect(posted.result.headers.Allow).toBe("GET, HEAD");
  });
});
