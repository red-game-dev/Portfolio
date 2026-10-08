import { AskLimits } from "../config/limits";
import { AskDepth, AskRequest, AskTurn } from "../domain/types";

const DEPTHS: AskDepth[] = ["quick", "deep"];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const toTurn = (value: unknown, limits: AskLimits): AskTurn | null => {
  if (!isRecord(value) || typeof value.question !== "string" || typeof value.answer !== "string") {
    return null;
  }

  const question = value.question.trim().slice(0, limits.questionLength);
  const answer = value.answer.trim().slice(0, limits.answerLength);

  return question && answer ? { question, answer } : null;
};

// Whatever arrives over the wire, as a request the service can trust, or null. A question past the limit is
// refused rather than cut, since a cut question may ask something else; history is trimmed instead.
export const parseAskRequest = (body: unknown, limits: AskLimits): AskRequest | null => {
  if (!isRecord(body) || typeof body.question !== "string") {
    return null;
  }

  const question = body.question.trim();

  if (!question || question.length > limits.questionLength) {
    return null;
  }

  const depth = DEPTHS.find((candidate) => candidate === body.depth) ?? "quick";
  const history = (Array.isArray(body.history) ? body.history : [])
    .map((turn) => toTurn(turn, limits))
    .filter((turn): turn is AskTurn => turn !== null)
    .slice(-limits.historyTurns);

  return { question, depth, history };
};
