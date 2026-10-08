// Splits a server sent event stream into the data of each event. Feed it chunks as they arrive; an event cut
// across two chunks is kept until it is complete.
export class EventStreamParser {
  private buffer = "";

  public push(chunk: string): string[] {
    this.buffer += chunk.replace(/\r\n/g, "\n");

    const events = this.buffer.split("\n\n");

    this.buffer = events.pop() ?? "";

    return events
      .map((event) => event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n"))
      .filter(Boolean);
  }
}
