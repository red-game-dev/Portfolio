import { Currency } from "../domain/types";

// An amount in major units (12.5) as whole minor units (1250 for two decimals), rounded to the nearest.
export const toMinor = (amount: number, currency: Currency): number => Math.round(amount * 10 ** currency.decimals);

// Minor units back to major ones.
export const fromMinor = (amount: number, currency: Currency): number => amount / 10 ** currency.decimals;

// An amount for reading: grouped digits and the currency's decimal places, then its code.
export const formatMoney = (amount: number, currency: Currency, locale = "en-GB"): string => `${new Intl.NumberFormat(locale, {
  minimumFractionDigits: currency.decimals,
  maximumFractionDigits: currency.decimals,
}).format(fromMinor(amount, currency))} ${currency.code}`;
