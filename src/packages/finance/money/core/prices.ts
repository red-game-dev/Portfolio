import { RandomSource } from "@/packages/math/random";

import { CENT_ENDINGS, PRICE_LEVEL, TILL_TOTAL } from "../config/prices";
import { CurrencyCode, Money } from "../domain/types";

// A till total drawn at random, priced as that currency's tills price: anywhere from a coffee to a small shop (spread
// evenly in proportion, so small bills are as common as large ones), rounded as prices are there: cents ending as
// prices end (.99, .50, .95), half units where a unit is small change, and tens, hundreds or thousands where a currency
// has no small coins.
export const tillTotal = (random: RandomSource, currency: CurrencyCode, digits: number): Money => {
  const level = PRICE_LEVEL[currency] ?? 1;
  const worth = TILL_TOTAL.low * (TILL_TOTAL.high / TILL_TOTAL.low) ** random();
  const major = worth * level;
  const scale = 10 ** digits;

  if (digits === 0) {
    const step = 10 ** Math.max(0, Math.floor(Math.log10(level)) - 1);

    return { minor: Math.max(step, Math.round(major / step) * step), currency };
  }

  // Where a whole unit is small change, prices go by halves.
  if (level >= 20) {
    return { minor: Math.max(1, Math.round(major * 2)) * (scale / 2), currency };
  }

  const ending = CENT_ENDINGS[Math.min(CENT_ENDINGS.length - 1, Math.floor(random() ** 2 * CENT_ENDINGS.length))];
  const cents = Math.round((ending / 100) * scale);

  return { minor: Math.max(1, Math.floor(major)) * scale + cents, currency };
};
