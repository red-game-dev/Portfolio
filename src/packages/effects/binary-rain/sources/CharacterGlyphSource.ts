import { RandomSource } from "@/packages/math/random";

import { GlyphSource } from "../domain/types";

// Picks uniformly from a fixed set of characters, for example hex digits or katakana.
export class CharacterGlyphSource implements GlyphSource {
  private readonly characters: string[];

  constructor(characters: string) {
    this.characters = Array.from(characters);

    if (this.characters.length === 0) {
      throw new Error("CharacterGlyphSource needs at least one character");
    }
  }

  public next(random: RandomSource): string {
    return this.characters[Math.floor(random() * this.characters.length)];
  }
}
