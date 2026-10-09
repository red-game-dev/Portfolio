import { fireEvent, render, screen } from "@testing-library/react";

import { LensProvider } from "@/components/Lens/context/LensContext";
import { RegionDialog } from "@/components/Projects/RegionDialog";
import { ScreenCarousel } from "@/components/Projects/ScreenCarousel";
import { portfolioData } from "@/data/resume";

describe("RegionDialog", () => {
  const plain = portfolioData.projects.filter((project) => !project.deepDive);

  it("travels between regions with a bare arrow key and leaves the key's own action to the browser", () => {
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

    expect(fireEvent.keyDown(dialog, { key: "ArrowRight" })).toBe(true);
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

  // jsdom does not scroll elements.
  beforeAll(() => {
    if (typeof HTMLElement.prototype.scrollTo !== "function") {
      HTMLElement.prototype.scrollTo = () => undefined;
    }
  });

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
