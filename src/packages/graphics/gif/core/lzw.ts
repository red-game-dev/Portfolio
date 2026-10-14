import { ByteWriter } from "./ByteWriter";

// The most codes a GIF's LZW table holds (12 bits); once it is full the table starts again.
const MOST_CODES = 4096;
// A data sub-block holds at most this many bytes after its length.
const BLOCK = 255;

// Palette indices compressed as a GIF image's data: the least code size, then LZW codes of growing width packed from
// the low bit up, in sub-blocks of at most 255 bytes each led by its length, and an empty block to end them. Every index
// must be below 2 to the power of `leastCodeSize`.
export const writeLzw = (out: ByteWriter, indices: Uint8Array, leastCodeSize: number) => {
  const clearCode = 2 ** leastCodeSize;
  const endCode = clearCode + 1;
  const block = new Uint8Array(BLOCK);
  let blockLength = 0;
  let codeSize = leastCodeSize + 1;
  let nextCode = endCode + 1;
  let table = new Map<number, number>();
  let bits = 0;
  let bitCount = 0;

  const pushByte = (value: number) => {
    block[blockLength] = value;
    blockLength += 1;

    if (blockLength === BLOCK) {
      out.byte(BLOCK).bytes(block);
      blockLength = 0;
    }
  };

  // Each code goes in above the bits still waiting, and whole bytes leave from the bottom. Arithmetic rather than bitwise
  // operators, which the repo's lint keeps out; the waiting bits never pass twenty, well inside a number's exact range.
  const emit = (code: number) => {
    bits += code * 2 ** bitCount;
    bitCount += codeSize;

    while (bitCount >= 8) {
      pushByte(bits % 256);
      bits = Math.floor(bits / 256);
      bitCount -= 8;
    }
  };

  out.byte(leastCodeSize);
  emit(clearCode);

  let prefix = indices[0];

  for (let index = 1; index < indices.length; index += 1) {
    const next = indices[index];
    const key = prefix * 256 + next;
    const known = table.get(key);

    if (known !== undefined) {
      prefix = known;
    } else {
      emit(prefix);

      if (nextCode === MOST_CODES) {
        emit(clearCode);
        table = new Map();
        nextCode = endCode + 1;
        codeSize = leastCodeSize + 1;
      } else {
        // Widened as the code about to be added needs another bit, which is when a reader widens too.
        if (nextCode >= 2 ** codeSize) {
          codeSize += 1;
        }

        table.set(key, nextCode);
        nextCode += 1;
      }

      prefix = next;
    }
  }

  emit(prefix);

  // A reader adds one more entry on that last code, and widens as it does, so the end code goes at the width it reads.
  if (nextCode === 2 ** codeSize && codeSize < 12) {
    codeSize += 1;
  }

  emit(endCode);

  if (bitCount > 0) {
    pushByte(bits);
  }

  if (blockLength > 0) {
    out.byte(blockLength).bytes(block.subarray(0, blockLength));
  }

  out.byte(0);
};
