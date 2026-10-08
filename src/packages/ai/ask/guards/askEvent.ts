import { Guard, isRecord, isText, isTextArray } from "@/packages/core/domain";

import { isAskErrorCode } from "../domain/status";
import { AskEvent } from "../domain/types";

// An event read off the wire, checked down to its payload: a text event without text is no event.
export const isAskEvent: Guard<AskEvent> = (value): value is AskEvent => {
  if (!isRecord(value)) {
    return false;
  }

  switch (value.type) {
    case "model":
      return isText(value.label);
    case "text":
      return isText(value.text);
    case "sources":
      return isTextArray(value.keys);
    case "done":
      return true;
    case "error":
      return isAskErrorCode(value.code);
    default:
      return false;
  }
};
