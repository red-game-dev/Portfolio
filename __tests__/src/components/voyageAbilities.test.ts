import { boostNotice, isBoostName, slotLabel, slotName, slotState } from "@/components/Finale/Voyage/abilities";
import { codexName, codexNotes } from "@/components/Finale/Voyage/career";
import { voyageNotice } from "@/components/Finale/Voyage/messages";
import { portfolioData } from "@/data/resume";
import { BarRow, BOOST_IDS, CODEX, VoyageSnapshot } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const burner: BarRow = { slot: { kind: "boost", id: "afterburner" }, count: 3, level: 2, colour: "#f4f0ff" };
const kit: BarRow = { slot: { kind: "item", id: "repairKit" }, count: 0, level: 0, colour: null };
const empty: BarRow = { slot: null, count: 0, level: 0, colour: null };
const quiet: VoyageSnapshot["boosts"] = { active: [], cooldowns: {}, blocks: 0 };

describe("the ability bar's words", () => {
  test("every boost has a name and a line in the content, and the codex lists each one by it", () => {
    BOOST_IDS.forEach((id) => {
      expect(voyage.boosts.names[id]).toBeTruthy();
      expect(voyage.boosts.notes[id]).toBeTruthy();
      expect(isBoostName(voyage.boosts.names, id)).toBe(true);
    });
    expect(Object.keys(voyage.boosts.names)).toHaveLength(BOOST_IDS.length);
    expect(isBoostName(voyage.boosts.names, "hyperdrive")).toBe(false);

    const entries = CODEX.filter((entry) => entry.category === "boosts");

    expect(entries).toHaveLength(BOOST_IDS.length);
    entries.forEach((entry) => {
      expect(isBoostName(voyage.boosts.names, entry.subject)).toBe(true);
      expect(codexName(voyage, entry)).toBe(isBoostName(voyage.boosts.names, entry.subject) ? voyage.boosts.names[entry.subject] : "");
      expect(codexNotes(voyage, entry)[0]).toBeTruthy();
    });
    expect(voyage.career.categories.boosts).toBeTruthy();
  });

  test("a slot reads as on, cooling down or spent from the run's boosts", () => {
    expect(slotState(burner, quiet)).toEqual({ isOn: false, left: 0, cooldown: null, isSpent: false });
    expect(slotState(burner, { active: [{ id: "afterburner", level: 2, left: 0.5 }], cooldowns: { afterburner: { seconds: 12, share: 0.9 } }, blocks: 0 }))
      .toEqual({ isOn: true, left: 0.5, cooldown: { seconds: 12, share: 0.9 }, isSpent: false });
    expect(slotState(kit, quiet).isSpent).toBe(true);
    expect(slotState(empty, null)).toEqual({ isOn: false, left: 0, cooldown: null, isSpent: false });
  });

  test("a screen reader hears each slot's key, what it holds, its level, what is left and whether it is on or cooling down", () => {
    const cooling = { isOn: false, left: 0, cooldown: { seconds: 7, share: 0.5 }, isSpent: false };

    expect(slotName(voyage, { kind: "boost", id: "afterburner" })).toBe("Afterburner");
    expect(slotLabel(voyage, burner, 2, cooling)).toBe("Slot 3: Afterburner, level 2, 3 left, cooling down, 7 s");
    expect(slotLabel(voyage, kit, 1, slotState(kit, quiet))).toBe("Slot 2: Repair kit, 0 left");
    expect(slotLabel(voyage, empty, 3, slotState(empty, quiet))).toBe("Slot 4 is empty. Choose what goes here in the hangar's Loadout.");
  });

  test("a core found is said as new, as a level reached or as a charge more; a press for nothing says why", () => {
    expect(boostNotice(voyage, { kind: "boostFound", boost: "cloak", level: 1, charges: 1, isFirst: true, isLevelUp: false })).toContain("New boost: Cloak");
    expect(boostNotice(voyage, { kind: "boostFound", boost: "cloak", level: 2, charges: 3, isFirst: false, isLevelUp: true })).toBe("Cloak reached level 2");
    expect(boostNotice(voyage, { kind: "boostFound", boost: "cloak", level: 1, charges: 2, isFirst: false, isLevelUp: false })).toBe("Cloak found: 2 left");
    expect(voyageNotice(voyage, { kind: "slotRefused", slot: { kind: "boost", id: "prism" }, reason: "cooling", seconds: 4.2 })).toBe("Prism is cooling down: 5 s");
    expect(voyageNotice(voyage, { kind: "slotRefused", slot: { kind: "item", id: "fuelCell" }, reason: "empty", seconds: 0 })).toContain("No Fuel cell left");
    expect(voyageNotice(voyage, { kind: "slotRefused", slot: { kind: "boost", id: "warpJump" }, reason: "unable", seconds: 0 })).toBe("Warp jump cannot work here.");
    expect(boostNotice(voyage, { kind: "storm", isTurned: false })).toBeNull();
  });
});
