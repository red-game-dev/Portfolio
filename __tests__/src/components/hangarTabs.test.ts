import {
  FIRST_PLACE,
  HANGAR_TABS,
  isHangarSeen,
  isHangarSection,
  placeOf,
  sectionDots,
  seenNow,
  swipeTab,
  tabOf,
} from "@/components/Finale/Voyage/Hangar/tabs";
import { Armory, armoryView, Career, Hangar, newProfile, Progress, progressView } from "@/packages/games/voyage";

// A new pilot's hangar as the UI sees it, with a coin purse as given.
const viewsOf = (coin = 0) => {
  const armory = new Armory();
  const progress = new Progress();
  const hangar = new Hangar(newProfile(), { weapons: armory.port() });

  if (coin > 0) {
    hangar.reward({ kind: "mission", id: "test", coin });
  }

  return { economy: hangar.view(), career: new Career().view(), gear: armoryView(armory, hangar, progress), progress: progressView(progress) };
};

describe("the hangar's tabs", () => {
  test("six tabs, every section in exactly one, each tab with its own accent", () => {
    const sections = HANGAR_TABS.flatMap(({ sections: list }) => list);

    expect(HANGAR_TABS.map(({ id }) => id)).toEqual(["pilot", "quests", "ship", "cargo", "log", "settings"]);
    expect(new Set(sections).size).toBe(sections.length);
    expect(new Set(HANGAR_TABS.map(({ accent }) => accent)).size).toBe(HANGAR_TABS.length);
    sections.forEach((section) => expect(placeOf(section).tab).toBe(tabOf(section)));
    expect(FIRST_PLACE).toEqual({ tab: "pilot", section: "overview" });
  });

  test("a swipe moves one tab along and stops at either end", () => {
    expect(swipeTab("pilot", 1)).toBe("quests");
    expect(swipeTab("pilot", -1)).toBe("pilot");
    expect(swipeTab("settings", 1)).toBe("settings");
    expect(swipeTab("log", -1)).toBe("cargo");
  });

  test("what is read back is checked: a known section, and seen counts", () => {
    expect(isHangarSection("codex")).toBe(true);
    expect(isHangarSection("hold ")).toBe(false);
    expect(isHangarSection(3)).toBe(false);
    expect(isHangarSeen({ codex: 2, badges: 0 })).toBe(true);
    expect(isHangarSeen({ codex: "2", badges: 0 })).toBe(false);
    expect(isHangarSeen({ codex: 2, badges: 0, quests: 3 })).toBe(true);
    expect(isHangarSeen({ codex: 2, badges: 0, quests: "3" })).toBe(false);
  });

  test("a dot marks a plan that can be made, an empty slot with something for it, and finds newer than those seen", () => {
    const views = viewsOf();
    const seen = seenNow(views);
    const dots = sectionDots(views, seen);

    // A new pilot has the starter kit's scrap and wiring for a repair kit but not its coin, and empty slots with
    // nothing left to put in them (the starter kit is on the bar already).
    expect(dots.has("plans")).toBe(false);
    expect(sectionDots(viewsOf(100), seen).has("plans")).toBe(true);
    expect(dots.has("loadout")).toBe(false);
    expect(dots.has("codex")).toBe(false);
    expect(sectionDots(views, { ...seen, codex: seen.codex - 1 }).has("codex")).toBe(true);
    expect(sectionDots(views, { ...seen, badges: -1 }).has("badges")).toBe(true);
  });

  test("a dot marks the next upgrade once it is paid for", () => {
    const poor = viewsOf();
    const rich = viewsOf(100000);

    expect(sectionDots(poor, seenNow(poor)).has("sheet")).toBe(Boolean(poor.economy.next?.shortfall.isReady));
    expect(rich.economy.next?.shortfall.coin.RED).toBe(0);
  });
});
