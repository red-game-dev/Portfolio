// Reuses objects instead of making new ones, for things made and dropped many times a second (sparks, smoke,
// shots), so the garbage collector never stutters a frame.
export class Pool<T> {
  private readonly free: T[] = [];
  private readonly create: () => T;
  private readonly limit: number;

  constructor(create: () => T, limit = 512) {
    this.create = create;
    this.limit = limit;
  }

  public get available(): number {
    return this.free.length;
  }

  public acquire(): T {
    return this.free.pop() ?? this.create();
  }

  public release(item: T): void {
    if (this.free.length < this.limit) {
      this.free.push(item);
    }
  }
}
