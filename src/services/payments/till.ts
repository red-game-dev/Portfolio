import { TILL } from "@/config/payments";
import { LocaleRegion, RegionClues, TillService, TimeZoneRegion } from "@/packages/finance/money";

// The till the payments counter rings bills up at: the visitor's region read from where their clock is set, then from
// the region their languages name, its currency, and amounts written in their own language. Nothing is sent anywhere.
export const tillService = new TillService([new TimeZoneRegion(), new LocaleRegion()], TILL);

// What this browser says about where it is.
export const browserClues = (): RegionClues => {
  let timeZone: string | undefined;

  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }

  const locales = typeof navigator === "undefined" ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];

  return { timeZone, locales };
};
