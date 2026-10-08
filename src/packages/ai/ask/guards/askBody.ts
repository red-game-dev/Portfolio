import { Guard, isRecord, isText } from "@/packages/core/domain";

import { AskBody, AskDepth, AskTurn } from "../domain/types";

export const isAskDepth: Guard<AskDepth> = (value): value is AskDepth => value === "quick" || value === "deep";

// A request body worth looking at: an object with a question string. Everything else in it is checked by the
// validator and shaped by the mapper.
export const isAskBody: Guard<AskBody> = (value): value is AskBody => isRecord(value) && isText(value.question);

export const isAskTurn: Guard<AskTurn> = (value): value is AskTurn => isRecord(value) && isText(value.question) && isText(value.answer);
