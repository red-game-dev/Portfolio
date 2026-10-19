import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";


// Next's API request and response for a route under test: real Node messages with Next's parts added, the response
// keeping what the route set (its status, headers and body) for the test to read.

interface RequestParts {
  method: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  remoteAddress?: string;
}

export const apiRequest = ({ method, headers = {}, query = {}, body, remoteAddress }: RequestParts): NextApiRequest => {
  const socket = new Socket();

  if (remoteAddress) {
    Object.defineProperty(socket, "remoteAddress", { value: remoteAddress });
  }

  const message = new IncomingMessage(socket);

  message.method = method;
  message.headers = headers;

  return Object.assign(message, { query, cookies: {}, body, env: {} });
};

export interface ApiResult {
  status: number;
  body: unknown;
  headers: Record<string, string | number | readonly string[]>;
  isEnded: boolean;
}

export const apiResponse = () => {
  const result: ApiResult = { status: 0, body: null, headers: {}, isEnded: false };
  const res: NextApiResponse = Object.assign(new ServerResponse(new IncomingMessage(new Socket())), {
    setHeader: (name: string, value: string | number | readonly string[]) => {
      result.headers[name] = value;

      return res;
    },
    status: (code: number) => {
      result.status = code;

      return res;
    },
    send: (body: unknown) => {
      result.body = body;
    },
    json: (body: unknown) => {
      result.body = body;
    },
    end: () => {
      result.isEnded = true;

      return res;
    },
    redirect: () => res,
    setDraftMode: () => res,
    setPreviewData: () => res,
    clearPreviewData: () => res,
    revalidate: () => Promise.resolve(),
  });

  return { res, result };
};
