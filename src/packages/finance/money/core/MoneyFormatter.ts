import { WHOLE_UNITS } from "../config/prices";
import { CurrencyCode, Money, MoneyParts } from "../domain/types";

// Writes amounts as a till shows them in one language: the currency's sign where that language puts it, its grouping
// and decimal marks, in Latin digits (the ones a keypad has), and split into the parts a till keys and shows.
export class MoneyFormatter {
  private readonly locale: string;
  private readonly formats = new Map<CurrencyCode, Intl.NumberFormat>();

  constructor(locale: string) {
    this.locale = locale;
  }

  // How many digits a currency shows after its decimal mark at a till.
  public digitsOf(currency: CurrencyCode): number {
    return this.formatOf(currency).resolvedOptions().maximumFractionDigits ?? 2;
  }

  public parts(money: Money): MoneyParts {
    const pieces = this.formatOf(money.currency).formatToParts(money.minor / 10 ** this.digitsOf(money.currency));
    const isFigure = (type: string) => type === "integer" || type === "fraction" || type === "decimal" || type === "group";
    const first = pieces.findIndex((piece) => isFigure(piece.type));
    const last = pieces.length - 1 - [...pieces].reverse().findIndex((piece) => isFigure(piece.type));
    const join = (from: number, to: number) => pieces.slice(from, to).map((piece) => piece.value)
.join("");

    return {
      text: join(0, pieces.length),
      prefix: join(0, first),
      suffix: join(last + 1, pieces.length),
      keyed: pieces.filter((piece) => piece.type === "integer" || piece.type === "decimal" || piece.type === "fraction").map((piece) => piece.value)
.join(""),
    };
  }

  private formatOf(currency: CurrencyCode): Intl.NumberFormat {
    const known = this.formats.get(currency);

    if (known) {
      return known;
    }

    const whole = WHOLE_UNITS.has(currency) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {};
    const format = new Intl.NumberFormat(this.locale, { style: "currency", currency, numberingSystem: "latn", ...whole });

    this.formats.set(currency, format);

    return format;
  }
}
