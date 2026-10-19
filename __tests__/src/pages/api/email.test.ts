/**
 * @jest-environment node
 */
import handler from "@/pages/api/email/[art]";

import { instanceOf } from "../../fixtures/guards";
import { apiRequest, apiResponse } from "../../fixtures/next";

const request = (method: string, art: string) => apiRequest({ method, query: { art } });

const response = apiResponse;

describe("the email art route", () => {
  test("serves a kind's art as a GIF kept at the edge for good, since its address carries its version", () => {
    const { res, result } = response();

    handler(request("GET", "message.gif"), res);

    expect(result.status).toBe(200);
    expect(result.headers["Content-Type"]).toBe("image/gif");
    expect(result.headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
    const gif = instanceOf(result.body, Buffer);

    expect(gif.subarray(0, 6).toString()).toBe("GIF89a");
    expect(result.headers["Content-Length"]).toBe(gif.length);
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
