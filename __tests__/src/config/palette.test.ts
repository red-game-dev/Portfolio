import { readFileSync } from "fs";
import { join } from "path";

import { ZONE_ACCENTS, ZoneId } from "@/config/zones";
import { rgbChannels } from "@/packages/graphics/colour";

// globals.css sets each zone's accent for styled components; ZONE_ACCENTS holds the same colours for
// canvases and inline styles. They have to stay the same colour.
const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

const blockOf = (zone: ZoneId) => {
  const selector = zone === "matrix" ? ":root {" : `:root[data-zone="${zone}"] {`;
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
