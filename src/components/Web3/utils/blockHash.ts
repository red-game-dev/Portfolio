const MODULUS = 4294967296;

const hashOf = (text: string, seed: number) => {
  let hash = seed;

  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) % MODULUS;
  }

  return hash.toString(16).padStart(8, "0");
};

// A stable, made up block hash from a capability's name: it reads like an explorer without claiming to be
// one, and the server and the browser always agree on it.
export const blockHash = (text: string) => `0x${hashOf(text, 7)}${hashOf(text, 13).slice(0, 4)}`;

export const GENESIS_HASH = "0x000000000000";
