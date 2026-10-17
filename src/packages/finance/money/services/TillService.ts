import { RandomSource } from "@/packages/math/random";

import { REGION_CURRENCY } from "../config/regions";
import { MoneyFormatter } from "../core/MoneyFormatter";
import { tillTotal } from "../core/prices";
import { RegionResolver } from "../core/RegionResolver";
import { CurrencyCode, Money, MoneyParts, RegionClues, RegionCode, Till } from "../domain/types";

export interface TillOptions {
  // The currency where no clue says where the device is, or its region's currency is not known.
  fallback: CurrencyCode;
  // The language amounts are written in where the device names none.
  locale: string;
  currencies?: Readonly<Record<RegionCode, CurrencyCode>>;
}

// The till a visitor pays at: its region from the first resolver that can tell, the currency paid there, amounts written
// in the visitor's own language, and bills drawn as that till would ring them up.
export class TillService {
  private readonly resolvers: readonly RegionResolver[];
  private readonly options: TillOptions;
  private readonly formatters = new Map<string, MoneyFormatter>();

  constructor(resolvers: readonly RegionResolver[], options: TillOptions) {
    this.resolvers = resolvers;
    this.options = options;
  }

  public tillFor(clues: RegionClues): Till {
    const currencies = this.options.currencies ?? REGION_CURRENCY;
    const region = this.resolvers.reduce<RegionCode | null>((found, resolver) => found ?? resolver.resolve(clues), null);
    const locale = clues.locales.find((tag) => this.isReadable(tag)) ?? this.options.locale;

    return { region, currency: (region && currencies[region]) || this.options.fallback, locale };
  }

  public bill(till: Till, random: RandomSource): Money {
    return tillTotal(random, till.currency, this.formatterOf(till.locale).digitsOf(till.currency));
  }

  public parts(till: Till, money: Money): MoneyParts {
    return this.formatterOf(till.locale).parts(money);
  }

  private formatterOf(locale: string): MoneyFormatter {
    const known = this.formatters.get(locale) ?? new MoneyFormatter(locale);

    this.formatters.set(locale, known);

    return known;
  }

  private isReadable(tag: string): boolean {
    try {
      return Intl.NumberFormat.supportedLocalesOf([tag]).length > 0;
    } catch {
      return false;
    }
  }
}
