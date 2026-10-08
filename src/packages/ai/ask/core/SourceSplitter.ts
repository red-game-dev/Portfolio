// The model ends an answer with this, then the keys of the sections it drew on and "]]".
export const SOURCES_MARKER = "[[sources:";

// How much of the end of `text` could be the start of the marker, so it is held back until the next chunk.
const partialMarker = (text: string) => {
  for (let length = Math.min(SOURCES_MARKER.length - 1, text.length); length > 0; length -= 1) {
    if (SOURCES_MARKER.startsWith(text.slice(-length))) {
      return length;
    }
  }

  return 0;
};

// Splits a streamed answer into the text to show and the source keys after the marker, which are never
// shown as text. Feed it chunks in order, then call end.
export class SourceSplitter {
  private pending = "";
  private tail: string | null = null;

  // The text that is safe to show now.
  public push(chunk: string): string {
    if (this.tail !== null) {
      this.tail += chunk;

      return "";
    }

    const text = this.pending + chunk;
    const at = text.indexOf(SOURCES_MARKER);

    if (at >= 0) {
      this.tail = text.slice(at + SOURCES_MARKER.length);
      this.pending = "";

      return text.slice(0, at);
    }

    const held = partialMarker(text);

    this.pending = text.slice(text.length - held);

    return text.slice(0, text.length - held);
  }

  // Whatever text was held back, and the keys named after the marker that are in `allowed`, once each.
  public end(allowed: readonly string[]): { text: string; keys: string[] } {
    const text = this.pending;
    const named = (this.tail ?? "").split("]]")[0]
      .split(",")
      .map((key) => key.trim());

    this.pending = "";

    return { text, keys: [...new Set(named.filter((key) => allowed.includes(key)))] };
  }
}
