import { fireEvent, render, screen, within } from "@testing-library/react";

import { HangarPanel, HangarTab } from "@/components/Finale/Voyage/Hangar/HangarPanel";
import { HANGAR_TABS } from "@/components/Finale/Voyage/Hangar/tabs";
import { fillNodes, Money, PurseAmounts } from "@/components/Finale/Voyage/Money";
import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { portfolioData } from "@/data/resume";
import { Armory, armoryView, Career, Hangar, newCareer, newProfile, Progress, progressView, STORY, VoyageAction } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const words = voyage.hangar;
const transfer = { link: async () => null, file: async () => null, read: async () => null, adopt: () => undefined };

// A pilot with some of both currencies, a career as given, and the hangar open where it opens.
interface OpenOptions {
  career?: Career;
  opensOn?: HangarTab | null;
  onAct?: (action: VoyageAction) => boolean;
}

const openHangar = ({ career = new Career(), opensOn = null, onAct = () => true }: OpenOptions = {}) => {
  const armory = new Armory();
  const progress = new Progress();
  const hangar = new Hangar(newProfile(), { weapons: armory.port() });

  hangar.reward({ kind: "mission", id: "landMoon", coin: 250 });
  hangar.reward({ kind: "universe", index: 0 });

  return render(
    <PreferencesProvider>
      <HangarPanel
        content={voyage}
        settings={portfolioData.preferences}
        economy={hangar.view()}
        career={career.view()}
        gear={armoryView(armory, hangar, progress)}
        progress={progressView(progress)}
        drawShip={() => undefined}
        opensOn={opensOn}
        isFlying={false}
        transfer={transfer}
        onAct={onAct}
        onFollow={() => undefined}
        onClose={() => undefined}
      />
    </PreferencesProvider>,
  );
};

const tabNamed = (name: string) => screen.getAllByRole("tab").find((tab) => tab.textContent?.startsWith(name)) as HTMLElement;

