import { ledgerMemo } from "@/components/Finale/Voyage/economy";
import { encounterNotice, perkMax, perkName, perksLine, portName } from "@/components/Finale/Voyage/encounters";
import { voyageNotice } from "@/components/Finale/Voyage/messages";
import { portfolioData } from "@/data/resume";
import { BOSS_MOVES, PERK_IDS, PERKS } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;

describe("the voyage's encounters in words", () => {
  test("every perk, station service and boss attack has its words", () => {
    expect(PERK_IDS.filter((id) => !voyage.encounters.perks.names[id]?.name || !voyage.encounters.perks.names[id]?.note)).toEqual([]);
    expect(["repair", "refuel", "recharge"].every((id) => voyage.encounters.station.services[id as "repair"])).toBe(true);
    expect(BOSS_MOVES[2].every((move) => voyage.encounters.bossMoves[move] && voyage.encounters.bossTells[move])).toBe(true);
  });

  test("perks taken read once each with how many times", () => {
    expect(perksLine(voyage, ["hotBarrels", "vampire", "hotBarrels"])).toBe(`${perkName(voyage, "hotBarrels")} x2, ${perkName(voyage, "vampire")}`);
    expect(perkMax("scavenger")).toBe(PERKS.find((perk) => perk.id === "scavenger")?.max);
  });

  test("a port is named for the world it circles and who keeps it, a trader for its people", () => {
    expect(portName(voyage, { kind: "station", anchor: "earth", anchorName: null, faction: null })).toBe("Earth station");
    expect(portName(voyage, { kind: "station", anchor: "u1", anchorName: "Veldara b", faction: null })).toBe("Veldara b free port");
    expect(portName(voyage, { kind: "station", anchor: "u1", anchorName: "Veldara b", faction: "Quiet Ones" })).toBe("Veldara b station");
    expect(portName(voyage, { kind: "trader", anchor: null, anchorName: null, faction: "Quiet Ones" })).toBe("A Quiet Ones trader");
    expect(portName(voyage, { kind: "trader", anchor: null, anchorName: null, faction: null })).toBe("A trader");
  });

  test("a call for help, a boss's attack and a gun run dry are each said", () => {
    expect(encounterNotice(voyage, { kind: "distress", stage: "call", distress: "survivors" })).toBe(voyage.encounters.distress.call);
    expect(encounterNotice(voyage, { kind: "distress", stage: "ambush", distress: "ambush" })).toBe(voyage.encounters.distress.ambush);
    expect(encounterNotice(voyage, { kind: "bossMove", move: "charge" })).toBe(voyage.encounters.bossMoves.charge);
    expect(encounterNotice(voyage, { kind: "dry", weapon: "primary", isSilent: false })).toBe(voyage.encounters.dry.backup);
    expect(encounterNotice(voyage, { kind: "dry", weapon: "primary", isSilent: true })).toBe(voyage.encounters.dry.silent);
    expect(voyageNotice(voyage, { kind: "dry", weapon: "missile", isSilent: true })).toBe("No missiles left for the Missile pod");
  });

  test("a hulk from an earlier universe says where it came from when salvaged", () => {
    const line = voyageNotice(voyage, { kind: "salvaged", wreck: "alien", kept: [{ id: "scrap", count: 2 }], lost: [], blueprints: [], origin: "Elsewhere" });

    expect(line?.startsWith("A hulk drifted in from Elsewhere")).toBe(true);
  });

  test("the ledger reads enhancing, forging, trading and missions in words, never as codes", () => {
    const raw = /armor|weapon|wings|repairKit|scrap|refuel|contract/;

    ["enhance:armor:2", "forge:weapon:missile:1", "dismantle:wings:0", "buy:repairKit", "sell:scrap", "trade:rounds", "trade:refuel", "repair:repair",
      "mission:contract:salvage:6", "streak:5", "distress"].forEach((memo) => {
      expect(ledgerMemo(voyage, memo)).not.toBe(memo);
      expect(ledgerMemo(voyage, memo)).not.toMatch(raw);
    });
    expect(ledgerMemo(voyage, "buy:repairKit")).toBe("Bought Repair kit at a port");
    expect(ledgerMemo(voyage, "trade:shells")).toBe("Bought flak shells at a station");
    expect(ledgerMemo(voyage, "trade:refuel")).toBe("A station filled the tank");
  });
});
