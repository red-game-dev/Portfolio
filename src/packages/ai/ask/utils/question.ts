// "  What has Red BUILT with AI?? " and "what has red built with ai" are the same question.
export const normaliseQuestion = (question: string): string => question
  .toLowerCase()
  .replace(/\s+/g, " ")
  .replace(/["'`]/g, "")
  .replace(/[\s?!.]+$/, "")
  .trim();
