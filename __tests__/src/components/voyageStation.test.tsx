import { fireEvent, render, screen, within } from "@testing-library/react";

import { StationPanel } from "@/components/Finale/Voyage/Encounters/StationPanel";
import { portfolioData } from "@/data/resume";
import type { PortView, StationView, VoyageAction } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const copy = voyage.encounters.station;

const port: PortView = { kind: "station", anchor: "earth", anchorName: null, faction: null };

// A station at Earth: its crew (the ship needs mending and can pay; its tank is full), ammunition, goods and a buyer.
const station = (overrides: Partial<StationView> = {}): StationView => ({
  port: { kind: "station", id: "station:earth", anchor: "earth", faction: -1, seed: 1, depth: 0 },
  services: [{ id: "repair", price: 40, isNeeded: true }, { id: "refuel", price: 20, isNeeded: false }, { id: "recharge", price: 30, isNeeded: true }],
  ammo: [{ type: "rounds", count: 100, price: 25, aboard: 150, rack: 300 }],
  goods: [{ id: "repairKit", price: 60 }],
  sales: [{ id: "scrap", count: 4, price: 3 }],
  coin: 100,
  ...overrides,
});

const open = (view: StationView, onAct: (action: VoyageAction) => boolean = () => true) =>
  render(<StationPanel content={voyage} station={view} port={port} onAct={onAct} onCastOff={() => undefined} />);

describe("the voyage's station", () => {
  test("a row of the sections the port has, the crew marked when the ship needs one it can pay for", () => {
    open(station());

    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");

    expect(tabs.map((tab) => tab.textContent?.replace(`, ${copy.ready}`, ""))).toEqual([copy.tabs.crew, copy.tabs.ammo, copy.tabs.market, copy.tabs.sell]);
    expect(tabs[0].textContent).toContain(copy.ready);
  });

  test("a trader has no crew and nothing to buy from it marks nothing", () => {
    open(station({ services: [], goods: [] }));

    expect(within(screen.getByRole("tablist")).getAllByRole("tab")
      .map((tab) => tab.textContent)).toEqual([copy.tabs.ammo, copy.tabs.sell]);
  });

  test("buying from the crew, the racks and the market, and what cannot be bought says why", () => {
    const onAct = jest.fn(() => true);

    open(station({ coin: 35 }), onAct);

    // Mending costs more than there is to spend; the tank needs nothing; charging can be paid for.
    expect(screen.getByRole("button", { name: copy.tooPoor })).toBeDisabled();
    expect(screen.getByRole("button", { name: copy.notNeeded })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Buy for 30/ }));
    expect(onAct).toHaveBeenLastCalledWith({ kind: "service", service: "recharge" });

    fireEvent.click(screen.getByRole("tab", { name: copy.tabs.ammo }));
    expect(screen.getByRole("meter", { name: voyage.gear.ammo.rounds })).toHaveAttribute("aria-valuenow", "150");
    fireEvent.click(screen.getByRole("button", { name: /Buy for 25/ }));
    expect(onAct).toHaveBeenLastCalledWith({ kind: "buyAmmo", ammo: "rounds" });

    fireEvent.click(screen.getByRole("tab", { name: copy.tabs.sell }));
    fireEvent.click(screen.getByRole("button", { name: copy.sellAll }));
    expect(onAct).toHaveBeenLastCalledWith({ kind: "sell", item: "scrap", count: 4 });
  });
});
