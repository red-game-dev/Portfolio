import { LocaleRegion, MoneyFormatter, PRICE_LEVEL, TILL_TOTAL, TillService, TimeZoneRegion } from "@/packages/finance/money";
import { createSeededRandom } from "@/packages/math/random";

const service = new TillService([new TimeZoneRegion(), new LocaleRegion()], { fallback: "EUR", locale: "en" });

describe("the till a visitor pays at", () => {
  it("is where their clock is set, before the region their languages name", () => {
    expect(service.tillFor({ timeZone: "Asia/Manila", locales: ["en-US"] })).toEqual({ region: "PH", currency: "PHP", locale: "en-US" });
    expect(service.tillFor({ timeZone: "Europe/Berlin", locales: ["de-DE"] }).currency).toBe("EUR");
    expect(service.tillFor({ timeZone: "Asia/Tokyo", locales: ["ja"] }).currency).toBe("JPY");
  });

  it("falls back to their languages' region, then to the default currency", () => {
    expect(service.tillFor({ timeZone: "Etc/UTC", locales: ["en-GB"] })).toMatchObject({ region: "GB", currency: "GBP" });
    expect(service.tillFor({ locales: ["fil-PH"] }).currency).toBe("PHP");
    expect(service.tillFor({ locales: ["en"] })).toEqual({ region: null, currency: "EUR", locale: "en" });
    expect(service.tillFor({ locales: [] }).locale).toBe("en");
  });
});

describe("an amount as a till writes it", () => {
  it("puts the currency's sign where the language does, groups the figure, and keys only digits and the decimal mark", () => {
    const parts = (locale: string, minor: number, currency: string) => new MoneyFormatter(locale).parts({ minor, currency });

    expect(parts("en-US", 1840, "USD")).toEqual({ text: "$18.40", prefix: "$", suffix: "", keyed: "18.40" });
    expect(parts("en-PH", 125000, "PHP")).toEqual({ text: "₱1,250.00", prefix: "₱", suffix: "", keyed: "1250.00" });

    const german = parts("de-DE", 1840, "EUR");

    expect(german.keyed).toBe("18,40");
    expect(german.prefix).toBe("");
    expect(german.suffix.trim()).toBe("€");
    expect(parts("en-US", 1280, "JPY").keyed).toBe("1280");
    // A till in Indonesia prices in whole rupiah, and an Egyptian one in the digits its keypad has.
    expect(parts("id-ID", 85000, "IDR").keyed).toBe("85000");
    expect(parts("ar-EG", 4500, "EGP").keyed).toMatch(/^[0-9.,٫]+$/);
  });
});

describe("a bill rung up at random", () => {
  const draws = (currency: string, digits: number, count = 300) => {
    const random = createSeededRandom(7);
    const formatter = new MoneyFormatter("en-US");

    return Array.from({ length: count }, () => service.bill({ region: null, currency, locale: "en-US" }, random))
      .map((money) => ({ money, major: money.minor / 10 ** digits, digits: formatter.digitsOf(currency) }));
  };

  it("costs what a coffee to a small shop costs there", () => {
    ["USD", "EUR", "PHP", "JPY", "IDR", "KRW"].forEach((currency) => {
      const digits = new MoneyFormatter("en-US").digitsOf(currency);

      draws(currency, digits).forEach(({ major }) => {
        expect(major).toBeGreaterThanOrEqual(TILL_TOTAL.low * PRICE_LEVEL[currency] * 0.7);
        expect(major).toBeLessThanOrEqual(TILL_TOTAL.high * PRICE_LEVEL[currency] * 1.3);
      });
    });
  });

  it("ends as prices end there: tens of yen, hundreds of won, thousands of rupiah, halves of a peso, cents as tills end them", () => {
    draws("JPY", 0).forEach(({ money }) => expect(money.minor % 10).toBe(0));
    draws("KRW", 0).forEach(({ money }) => expect(money.minor % 100).toBe(0));
    draws("IDR", 0).forEach(({ money }) => expect(money.minor % 1000).toBe(0));
    draws("PHP", 2).forEach(({ money }) => expect(money.minor % 50).toBe(0));
    draws("USD", 2).forEach(({ money }) => expect([0, 5, 9].includes(money.minor % 10) || money.minor % 100 === 99).toBe(true));
  });

  it("differs from one bill to the next", () => {
    expect(new Set(draws("EUR", 2, 20).map(({ money }) => money.minor)).size).toBeGreaterThan(15);
  });
});
