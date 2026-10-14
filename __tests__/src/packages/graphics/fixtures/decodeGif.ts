// A small GIF reader for the tests, written apart from the encoder so a round trip proves the bytes: it reads the
// screen, the palette, the loop count and each frame (its rectangle, delay and disposal), unpacks the LZW codes as a
// browser does and paints each frame over the last, giving every frame as the whole screen. Arithmetic stands in for
// bitwise operators, which the repo's lint keeps out.
export interface DecodedFrame {
  indices: Uint8Array;
  delay: number;
  disposal: number;
  rect: { left: number; top: number; width: number; height: number };
  leastCodeSize: number;
}

export interface DecodedGif {
  width: number;
  height: number;
  palette: number[][];
  loops: number | null;
  frames: DecodedFrame[];
}

const lzwDecode = (data: number[], leastCodeSize: number, count: number): Uint8Array => {
  const clear = 2 ** leastCodeSize;
  const end = clear + 1;
  const out: number[] = [];
  let table: number[][] = [];
  let size = leastCodeSize + 1;
  let next = end + 1;
  let previous: number[] | null = null;
  let bits = 0;
  let bitCount = 0;
  let at = 0;

  const reset = () => {
    table = Array.from({ length: clear }, (_, index) => [index]);
    size = leastCodeSize + 1;
    next = end + 1;
    previous = null;
  };

  reset();

  for (;;) {
    while (bitCount < size && at < data.length) {
      bits += data[at] * 2 ** bitCount;
      at += 1;
      bitCount += 8;
    }

    if (bitCount < size) {
      throw new Error("the codes ran out before the end code");
    }

    const code = bits % 2 ** size;

    bits = Math.floor(bits / 2 ** size);
    bitCount -= size;

    if (code === clear) {
      reset();
      continue;
    }

    if (code === end) {
      break;
    }

    let entry: number[];

    if (code < next && table[code]) {
      entry = table[code];
    } else if (code === next && previous) {
      entry = [...previous, previous[0]];
    } else {
      throw new Error(`code ${code} is not in the table`);
    }

    out.push(...entry);

    if (previous && next < 4096) {
      table[next] = [...previous, entry[0]];
      next += 1;

      if (next === 2 ** size && size < 12) {
        size += 1;
      }
    }

    previous = entry;
  }

  if (out.length !== count) {
    throw new Error(`decoded ${out.length} pixels, not ${count}`);
  }

  return Uint8Array.from(out);
};

export const decodeGif = (bytes: Uint8Array): DecodedGif => {
  let at = 0;
  const byte = () => {
    if (at >= bytes.length) {
      throw new Error("the file ended early");
    }

    at += 1;

    return bytes[at - 1];
  };
  const word = () => byte() + byte() * 256;
  const text = (length: number) => String.fromCharCode(...Array.from({ length }, byte));
  const subBlocks = (): number[] => {
    const data: number[] = [];

    for (let length = byte(); length > 0; length = byte()) {
      for (let index = 0; index < length; index += 1) {
        data.push(byte());
      }
    }

    return data;
  };

  if (text(6) !== "GIF89a") {
    throw new Error("not a GIF89a");
  }

  const width = word();
  const height = word();
  const packed = byte();

  byte();
  byte();

  const palette = packed >= 0x80 ? Array.from({ length: 2 ** ((packed % 8) + 1) }, () => [byte(), byte(), byte()]) : [];
  const frames: DecodedFrame[] = [];
  let canvas = new Uint8Array(width * height);
  let loops: number | null = null;
  let delay = 0;
  let disposal = 0;

  for (let block = byte(); block !== 0x3b; block = byte()) {
    if (block === 0x21) {
      const label = byte();

      if (label === 0xf9) {
        byte();

        const control = byte();

        disposal = Math.floor(control / 4) % 8;
        delay = word();
        byte();
        byte();
      } else if (label === 0xff) {
        const id = text(byte());
        const data = subBlocks();

        if (id === "NETSCAPE2.0") {
          loops = data[1] + data[2] * 256;
        }
      } else {
        subBlocks();
      }
    } else if (block === 0x2c) {
      const rect = { left: word(), top: word(), width: word(), height: word() };

      if (byte() >= 0x80) {
        throw new Error("a local palette is not expected");
      }

      const leastCodeSize = byte();
      const indices = lzwDecode(subBlocks(), leastCodeSize, rect.width * rect.height);

      canvas = canvas.slice();

      for (let row = 0; row < rect.height; row += 1) {
        canvas.set(indices.subarray(row * rect.width, (row + 1) * rect.width), (rect.top + row) * width + rect.left);
      }

      frames.push({ indices: canvas, delay, disposal, rect, leastCodeSize });
    } else {
      throw new Error(`unknown block ${block}`);
    }
  }

  if (at !== bytes.length) {
    throw new Error("bytes after the trailer");
  }

  return { width, height, palette, loops, frames };
};
