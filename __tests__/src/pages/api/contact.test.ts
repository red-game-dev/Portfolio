/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from "next";

import { clientAddress, firstHeader, isSameOrigin } from "@/services/http/request";

jest.mock("@/services/contact/server", () => ({
  getContactService: jest.fn(),
  contactVisitor: jest.fn(async () => "visitor-hash"),
}));

const server = jest.requireMock<{ getContactService: jest.Mock; contactVisitor: jest.Mock }>("@/services/contact/server");

// The route, loaded once the server it calls is mocked.
const handlerOf = async () => (await import("@/pages/api/contact")).default;

// A request from the site itself, unless told otherwise.
const request = (method: string, headers: Record<string, string> = { origin: "https://www.redgame.dev", host: "www.redgame.dev" }, body: unknown = {}) =>
  ({ method, headers, body, socket: { remoteAddress: "203.0.113.9" } } as unknown as NextApiRequest);

const response = () => {
  const result = { status: 0, body: null as unknown, headers: {} as Record<string, string> };
  const res = {
    setHeader: (name: string, value: string) => {
      result.headers[name] = value;
    },
    status: (code: number) => {
      result.status = code;

      return res;
    },
    json: (body: unknown) => {
      result.body = body;

      return res;
    },
  };

  return { res: res as unknown as NextApiResponse, result };
};

describe("the contact route", () => {
  beforeEach(() => {
    server.getContactService.mockReturnValue({
      status: async () => ({ isOpen: true }),
      send: async (body: { message?: string }) => (body.message === "bad" ? { error: "invalid", problems: ["messageShort"] } : { ok: true }),
    });
  });

  test("says whether the site can send, cached a moment at the edge for everyone", async () => {
    const { res, result } = response();

    await (await handlerOf())(request("GET"), res);
    expect(result).toMatchObject({ status: 200, body: { isOpen: true } });
    expect(result.headers["Cache-Control"]).toContain("s-maxage=30");
  });

  test("sends only for the site itself, never cached, with the refusal's own status", async () => {
    const sent = response();

    await (await handlerOf())(request("POST", undefined, { kind: "feedback", message: "good" }), sent.res);
    expect(sent.result).toMatchObject({ status: 200, body: { ok: true } });
    expect(sent.result.headers["Cache-Control"]).toBe("no-store");
    expect(server.contactVisitor).toHaveBeenCalledWith("203.0.113.9");

    const invalid = response();

    await (await handlerOf())(request("POST", undefined, { message: "bad" }), invalid.res);
    expect(invalid.result).toMatchObject({ status: 400, body: { error: "invalid", problems: ["messageShort"] } });

    const foreign = response();

    await (await handlerOf())(request("POST", { origin: "https://elsewhere.example", host: "www.redgame.dev" }), foreign.res);
    expect(foreign.result).toMatchObject({ status: 403, body: { error: "invalid" } });
  });

  test("refuses other methods, and answers a failure inside with unavailable, saying nothing more", async () => {
    const other = response();

    await (await handlerOf())(request("DELETE"), other.res);
    expect(other.result).toMatchObject({ status: 405 });
    expect(other.result.headers.Allow).toBe("GET, POST");

    server.getContactService.mockImplementation(() => {
      throw new Error("store down: secret detail");
    });

    const broken = response();

    await (await handlerOf())(request("GET"), broken.res);
    expect(broken.result).toEqual(expect.objectContaining({ status: 503, body: { error: "unavailable" } }));
  });
});

describe("what a request says about itself", () => {
  test("the first of a header's values, whether the site sent it, and the visitor's address as the edge passes it on", () => {
    expect(firstHeader("203.0.113.9, 10.0.0.1")).toBe("203.0.113.9");
    expect(firstHeader(["a, b", "c"])).toBe("a");
    expect(firstHeader(undefined)).toBeUndefined();

    expect(isSameOrigin(request("POST"))).toBe(true);
    expect(isSameOrigin(request("POST", { host: "www.redgame.dev" }))).toBe(false);
    expect(isSameOrigin(request("POST", { origin: "not a url", host: "www.redgame.dev" }))).toBe(false);

    expect(clientAddress(request("GET", { "x-real-ip": "198.51.100.4", "x-forwarded-for": "192.0.2.1" }))).toBe("198.51.100.4");
    expect(clientAddress(request("GET", { "x-forwarded-for": "192.0.2.1, 10.0.0.1" }))).toBe("192.0.2.1");
    expect(clientAddress(request("GET", {}))).toBe("203.0.113.9");
  });
});