describe("the voyage's hangar", () => {
  beforeEach(() => window.localStorage.clear());

  test("five tabs with icons, and every section of each opens with something in it, without an error", () => {
    const errors = jest.spyOn(console, "error").mockImplementation(() => undefined);

    openHangar();

    const main = screen.getByRole("tablist", { name: voyage.economy.hangar });

    expect(within(main).getAllByRole("tab")
.map((tab) => tab.textContent?.replace(`, ${words.ready}`, ""))).toEqual(HANGAR_TABS.map(({ id }) => words.tabs[id]));
    within(main).getAllByRole("tab")
.forEach((tab) => expect(tab.querySelector("svg")).not.toBeNull());

    HANGAR_TABS.forEach(({ id, sections }) => {
      fireEvent.click(tabNamed(words.tabs[id]));
      expect(tabNamed(words.tabs[id])).toHaveAttribute("aria-selected", "true");

      sections.forEach((section) => {
        if (sections.length > 1) {
          fireEvent.click(within(screen.getByRole("tablist", { name: words.tabs[id] })).getByRole("tab", { name: new RegExp(`^${words.sections[section]}`) }));
        }

        const panels = screen.getAllByRole("tabpanel");

        expect(panels[panels.length - 1].textContent?.trim().length).toBeGreaterThan(0);
      });
    });
    expect(errors.mock.calls.map((call) => String(call[0]))).toEqual([]);
    errors.mockRestore();
  });

  test("money shows with a coin or a shard named for what it is, and tapping one says what it is", () => {
    openHangar();

    const purse = screen.getByRole("heading", { name: voyage.economy.hangar }).parentElement as HTMLElement;
    const coin = within(purse).getByRole("img", { name: voyage.economy.currencies.RED })
.closest("button") as HTMLElement;

    expect(within(purse).getByRole("img", { name: voyage.economy.currencies.VOID })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b(RC|VS)\b/);
    expect(coin).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(coin);
    expect(coin).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(words.currencies.RED)).toBeInTheDocument();
    fireEvent.click(coin);
    expect(screen.queryByText(words.currencies.RED)).toBeNull();

    render(<p data-testid="price">{fillNodes(voyage.economy.trade.sell, { price: <Money copy={voyage.economy} amount={1200} /> })}</p>);
    expect(screen.getByTestId("price")).toHaveTextContent("Sell a Void Shard for 1,200");
    expect(within(screen.getByTestId("price")).getByRole("img", { name: "Red Coin" })).toBeInTheDocument();

    render(<p data-testid="purse"><PurseAmounts copy={voyage.economy} purse={{ RED: 0, VOID: -2 }} isSigned /></p>);
    expect(within(screen.getByTestId("purse")).queryByRole("img", { name: "Red Coin" })).toBeNull();
    expect(screen.getByTestId("purse")).toHaveTextContent("-2");
  });

  test("the Pilot tab shows rank and level side by side, the chapter under way, and every line decoded so far", () => {
    openHangar({ career: new Career({ ...newCareer(), story: { chapter: 2, progress: [0, 0] } }) });

    expect(screen.getByText(words.pilot.rank)).toBeInTheDocument();
    expect(screen.getByText(words.pilot.level)).toBeInTheDocument();

    const story = screen.getByRole("region", { name: voyage.career.story.title });

    expect(within(story).getByText(voyage.career.story.chapters.ai.title)).toBeInTheDocument();
    expect(within(story).getByText(`Chapter 3 of ${STORY.length}`)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.steps.aiSave)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.waiting)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.chapters.launch.line)).toBeInTheDocument();
    expect(within(story).queryByText(voyage.career.story.chapters.ai.line)).toBeNull();
  });

  test("once the story is told, only its lines remain", () => {
    openHangar({ career: new Career({ ...newCareer(), story: { chapter: STORY.length, progress: [] } }) });

    const story = screen.getByRole("region", { name: voyage.career.story.title });

    expect(within(story).getByText(voyage.career.story.told)).toBeInTheDocument();
    expect(within(story).getAllByRole("listitem")).toHaveLength(STORY.length);
  });

  test("it opens where the voyage sends it, and otherwise where it was last left", () => {
    const first = openHangar({ opensOn: "badges" });

    expect(tabNamed(words.tabs.log)).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tablist", { name: words.tabs.log })).getByRole("tab", { name: new RegExp(`^${words.sections.badges}`) }))
      .toHaveAttribute("aria-selected", "true");

    fireEvent.click(tabNamed(words.tabs.cargo));
    first.unmount();
    openHangar();
    expect(tabNamed(words.tabs.cargo)).toHaveAttribute("aria-selected", "true");
  });

  test("the Style tab tries a paint on, and says how a locked one is won", () => {
    openHangar({ opensOn: "ship" });
    fireEvent.click(within(screen.getByRole("tablist", { name: words.tabs.ship })).getByRole("tab", { name: new RegExp(`^${words.sections.style}`) }));

    expect(screen.getByText(fill(words.style.wearing, voyage.progress.paints.classic))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(voyage.progress.paints.explorer) }));
    expect(screen.getByText(fill(words.style.trying, voyage.progress.paints.explorer))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Won with the ${voyage.progress.achievements.everyRocky.name} badge`))).toBeInTheDocument();
  });

  test("the Loadout puts what is chosen in the chosen slot with one press", () => {
    const onAct = jest.fn(() => true);

    openHangar({ opensOn: "loadout", onAct });
    fireEvent.click(screen.getByRole("button", { name: `Slot 4: ${words.loadout.empty}` }));
    fireEvent.click(screen.getByRole("button", { name: /^Put Fuel cell in slot 4$/ }));
    expect(onAct).toHaveBeenCalledWith({ kind: "setSlot", index: 3, slot: { kind: "item", id: "fuelCell" } });
  });
});

const fill = (template: string, name: string) => template.replace("{name}", name);
