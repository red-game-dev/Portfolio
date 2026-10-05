import { Mapper } from "@/packages/core/domain";
import { TenureCalculator } from "@/packages/insights/career";

import { SkillRecord, SkillSource } from "../domain/types";
import { skillKeys, sourceKeys } from "../utils/normalise";
import { RarityPolicy } from "./RarityPolicy";

export interface SkillExperienceMapperOptions {
  sources: SkillSource[];
  asOf: string;
  // Extra names a skill is known by, for example "SQL" also covering "PostgreSQL".
  aliases?: Record<string, string[]>;
  rarity?: RarityPolicy;
}

// Turns a skill name into evidence: where it was used and for how long, from the stacks of real roles
// and projects. A self score is never an input.
export class SkillExperienceMapper extends Mapper<string, SkillRecord> {
  private readonly sources: Array<SkillSource & { keys: Set<string> }>;
  private readonly calculator: TenureCalculator;
  private readonly aliases: Record<string, string[]>;
  private readonly rarity: RarityPolicy;

  constructor({ sources, asOf, aliases = {}, rarity = new RarityPolicy() }: SkillExperienceMapperOptions) {
    super();
    this.sources = sources.map((source) => ({ ...source, keys: new Set(source.skills.flatMap(sourceKeys)) }));
    this.calculator = new TenureCalculator(asOf);
    this.aliases = aliases;
    this.rarity = rarity;
  }

  public map(name: string): SkillRecord {
    const keys = [name, ...(this.aliases[name] ?? [])].flatMap(skillKeys);
    const matches = this.sources.filter((source) => keys.some((key) => source.keys.has(key)));
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
}
