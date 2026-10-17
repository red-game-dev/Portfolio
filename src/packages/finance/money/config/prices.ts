import { CurrencyCode } from "../domain/types";

// How many of a currency's units a till total comes to where a US dollar's worth would be one, roughly: so a bill
// looks right in each currency (a coffee and a pastry, about $9, comes to about €9, ₱500 or ¥1,350). Magnitudes for
// showing prices, not rates to convert money by.
export const PRICE_LEVEL: Readonly<Record<CurrencyCode, number>> = {
  USD: 1, EUR: 1, GBP: 0.85, CHF: 1, CAD: 1.35, AUD: 1.5, NZD: 1.65, SGD: 1.35, HKD: 7.8, MOP: 8, CNY: 7, TWD: 32, JPY: 150,
  KRW: 1350, PHP: 56, THB: 35, MYR: 4.5, IDR: 15500, VND: 25000, KHR: 4100, INR: 83, PKR: 280, BDT: 110, LKR: 300, NPR: 130,
  AED: 3.7, SAR: 3.75, QAR: 3.65, KWD: 0.31, BHD: 0.38, OMR: 0.39, JOD: 0.71, ILS: 3.7, LBP: 89000, EGP: 48, MAD: 10, TND: 3.1,
  DZD: 135, TRY: 32, GEL: 2.7, KZT: 470, UZS: 12500, UAH: 40, SEK: 10.5, NOK: 10.7, DKK: 7, ISK: 140, PLN: 4, CZK: 23, HUF: 360,
  RON: 4.6, BGN: 1.95, RSD: 108, ZAR: 18.5, NGN: 1500, KES: 130, GHS: 15, TZS: 2600, UGX: 3800, BRL: 5.5, MXN: 18, ARS: 950,
  CLP: 930, COP: 4000, PEN: 3.75, UYU: 40, PYG: 7400, CRC: 520, DOP: 59, GTQ: 7.8, JMD: 155,
};

// Currencies a till prices in whole units though they have smaller ones on paper.
export const WHOLE_UNITS: ReadonlySet<CurrencyCode> = new Set(["IDR", "HUF", "COP", "TWD", "KZT", "UZS", "TZS", "UGX", "PYG", "CRC", "LBP", "KHR", "RSD", "ISK"]);

// A till total, in a US dollar's worth: from a coffee to a small shop.
export const TILL_TOTAL = { low: 3.5, high: 85 } as const;

// How a total in cents ends at a till (it rarely ends in an odd cent), the commonest first.
export const CENT_ENDINGS: readonly number[] = [0, 50, 99, 95, 90, 49, 25, 75, 80, 40, 60, 20, 10, 30, 45, 65, 70, 85, 15, 5, 35, 55];
