import { Guard, Mapper, ValidationError, Validator } from "@/packages/core/domain";

import { ContentSource } from "../ports/ContentSource";

// Reads content across a boundary in a fixed order: take raw data from the source, prove its shape,
// check its rules, then map it to what the caller renders. A bad payload fails here, loudly, instead
// of half rendering. Subclasses supply the guard, validator and mapper and nothing else.
export abstract class ContentService<TContent, TView> {
  protected readonly source: ContentSource;
  protected abstract readonly guard: Guard<TContent>;
  protected abstract readonly validator: Validator<TContent>;
  protected abstract readonly mapper: Mapper<TContent, TView>;

  constructor(source: ContentSource) {
    this.source = source;
  }

  public getView(): TView {
    const content = this.source.read();

    if (!this.guard(content)) {
      throw this.createShapeError();
    }

    this.validator.assertValid(content);

    return this.mapper.map(content);
  }

  protected createShapeError(): Error {
    return new ValidationError(["content from the source does not have the expected shape"]);
  }
}
