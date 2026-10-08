// JSON from outside the program, parsed without throwing: undefined when it is not JSON, so a guard can decide
// what the value is.
export const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};
