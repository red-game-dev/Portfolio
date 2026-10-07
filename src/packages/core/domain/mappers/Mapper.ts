// One direction, one responsibility: turn a source shape into a target shape with no side effects.
export abstract class Mapper<TSource, TTarget> {
  public mapMany(sources: TSource[]): TTarget[] {
    return sources.map((source) => this.map(source));
  }

  public abstract map(source: TSource): TTarget;
}
