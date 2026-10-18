import { readFileSync } from "fs";
import { join } from "path";

import { SectionThemeId, THEME_ACCENTS } from "@/config/sectionThemes";
import { ZONE_ACCENTS, ZoneId } from "@/config/zones";
import { rgbChannels } from "@/packages/graphics/colour";

// globals.css sets each zone's accent for styled components; ZONE_ACCENTS holds the same colours for
// canvases and inline styles. They have to stay the same colour.
const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

const blockOf = (zone: ZoneId) => {
  const selector = `[data-zone="${zone}"]`;
  const start = css.indexOf(selector);

  return css.slice(start, css.indexOf("}", start));
};

describe("zone palette", () => {
  it.each(Object.keys(ZONE_ACCENTS) as ZoneId[])("%s matches globals.css", (zone) => {
    const block = blockOf(zone);

    expect(block).toContain(`--accent: ${ZONE_ACCENTS[zone]};`);
    expect(block).toContain(`--accent-rgb: ${rgbChannels(ZONE_ACCENTS[zone])};`);
  });
});

describe("section theme palette", () => {
  const themeBlock = (theme: SectionThemeId) => {
    const start = css.indexOf(`[data-theme="${theme}"] {`);

    return css.slice(start, css.indexOf("}", start));
  };

  it.each(Object.keys(THEME_ACCENTS) as SectionThemeId[])("%s matches globals.css", (theme) => {
    const block = themeBlock(theme);

    expect(block).toContain(`--accent: ${THEME_ACCENTS[theme]};`);
    expect(block).toContain(`--accent-rgb: ${rgbChannels(THEME_ACCENTS[theme])};`);
  });

  it("gives every section its own colour, none another zone's, only Web3 keeping its own zone's", () => {
    const colours = Object.values(THEME_ACCENTS);
    const zoneColours = Object.entries(ZONE_ACCENTS);

    expect(new Set(colours).size).toBe(colours.length);
    (Object.keys(THEME_ACCENTS) as SectionThemeId[]).forEach((theme) => {
      const sameAs = zoneColours.filter(([, colour]) => colour === THEME_ACCENTS[theme]).map(([zone]) => zone);

      expect(sameAs).toEqual(theme === "web3" ? ["chain"] : []);
    });
  });
});
