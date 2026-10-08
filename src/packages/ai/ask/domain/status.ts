import { AskErrorCode } from "./types";

export const ASK_ERROR_CODES = ["invalid", "limited", "unavailable", "failed"] as const satisfies readonly AskErrorCode[];

// The HTTP status each refusal travels as, one map for the server and the client both.
export const ASK_ERROR_STATUS: Record<AskErrorCode, number> = { invalid: 400, limited: 429, unavailable: 503, failed: 502 };

export const askErrorForStatus = (status: number): AskErrorCode => ASK_ERROR_CODES.find((code) => ASK_ERROR_STATUS[code] === status) ?? "failed";

export const isAskErrorCode = (value: unknown): value is AskErrorCode => ASK_ERROR_CODES.some((code) => code === value);
