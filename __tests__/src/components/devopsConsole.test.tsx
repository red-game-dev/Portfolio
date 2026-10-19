import { act, fireEvent, render, screen } from "@testing-library/react";

import { AppLoaderProvider } from "@/components/AppLoader/context/AppLoaderContext";
import { BlueprintLabelsProvider } from "@/components/Blueprint/context";
import { DevOps } from "@/components/DevOps";
import { GameProvider } from "@/components/Game/context/GameContext";
import { useDeploysStateHook } from "@/components/Game/hooks/useDeploysStateHook";
import { LensProvider } from "@/components/Lens/context/LensContext";
import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { portfolioData } from "@/data/resume";

const { devops } = portfolioData;

const Deploys = () => {
  const { deploysShipped } = useDeploysStateHook();

  return <span data-testid="deploys">{deploysShipped}</span>;
};

const renderSection = () => render(
  <AppLoaderProvider>
    <PreferencesProvider>
      <LensProvider>
        <GameProvider>
          <BlueprintLabelsProvider labels={portfolioData.blueprintLabels}>
            <DevOps intro={portfolioData.sections.devops} content={devops} />
            <Deploys />
          </BlueprintLabelsProvider>
        </GameProvider>
      </LensProvider>
    </PreferencesProvider>
  </AppLoaderProvider>
);

// Each line's timer is set once the last has rendered, so the clock moves a line at a time.
const settle = () => {
  for (let step = 0; step < 12; step += 1) {
    act(() => {
      jest.advanceTimersByTime(600);
    });
  }
};

describe("DevOps guide and console", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("a stack ships to the host the guide picked, is read out live, and counts as a deploy shipped", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: `${devops.console.deploy}: ${devops.console.stacks.mmo}` }));
    settle();

    expect(screen.getByRole("status")).toHaveTextContent(`${devops.console.stacks.mmo}: live on OVH and Hetzner.`);
    expect(screen.getByTestId("deploys")).toHaveTextContent("1");
  });

  test("a new answer changes the plan, and the console ships to the new one", () => {
    renderSection();

    fireEvent.click(screen.getByLabelText(devops.guide.questions.traffic.options.spiky));
    fireEvent.click(screen.getByLabelText(devops.guide.questions.budget.options.balanced));
    fireEvent.click(screen.getByRole("button", { name: `${devops.console.deploy}: ${devops.console.stacks.mmo}` }));
    settle();

    expect(screen.getByRole("status")).toHaveTextContent(`${devops.console.stacks.mmo}: live on AWS.`);
  });

  test("a stack on its way when the guide changes ships where the new plan puts it, not the old", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: `${devops.console.deploy}: ${devops.console.stacks.matrix}` }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByLabelText(devops.guide.questions.traffic.options.spiky));
    settle();

    expect(screen.getByRole("status")).toHaveTextContent(`${devops.console.stacks.matrix}: live on Vercel.`);
    expect(screen.getByText("Live on Vercel")).toBeInTheDocument();
    expect(screen.getByTestId("deploys")).toHaveTextContent("1");
  });

  test("a move takes a stack somewhere else with no downtime, and every universe can ship in turn", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: `${devops.console.move}: ${devops.console.stacks.beyond}` }));
    settle();
    expect(screen.getByRole("status")).toHaveTextContent(`${devops.console.stacks.beyond}: moved from OVH and Hetzner to AWS, with no downtime.`);

    fireEvent.click(screen.getByRole("button", { name: devops.console.deployAll }));

    for (let step = 0; step < 6; step += 1) {
      settle();
    }

    expect(screen.getByTestId("deploys")).toHaveTextContent("7");
  });
});
