import { Guard } from "../types";

export const isRecord: Guard<Record<string, unknown>> = (value): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

export const isText: Guard<string> = (value): value is string => typeof value === "string";

export const isFiniteNumber: Guard<number> = (value): value is number => typeof value === "number" && Number.isFinite(value);

export const isOptionalBoolean: Guard<boolean | undefined> = (value): value is boolean | undefined => (
  value === undefined || typeof value === "boolean"
);

export const isArrayOf = <T>(guard: Guard<T>): Guard<T[]> => (value): value is T[] => Array.isArray(value) && value.every(guard);

export const isTextArray: Guard<string[]> = isArrayOf(isText);
