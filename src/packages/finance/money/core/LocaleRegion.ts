import { RegionClues, RegionCode } from "../domain/types";
import { RegionResolver } from "./RegionResolver";

// The region the visitor's languages name ("en-PH", "fil-PH"): the first that names one.
export class LocaleRegion extends RegionResolver {
  public readonly id = "locale";

  public resolve({ locales }: RegionClues): RegionCode | null {
    for (const locale of locales) {
      try {
        const region = new Intl.Locale(locale).region;

        if (region && /^[A-Z]{2}$/.test(region)) {
          return region;
        }
      } catch {
        // A language tag the browser cannot read names no region.
      }
    }

    return null;
  }
}
