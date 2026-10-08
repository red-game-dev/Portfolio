import { AskDepth, CacheStore } from "../domain/types";
import { normaliseQuestion } from "../utils/question";

export interface CachedAnswer {
  text: string;
  sources: string[];
  // The model that wrote it.
  label: string;
}

export interface AnswerCacheOptions {
  store: CacheStore;
  // Change it when the knowledge or the models change, and every cached answer is left behind.
  version: string;
  ttlMs: number;
  // A digest of the normalised question, so keys stay short and hold no visitor text.
  hash: (text: string) => string;
}

const isCachedAnswer = (value: unknown): value is CachedAnswer => typeof value === "object" && value !== null
  && typeof (value as CachedAnswer).text === "string"
  && typeof (value as CachedAnswer).label === "string"
  && Array.isArray((value as CachedAnswer).sources)
  && (value as CachedAnswer).sources.every((key) => typeof key === "string");

// Answers to first questions, shared by every instance. Most visitors ask what the suggestions ask, so most
// answers are served from here without calling the model.
export class AnswerCache {
  private readonly options: AnswerCacheOptions;

  constructor(options: AnswerCacheOptions) {
    this.options = options;
  }

  public async get(question: string, depth: AskDepth): Promise<CachedAnswer | null> {
    const stored = await this.options.store.get(this.key(question, depth));

    if (!stored) {
      return null;
    }

    try {
      const value: unknown = JSON.parse(stored);

      return isCachedAnswer(value) ? value : null;
    } catch {
      return null;
    }
  }

  public async set(question: string, depth: AskDepth, answer: CachedAnswer): Promise<void> {
    await this.options.store.set(this.key(question, depth), JSON.stringify(answer), this.options.ttlMs);
  }

  // True for the one request that should ask the model when many ask the same thing at once.
  public async claim(question: string, depth: AskDepth, ttlMs: number): Promise<boolean> {
    return this.options.store.claim(`${this.key(question, depth)}:lock`, ttlMs);
  }

  private key(question: string, depth: AskDepth): string {
    return `${this.options.version}:${depth}:${this.options.hash(normaliseQuestion(question))}`;
  }
}
