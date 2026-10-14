// Bytes written one after another into a buffer that grows as it needs, little endian where a number takes two. Written
// with arithmetic rather than bitwise operators, which the repo's lint keeps out.
export class ByteWriter {
  private buffer = new Uint8Array(4096);
  private length = 0;

  public byte(value: number): this {
    this.reserve(1);
    this.buffer[this.length] = value % 256;
    this.length += 1;

    return this;
  }

  public word(value: number): this {
    return this.byte(value).byte(Math.floor(value / 256));
  }

  public text(value: string): this {
    for (const character of value) {
      this.byte(character.charCodeAt(0));
    }

    return this;
  }

  public bytes(values: ArrayLike<number>): this {
    this.reserve(values.length);
    this.buffer.set(values, this.length);
    this.length += values.length;

    return this;
  }

  public result(): Uint8Array {
    return this.buffer.slice(0, this.length);
  }

  private reserve(count: number) {
    if (this.length + count <= this.buffer.length) {
      return;
    }

    let size = this.buffer.length * 2;

    while (size < this.length + count) {
      size *= 2;
    }

    const grown = new Uint8Array(size);

    grown.set(this.buffer.subarray(0, this.length));
    this.buffer = grown;
  }
}
