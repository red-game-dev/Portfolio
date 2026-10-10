import { act, render } from "@testing-library/react";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";

import { AppLoaderProvider } from "@/components/AppLoader/context/AppLoaderContext";
import { GameProvider } from "@/components/Game/context/GameContext";
import { LensProvider } from "@/components/Lens/context/LensContext";
import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { JOURNEY_STOPS } from "@/config/journey";
import { LENSES } from "@/config/lenses";
import { SECTION_IDS } from "@/config/sections";
import Home from "@/pages/index";

// The build hands next/image the images config from next.config.js; Jest does not, so it goes in here.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { images } = require("../../../next.config.js") as { images: Partial<typeof imageConfigDefault> };

// The whole page, in the providers _app gives it, as each view. Hydration mismatches still only show in a
// browser; this catches a section that throws, loses its id, or logs an error while rendering.
const renderPage = () => render(
  <ImageConfigContext.Provider value={{ ...imageConfigDefault, ...images }}>
    <AppLoaderProvider>
      <PreferencesProvider>
        <LensProvider>
          <GameProvider>
            <Home />
          </GameProvider>
        </LensProvider>
      </PreferencesProvider>
    </AppLoaderProvider>
  </ImageConfigContext.Provider>,
);

// Glance only renders in the views that have a fact sheet or a playbook.
const ALWAYS = Object.entries(SECTION_IDS).filter(([key]) => key !== "glance")
.map(([, id]) => id);

describe("Home", () => {
  let errors: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    errors = jest.spyOn(console, "error");
  });

  afterEach(() => {
    errors.mockRestore();
    jest.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it.each(LENSES)("renders every section, the journey and its stops in the %s view without an error", (lens) => {
    window.history.replaceState(null, "", `/?view=${lens}`);

    const { container, unmount } = renderPage();

    // Past the intro, so the page is ready and the view has settled.
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(ALWAYS.filter((id) => !container.querySelector(`#${id}`))).toEqual([]);
    expect(JOURNEY_STOPS.filter(({ href }) => !container.querySelector(href))).toEqual([]);
    expect(document.documentElement.dataset.lens).toBe(lens);
    expect(errors).not.toHaveBeenCalled();
    unmount();
  });

  // Search engines and AI crawlers read the server HTML's text, so the decode effect draws its bits from an
  // attribute; the text holds only the real words.
  it("keeps the decode effect's bits out of the page's text", () => {
    const { container, unmount } = renderPage();

    expect(container.textContent?.match(/\b[01]{8,}\b/g) ?? []).toEqual([]);
    expect(container.querySelectorAll("[data-bits]").length).toBeGreaterThan(0);
    unmount();
  });
});
