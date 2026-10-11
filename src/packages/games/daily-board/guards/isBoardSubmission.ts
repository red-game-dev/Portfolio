import { Guard, isRecord, isText } from "@/packages/core/domain";

import { BoardSubmission } from "../domain/board";

// Whether a request body has a submission's shape: a day, initials and a score. Its rules are the validator's.
export const isBoardSubmission: Guard<BoardSubmission> = (value): value is BoardSubmission => isRecord(value) && isText(value.day) &&
  isText(value.initials) && typeof value.score === "number";
