import { fireEvent, render, screen, within } from "@testing-library/react";

import { HangarPanel } from "@/components/Finale/Voyage/Hangar/HangarPanel";
import { fillNodes, Money, PurseAmounts } from "@/components/Finale/Voyage/Money";
import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { portfolioData } from "@/data/resume";
import { Armory, armoryView, Career, Hangar, newCareer, newProfile, Progress, progressView, STORY } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const transfer = { link: async () => null, file: async () => null, read: async () => null, adopt: () => undefined };

// A pilot with some of both currencies, a career as given, and the hangar open on its first tab.
const openHangar = (career = new Career()) => {
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
        isFlying={false}
        transfer={transfer}
        onAct={() => true}
        onClose={() => undefined}
      />
    </PreferencesProvider>,
  );
};

describe("the voyage's hangar", () => {
  test("every tab opens its own panel, without an error", () => {
    const errors = jest.spyOn(console, "error").mockImplementation(() => undefined);

    openHangar();

    const tabs = screen.getAllByRole("tab");

    expect(tabs).toHaveLength(11);
    tabs.forEach((tab) => {
      fireEvent.click(tab);
      expect(tab).toHaveAttribute("aria-selected", "true");
      expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
      expect(screen.getByRole("tabpanel").textContent?.trim().length).toBeGreaterThan(0);
    });
    expect(errors.mock.calls.map((call) => String(call[0]))).toEqual([]);
    errors.mockRestore();
  });

  test("money shows with a coin or a shard named for what it is, never as RC or VS", () => {
    openHangar();

    const purse = screen.getByRole("heading", { name: voyage.economy.hangar }).parentElement as HTMLElement;

    expect(within(purse).getByRole("img", { name: voyage.economy.currencies.RED })).toBeInTheDocument();
    expect(within(purse).getByRole("img", { name: voyage.economy.currencies.VOID })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b(RC|VS)\b/);

    render(<p data-testid="price">{fillNodes(voyage.economy.trade.sell, { price: <Money copy={voyage.economy} amount={1200} /> })}</p>);
    expect(screen.getByTestId("price")).toHaveTextContent("Sell a Void Shard for 1,200");
    expect(within(screen.getByTestId("price")).getByRole("img", { name: "Red Coin" })).toBeInTheDocument();

    render(<p data-testid="purse"><PurseAmounts copy={voyage.economy} purse={{ RED: 0, VOID: -2 }} isSigned /></p>);
    expect(within(screen.getByTestId("purse")).queryByRole("img", { name: "Red Coin" })).toBeNull();
    expect(screen.getByTestId("purse")).toHaveTextContent("-2");
  });

  test("the Pilot tab tells the chapter under way, its steps and every line decoded so far", () => {
    openHangar(new Career({ ...newCareer(), story: { chapter: 2, progress: [0, 0] } }));

    const story = screen.getByRole("region", { name: voyage.career.story.title });

    expect(within(story).getByText(voyage.career.story.chapters.ai.title)).toBeInTheDocument();
    expect(within(story).getByText(`Chapter 3 of ${STORY.length}`)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.steps.aiSave)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.waiting)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.chapters.launch.line)).toBeInTheDocument();
    expect(within(story).getByText(voyage.career.story.chapters.matrix.line)).toBeInTheDocument();
    expect(within(story).queryByText(voyage.career.story.chapters.ai.line)).toBeNull();
  });

  test("once the story is told, only its lines remain", () => {
    openHangar(new Career({ ...newCareer(), story: { chapter: STORY.length, progress: [] } }));

    const story = screen.getByRole("region", { name: voyage.career.story.title });

    expect(within(story).getByText(voyage.career.story.told)).toBeInTheDocument();
    expect(within(story).getAllByRole("listitem")).toHaveLength(STORY.length);
  });
});
