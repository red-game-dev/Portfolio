import { isPaymentEffect, isThemeEffect, switchEffectFor, THEME_EFFECTS, ZONE_EFFECTS } from "@/components/SwitchStage/config";
import { themeOf, zoneOf } from "@/components/SwitchStage/zoneOf";
import { ZONE_BOUNDARIES } from "@/config/zones";

describe("switchEffectFor", () => {
  it("plays the zone's own effect", () => {
    expect(switchEffectFor("casino")).toBe("deal");
    expect(switchEffectFor("chain")).toBe("blocks");
  });

  it("gives every zone a different effect", () => {
    const effects = Object.values(ZONE_EFFECTS);

    expect(new Set(effects).size).toBe(effects.length);
  });
});

describe("zoneOf", () => {
  beforeEach(() => {
    // The zones' first sections in page order, each followed by a section of its own.
    document.body.innerHTML = ZONE_BOUNDARIES.map(({ startsAt }) => `<section id="${startsAt}"><p></p></section><section data-after="${startsAt}"></section>`).join("");
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is the zone whose first section the element is in or follows", () => {
    ZONE_BOUNDARIES.forEach(({ zone, startsAt }) => {
      expect(zoneOf(document.querySelector(`#${startsAt} p`))).toBe(zone);
      expect(zoneOf(document.querySelector(`[data-after="${startsAt}"]`))).toBe(zone);
    });
  });

  it("falls back to the first zone without an element or before any zone", () => {
    expect(zoneOf(null)).toBe(ZONE_BOUNDARIES[0].zone);

    const before = document.createElement("div");

    document.body.prepend(before);
    expect(zoneOf(before)).toBe(ZONE_BOUNDARIES[0].zone);
  });
});

describe("section theme switches", () => {
  it("give each themed subject its own switch, apart from every zone's, Web3 keeping its zone's blocks", () => {
    const own = Object.entries(THEME_EFFECTS).filter(([theme]) => theme !== "web3")
.map(([, effect]) => effect);
    const zones = new Set<string>(Object.values(ZONE_EFFECTS));

    expect(THEME_EFFECTS.web3).toBe(ZONE_EFFECTS.chain);
    expect(new Set(own).size).toBe(own.length);
    expect(own.filter((effect) => effect && zones.has(effect))).toEqual([]);
    expect(own.every((effect) => effect && isThemeEffect(effect) && !isPaymentEffect(effect))).toBe(true);
  });

  it("reads the theme an element sits in, or none", () => {
    document.body.innerHTML = '<div data-theme="platform"><p id="inside"></p></div><p id="outside"></p>';

    expect(themeOf(document.getElementById("inside"))).toBe("platform");
    expect(themeOf(document.getElementById("outside"))).toBeNull();
    expect(themeOf(null)).toBeNull();
    document.body.innerHTML = "";
  });
});
