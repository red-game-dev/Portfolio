import { ContentSource } from "../ports/ContentSource";

// Serves content that is already in memory: static site data, fixtures, tests.
export class InMemoryContentSource implements ContentSource {
  private readonly content: unknown;

  constructor(content: unknown) {
    this.content = content;
  }

  public read(): unknown {
    return this.content;
  }
}
