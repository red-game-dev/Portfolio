// An amount of money, in its currency's smallest unit (cents, or yen where there is nothing smaller).
export type CurrencyCode = string;

// A country or territory, by its ISO 3166 two letter code.
export type RegionCode = string;

export interface Money {
  minor: number;
  currency: CurrencyCode;
}

// An amount as a till shows it: the whole text, what stands before and after the figure (the currency's sign and its
// spacing), and the characters a cashier keys for it (its digits and its decimal mark, never a grouping mark).
export interface MoneyParts {
  text: string;
  prefix: string;
  suffix: string;
  keyed: string;
}

// What a device says about where it is: its time zone, and the languages its owner reads, most wanted first.
export interface RegionClues {
  timeZone?: string;
  locales: readonly string[];
}

// The till a visitor pays at: the region it is in (null where nothing said), its currency, and the language its
// amounts are written in.
export interface Till {
  region: RegionCode | null;
  currency: CurrencyCode;
  locale: string;
}
