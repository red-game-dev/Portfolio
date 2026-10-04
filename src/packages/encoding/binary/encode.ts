const WHITESPACE = /\s/;

export const isWhitespace = (character: string) => WHITESPACE.test(character);

export const toBinary = (text: string, separator = " ") => [...text]
  .map((character) => character.charCodeAt(0).toString(2))
  .join(separator);

// A stand-in for `text` with the same length and word shape, built from the text's own character
// codes. It is deterministic, so a scrambled state renders identically on the server and the client.
export const toBinaryMask = (text: string) => {
  const bits = toBinary(text, "");

  return Array.from(text)
    .map((character, index) => (isWhitespace(character) ? character : bits.charAt(index % bits.length)))
    .join("");
};
