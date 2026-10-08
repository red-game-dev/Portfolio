import { ModelPrice, TokenUsage } from "../domain/types";

// What a call cost in micro dollars: prices are per million tokens, so each token costs its price in micros.
export const costMicros = (usage: TokenUsage, price: ModelPrice): number => usage.input * price.input
  + usage.cacheWrite * price.cacheWrite
  + usage.cacheRead * price.cacheRead
  + usage.output * price.output;

export const NO_USAGE: TokenUsage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
