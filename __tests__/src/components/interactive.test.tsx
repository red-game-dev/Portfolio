import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppLoader } from "@/components/AppLoader";
import { AppLoaderProvider } from "@/components/AppLoader/context/AppLoaderContext";
import { Carousel } from "@/components/Carousel";
import { RecruiterGlance } from "@/components/Glance/RecruiterGlance";
import { LensGate } from "@/components/Lens";
import { LensProvider } from "@/components/Lens/context/LensContext";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { useLensStatusHook } from "@/components/Lens/hooks/useLensStatusHook";
import { LENS_STORAGE_KEY } from "@/config/lenses";
import { portfolioData } from "@/data/resume";
import useTabs from "@/hooks/useTabs";
import { createForgeStations } from "@/services/skills";

const Tabs = ({ onSelect }: { onSelect: (next: number, previous: number) => void }) => {
  const { active, listProps, tabProps, panelProps } = useTabs({ count: 3, onSelect });

  return (
    <>
      <div {...listProps}>
        {["One", "Two", "Three"].map((name, index) => <button key={name} {...tabProps(index)}>{name}</button>)}
      </div>
      <div {...panelProps(active)}>{`Panel ${active}`}</div>
    </>
  );
};

describe("useTabs", () => {
  it("wires tabs to their panel, with one tab stop", () => {
    render(<Tabs onSelect={jest.fn()} />);

    const [one, two] = screen.getAllByRole("tab");

    expect(one).toHaveAttribute("aria-selected", "true");
    expect(one).toHaveAttribute("tabindex", "0");
    expect(two).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", one.id);
    expect(one).toHaveAttribute("aria-controls", screen.getByRole("tabpanel").id);
  });

  it("moves with arrows, Home and End, wrapping, and tells the caller where from", () => {
    const onSelect = jest.fn();

    render(<Tabs onSelect={onSelect} />);

    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(onSelect).toHaveBeenLastCalledWith(2, 0);
    expect(tabs[2]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel 2");

    fireEvent.keyDown(tabs[2], { key: "Home" });
    expect(onSelect).toHaveBeenLastCalledWith(0, 2);

    fireEvent.keyDown(tabs[0], { key: "End" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel 2");
  });

  it("does nothing when the open tab is picked again", () => {
    const onSelect = jest.fn();

    render(<Tabs onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole("tab")[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("Carousel", () => {
  const items = ["Alpha", "Beta", "Gamma"];
  const renderCarousel = () => render(
    <LensProvider>
      <Carousel items={items} getKey={(item) => item} renderItem={(item) => <p>{item}</p>} label="Letters" labels={portfolioData.carouselLabels} />
    </LensProvider>,
  );
  const slides = () => Array.from(document.querySelectorAll<HTMLElement>("[aria-roledescription=slide]"));
  const visible = () => slides().filter((slide) => !slide.hidden)
.map((slide) => slide.textContent);

  it("keeps every card in the page and shows one page at a time", () => {
    renderCarousel();

    expect(slides()).toHaveLength(3);
    expect(visible()).toEqual(["Alpha"]);
  });

  it("turns pages forwards and backwards, wrapping at the ends", () => {
    renderCarousel();

    fireEvent.click(screen.getByRole("button", { name: portfolioData.carouselLabels.next }));
    expect(visible()).toEqual(["Beta"]);

    fireEvent.click(screen.getByRole("button", { name: portfolioData.carouselLabels.previous }));
    fireEvent.click(screen.getByRole("button", { name: portfolioData.carouselLabels.previous }));
    expect(visible()).toEqual(["Gamma"]);
  });
});

const Probe = () => {
  const { lens } = useLensStateHook();
  const { status } = useLensStatusHook();

  return <output data-testid="probe">{`${lens} ${status}`}</output>;
};

const Gate = () => (
  <AppLoaderProvider>
    <AppLoader />
    <LensProvider>
      <LensGate content={portfolioData.lens} counts={{ zones: 5, bosses: 3 }} candidate={{ name: "Red", role: "Architect", checks: ["Available now"] }} />
      <Probe />
    </LensProvider>
  </AppLoaderProvider>
);

describe("LensGate", () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  const pastIntro = () => act(() => {
    jest.advanceTimersByTime(1100);
  });

  it("asks a first time reader to choose after the intro, and remembers the choice", async () => {
    render(<Gate />);
    pastIntro();

    expect(screen.getByTestId("probe")).toHaveTextContent("engineer choosing");
    expect(document.querySelector("dialog")?.open).toBe(true);

    const card = document.querySelector<HTMLButtonElement>("[data-lens-card=recruiter]");

    fireEvent.click(card as HTMLButtonElement);
    expect(screen.getByTestId("probe")).toHaveTextContent("recruiter entering");
    expect(JSON.parse(window.localStorage.getItem(LENS_STORAGE_KEY) ?? "null")).toBe("recruiter");
    // The entrance is its own chunk; let it arrive before the test ends.
    await waitFor(() => expect(document.querySelector("dialog")).toHaveAttribute("aria-label", portfolioData.lens.names.recruiter));
    await act(async () => {
      await Promise.resolve();
    });
  });

  it("opens straight into a remembered view, including one stored before values were JSON", () => {
    window.localStorage.setItem(LENS_STORAGE_KEY, "product");
    render(<Gate />);
    pastIntro();

    expect(screen.getByTestId("probe")).toHaveTextContent("product chosen");
    expect(document.querySelector("dialog")?.open).toBe(false);
  });

  it("lets a link pick the view without overwriting the reader's own choice", () => {
    window.localStorage.setItem(LENS_STORAGE_KEY, JSON.stringify("product"));
    window.history.replaceState(null, "", "/?view=recruiter");
    render(<Gate />);
    pastIntro();

    expect(screen.getByTestId("probe")).toHaveTextContent("recruiter chosen");
    expect(JSON.parse(window.localStorage.getItem(LENS_STORAGE_KEY) ?? "null")).toBe("product");
  });

  it("opens the full page when the reader skips the choice with Escape", () => {
    render(<Gate />);
    pastIntro();

    const dialog = document.querySelector("dialog") as HTMLDialogElement;

    expect(dialog.open).toBe(true);
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.getByTestId("probe")).toHaveTextContent("engineer chosen");
    expect(dialog.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
  });
});

describe("RecruiterGlance", () => {
  const { recruiter } = portfolioData.lens.glance;
  const renderGlance = () => render(
    <RecruiterGlance
      content={recruiter}
      details={portfolioData.details}
      headline={portfolioData.headline}
      experience={portfolioData.experience}
      roster={portfolioData.roster}
      stations={createForgeStations(portfolioData)}
      cvUrl={portfolioData.cv}
      fullResume={portfolioData.fullResume}
    />,
  );

  afterEach(() => window.history.replaceState(null, "", "/"));

  it("leads with why I fit the role being hired for, and keeps it in a link to share", () => {
    const cto = recruiter.hires.find((hire) => hire.id === "cto");

    renderGlance();
    expect(screen.queryByText(cto?.fit ?? "")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: cto?.label }));
    expect(screen.getByText(cto?.fit ?? "")).toBeInTheDocument();
    expect(window.location.hash).toBe("#hiring-cto");

    fireEvent.click(screen.getByRole("button", { name: recruiter.everyRoleLabel }));
    expect(screen.queryByText(cto?.fit ?? "")).toBeNull();
    expect(window.location.hash).toBe("");
  });

  it("opens on the role a shared link names", () => {
    window.history.replaceState(null, "", "/#hiring-frontend");
    renderGlance();

    expect(screen.getByRole("button", { name: "Senior Frontend" })).toHaveAttribute("aria-pressed", "true");
  });
});
