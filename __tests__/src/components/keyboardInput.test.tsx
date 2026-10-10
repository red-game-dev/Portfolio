import { fireEvent, render, screen } from "@testing-library/react";

import { LensProvider } from "@/components/Lens/context/LensContext";
import { LensSwitch } from "@/components/Lens/LensSwitch";
import { RegionDialog } from "@/components/Projects/RegionDialog";
import { ScreenCarousel } from "@/components/Projects/ScreenCarousel";
import { Terminal } from "@/components/Terminal";
import { portfolioData } from "@/data/resume";
import { createPortfolioTerminal } from "@/services/terminal/portfolioTerminal";

// jsdom neither scrolls elements nor brings them into view.
beforeAll(() => {
  if (typeof HTMLElement.prototype.scrollTo !== "function") {
    HTMLElement.prototype.scrollTo = () => undefined;
  }

  if (typeof Element.prototype.scrollIntoView !== "function") {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

describe("RegionDialog", () => {
  const plain = portfolioData.projects.filter((project) => !project.deepDive);

  it("travels between regions with a bare arrow key, which is the dialog's alone", () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();

    render(
      <LensProvider>
        <RegionDialog
          project={plain[1]}
          previous={null}
          next={plain[2]}
          content={portfolioData.projectMap}
          period=""
          onClose={jest.fn()}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </LensProvider>,
    );

    const dialog = document.querySelector("dialog") as HTMLDialogElement;

    expect(fireEvent.keyDown(dialog, { key: "ArrowRight" })).toBe(false);
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dialog, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(dialog, { key: "ArrowRight", ctrlKey: true });
    fireEvent.keyDown(dialog, { key: "ArrowRight", altKey: true });
    fireEvent.keyDown(dialog, { key: "ArrowRight", metaKey: true });
    expect(onNext).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(onPrevious).not.toHaveBeenCalled();
  });
});

describe("ScreenCarousel", () => {
  const screens = portfolioData.projects.find((project) => (project.deepDive?.screens?.length ?? 0) > 1)?.deepDive?.screens ?? [];
  const labels = { previous: "Previous shot", next: "Next shot", position: "Shot {index} of {count}" };

  it("moves between shots with the arrow keys and keeps them from the dialog around it", () => {
    const outside = jest.fn();

    document.body.addEventListener("keydown", outside);
    render(<ScreenCarousel screens={screens} labels={labels} />);

    expect(fireEvent.keyDown(screen.getByRole("button", { name: labels.next }), { key: "ArrowRight" })).toBe(false);
    expect(outside).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: `Shot 2 of ${screens.length}` })).toHaveAttribute("aria-current", "true");

    fireEvent.keyDown(screen.getByRole("button", { name: labels.next }), { key: "ArrowLeft" });
    fireEvent.keyDown(screen.getByRole("button", { name: labels.next }), { key: "ArrowLeft" });
    expect(screen.getByRole("button", { name: `Shot 1 of ${screens.length}` })).toHaveAttribute("aria-current", "true");

    fireEvent.keyDown(screen.getByRole("button", { name: labels.next }), { key: "Enter" });
    expect(outside).toHaveBeenCalledTimes(1);
    document.body.removeEventListener("keydown", outside);
  });
});

describe("Terminal", () => {
  const renderTerminal = () => render(
    <LensProvider>
      <Terminal intro={portfolioData.sections.terminal} content={portfolioData.terminal} createSession={createPortfolioTerminal} />
    </LensProvider>,
  );
  const prompt = () => screen.getByLabelText(portfolioData.terminal.inputLabel);

  it("brings the reader to the prompt with slash, backtick or the backtick key, but not with Ctrl or Cmd", () => {
    renderTerminal();

    expect(fireEvent.keyDown(document.body, { key: "/", ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(document.body, { key: "`", metaKey: true })).toBe(true);
    expect(prompt()).not.toHaveFocus();

    expect(fireEvent.keyDown(document.body, { key: "/" })).toBe(false);
    expect(prompt()).toHaveFocus();

    prompt().blur();
    fireEvent.keyDown(document.body, { key: "Dead", code: "Backquote" });
    expect(prompt()).toHaveFocus();

    prompt().blur();
    fireEvent.keyDown(document.body, { key: "`", altKey: true });
    expect(prompt()).toHaveFocus();
  });

  it("leaves the shortcut alone while the reader types in a field", () => {
    renderTerminal();

    const field = document.createElement("textarea");

    document.body.append(field);
    field.focus();
    expect(fireEvent.keyDown(field, { key: "/" })).toBe(true);
    expect(field).toHaveFocus();
    field.remove();
  });

  it("recalls commands with the arrows and completes one with Tab, leaving Tab alone on an empty prompt", () => {
    renderTerminal();

    fireEvent.change(prompt(), { target: { value: "help" } });
    fireEvent.submit(prompt());
    expect(prompt()).toHaveValue("");

    expect(fireEvent.keyDown(prompt(), { key: "ArrowUp" })).toBe(false);
    expect(prompt()).toHaveValue("help");

    fireEvent.keyDown(prompt(), { key: "ArrowDown" });
    expect(prompt()).toHaveValue("");

    expect(fireEvent.keyDown(prompt(), { key: "Tab" })).toBe(true);

    fireEvent.change(prompt(), { target: { value: "hel" } });
    expect(fireEvent.keyDown(prompt(), { key: "Tab" })).toBe(false);
    expect(prompt()).toHaveValue("help");
  });

  it("leaves Shift+Tab and Shift+arrows to the browser, so a keyboard can always leave the prompt", () => {
    renderTerminal();

    fireEvent.change(prompt(), { target: { value: "hel" } });
    expect(fireEvent.keyDown(prompt(), { key: "Tab", shiftKey: true })).toBe(true);
    expect(prompt()).toHaveValue("hel");
    expect(fireEvent.keyDown(prompt(), { key: "ArrowUp", shiftKey: true })).toBe(true);
    expect(prompt()).toHaveValue("hel");
  });
});

describe("LensSwitch", () => {
  const renderSwitch = () => render(
    <LensProvider>
      <LensSwitch content={portfolioData.lens} />
      <button type="button">Elsewhere</button>
    </LensProvider>,
  );
  const toggle = () => screen.getByRole("button", { name: new RegExp(portfolioData.lens.switchLabel) });
  const options = () => screen.queryAllByRole("button", { name: new RegExp(portfolioData.lens.cards[0].tagline) });

  it("closes on a press anywhere else, but not on a press inside", () => {
    renderSwitch();

    fireEvent.click(toggle());
    expect(options()).toHaveLength(1);

    fireEvent.pointerDown(options()[0]);
    expect(options()).toHaveLength(1);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Elsewhere" }));
    expect(options()).toHaveLength(0);
  });

  it("closes when focus leaves it, not when it moves between its own buttons", () => {
    renderSwitch();

    fireEvent.click(toggle());
    fireEvent.blur(toggle(), { relatedTarget: options()[0] });
    expect(options()).toHaveLength(1);

    fireEvent.blur(options()[0], { relatedTarget: screen.getByRole("button", { name: "Elsewhere" }) });
    expect(options()).toHaveLength(0);
  });

  it("closes on Escape and hands focus back to its button, taking the key for itself", () => {
    renderSwitch();

    fireEvent.click(toggle());
    expect(fireEvent.keyDown(options()[0], { key: "Escape" })).toBe(false);
    expect(options()).toHaveLength(0);
    expect(toggle()).toHaveFocus();
  });
});
