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
import { ZONE_BOUNDARIES, ZoneId } from "@/config/zones";
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

  // Each section sits in the run of its own zone, so it keeps that zone's accent however far the reader has gone, and
  // a crossing restyles none of them.
  it("keeps every section in the run of its own zone", () => {
    // The recruiter's view, past the intro, so Glance is on the page too.
    window.history.replaceState(null, "", "/?view=recruiter");

    const { container, unmount } = renderPage();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    let zone: ZoneId = ZONE_BOUNDARIES[0].zone;
    const misplaced = Object.values(SECTION_IDS).flatMap((id) => {
      zone = ZONE_BOUNDARIES.find(({ startsAt }) => startsAt === id)?.zone ?? zone;
      const section = container.querySelector(`#${id}`);
      // The nearest run, never the root, which follows the reader and so carries a zone of its own.
      const holder = section?.closest("[data-zone]");
      const run = section ? (holder && holder !== document.documentElement ? holder.getAttribute("data-zone") : null) : undefined;

      return run === undefined || run === zone ? [] : [`${id} in ${run ?? "no zone"}, not ${zone}`];
    });

    expect(misplaced).toEqual([]);
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
