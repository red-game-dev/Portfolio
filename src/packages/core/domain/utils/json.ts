// JSON from outside the program, parsed without throwing: undefined when it is not JSON, so a guard can decide
// what the value is.
export const parseJson = (text: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(text);

    return parsed;
  } catch {
    return undefined;
  }
};
