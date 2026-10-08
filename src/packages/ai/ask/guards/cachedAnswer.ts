import { Guard, isRecord, isText, isTextArray } from "@/packages/core/domain";

import { CachedAnswer } from "../domain/types";

// A cached answer read back from a shared store, which any version of the site may have written.
export const isCachedAnswer: Guard<CachedAnswer> = (value): value is CachedAnswer => isRecord(value)
  && isText(value.text)
  && isText(value.label)
  && isTextArray(value.sources);
