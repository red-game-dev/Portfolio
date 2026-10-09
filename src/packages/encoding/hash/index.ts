export interface TextHashOptions {
  // Where the hash starts, so the same text can give unrelated hashes.
  seed?: number;
  // What each character multiplies the hash by before it is added.
  multiplier?: number;
  // The hash is kept below this, without bitwise operators.
  modulus?: number;
}

// A stable number from text, the same on the server and in every browser: a polynomial hash of its characters.
// Not for anything security related. Characters are read one code point at a time, by their first UTF-16 unit.
export const hashText = (text: string, { seed = 7, multiplier = 31, modulus = 2 ** 32 }: TextHashOptions = {}): number => {
  let hash = seed;

  for (const character of text) {
    hash = (hash * multiplier + character.charCodeAt(0)) % modulus;
  }

  return hash;
};

// A made up hash of text as `digits` hex digits, padded with zeros: what a commit or a block looks like, without
// claiming to be one.
export const hexHash = (text: string, digits: number, seed = 7): string => hashText(text, { seed, modulus: 16 ** digits })
  .toString(16)
  .padStart(digits, "0");
