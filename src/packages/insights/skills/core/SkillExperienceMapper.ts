import { Mapper } from "@/packages/core/domain";
import { TenureCalculator, toMonthIndex } from "@/packages/insights/career";

import { SkillRecord, SkillSource } from "../domain/types";
import { skillKeys, sourceKeys } from "../utils/normalise";
import { RarityPolicy } from "./RarityPolicy";

export interface SkillExperienceMapperOptions {
  sources: SkillSource[];
  asOf: string;
  // Extra names a skill is known by, for example "SQL" also covering "PostgreSQL".
  aliases?: Record<string, string[]>;
  // The month before which a skill cannot count, by skill name: when it was first released, or first used
  // where that is known to be later. A role that began earlier only counts the skill from then on, so a
  // long role whose stack grew over the years never credits a tool before it existed.
  notBefore?: Record<string, string>;
  rarity?: RarityPolicy;
}

// Turns a skill name into evidence: where it was used and for how long, from the stacks of real roles
// and projects. A self score is never an input.
export class SkillExperienceMapper extends Mapper<string, SkillRecord> {
  private readonly sources: Array<SkillSource & { keys: Set<string> }>;
  private readonly calculator: TenureCalculator;
  private readonly aliases: Record<string, string[]>;
  private readonly notBefore: Record<string, string>;
  private readonly asOf: number;
  private readonly rarity: RarityPolicy;

  constructor({ sources, asOf, aliases = {}, notBefore = {}, rarity = new RarityPolicy() }: SkillExperienceMapperOptions) {
    super();
    this.sources = sources.map((source) => ({ ...source, keys: new Set(source.skills.flatMap(sourceKeys)) }));
    this.calculator = new TenureCalculator(asOf);
    this.aliases = aliases;
    this.notBefore = notBefore;
    this.asOf = toMonthIndex(asOf);
    this.rarity = rarity;
  }

  public map(name: string): SkillRecord {
    const keys = [name, ...(this.aliases[name] ?? [])].flatMap(skillKeys);
    const found = this.sources.filter((source) => keys.some((key) => source.keys.has(key)));
    const floor = this.notBefore[name];
    const matches = floor ? found.flatMap((source) => this.from(source, floor)) : found;
    const months = matches.length > 0 ? this.calculator.months(matches) : 0;
    const years = Math.floor(months / 12);

    return {
      name,
      years,
      months,
      places: [...new Set(matches.map((source) => source.place))],
      rarity: this.rarity.rarityFor(years),
      isTracked: matches.length > 0,
    };
  }

  // The part of a source from `floor` on: nothing if it ended before, the same source if it began after.
  private from<T extends SkillSource>(source: T, floor: string): T[] {
    const start = toMonthIndex(floor);
    const end = source.to ? toMonthIndex(source.to) : this.asOf;

    if (end <= start) {
      return [];
    }

    return [toMonthIndex(source.from) < start ? { ...source, from: floor } : source];
  }
}
