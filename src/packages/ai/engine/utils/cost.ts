import { ModelPrice, TokenUsage } from "../domain/types";

export const NO_USAGE: TokenUsage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };

// What a call cost in micro dollars: prices are per million tokens, so each token costs its price in micros.
export const costMicros = (usage: TokenUsage, price: ModelPrice): number => usage.input * price.input
  + usage.cacheWrite * price.cacheWrite
  + usage.cacheRead * price.cacheRead
  + usage.output * price.output;

export const addUsage = (total: TokenUsage, usage: TokenUsage): TokenUsage => ({
  input: total.input + usage.input,
  cacheWrite: total.cacheWrite + usage.cacheWrite,
  cacheRead: total.cacheRead + usage.cacheRead,
  output: total.output + usage.output,
});

// Of everything read as input, the share served from the provider's cache.
export const cacheHitRatio = (usage: TokenUsage): number => {
  const read = usage.input + usage.cacheWrite + usage.cacheRead;

  return read === 0 ? 0 : usage.cacheRead / read;
};

// About four characters to a token in English: close enough to budget a prompt before sending it.
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
