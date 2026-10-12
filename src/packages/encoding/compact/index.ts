// Text made small enough to travel in a link: deflated where the browser can, then base64url, behind a one letter tag
// saying which, so a link made by either kind of browser reads back in the other.
const DEFLATED = "z";
const PLAIN = "j";

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const base64 = btoa(binary);

  return base64.replace(/=+$/, "").replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> => {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

type ByteTransform = ReadableWritablePair<Uint8Array<ArrayBuffer>, BufferSource>;

const through = async (bytes: Uint8Array<ArrayBuffer>, transform: ByteTransform): Promise<Uint8Array<ArrayBuffer>> => {
  const source = new Blob([bytes]).stream();
  const result = new Response(source.pipeThrough(transform));

  return new Uint8Array(await result.arrayBuffer());
};

export const packText = async (text: string): Promise<string> => {
  const bytes = new TextEncoder().encode(text);

  // Some browsers have the stream but not this format, and throw on it: they write the text plain instead.
  try {
    if (typeof CompressionStream !== "undefined") {
      return DEFLATED + toBase64Url(await through(bytes, new CompressionStream("deflate-raw")));
    }
  } catch {
    // Written plain below.
  }

  return PLAIN + toBase64Url(bytes);
};

// The text back, or null for anything that is not a packed text this code can read.
export const unpackText = async (packed: string): Promise<string | null> => {
  try {
    const bytes = fromBase64Url(packed.slice(1));

    if (packed.startsWith(PLAIN)) {
      return new TextDecoder().decode(bytes);
    }

    if (packed.startsWith(DEFLATED) && typeof DecompressionStream !== "undefined") {
      return new TextDecoder().decode(await through(bytes, new DecompressionStream("deflate-raw")));
    }

    return null;
  } catch {
    return null;
  }
};
