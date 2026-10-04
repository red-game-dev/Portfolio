import { isWhitespace } from "./encode";

const invertBit = (bit: string) => (bit === "1" ? "0" : "1");

// The first `revealed` characters show the real text. The rest show bits from `mask`, flipped by a
// pattern that changes with `tick`, so the unresolved tail keeps moving while it decodes.
export const decodeFrame = (text: string, mask: string, revealed: number, tick = 0) => Array.from(text)
  .map((character, index) => {
    if (index < revealed || isWhitespace(character)) {
      return character;
    }

    const bit = mask.charAt(index);
    const isFlipped = tick > 0 && ((index + 1) * 31 + tick * 17) % 7 < 3;

    return isFlipped ? invertBit(bit) : bit;
  })
  .join("");
