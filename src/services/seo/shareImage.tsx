import { readFile } from "fs/promises";

import type { CSSProperties } from "react";

import { join } from "path";

import { ImageResponse } from "next/og";


import { BACKDROP_THEME } from "@/config/theme";
import { rgba } from "@/packages/graphics/colour";
import { createSeededRandom } from "@/packages/math/random";
import { ShareCardContent } from "@/services/seo/shareCard";

export const SHARE_IMAGE = { width: 1200, height: 630 };

// Roboto as the site sets it, the three weights the card uses, read from the repository (next.config.js traces them
// into the route). SIL Open Font License, beside the files.
const FONT_DIR = join(process.cwd(), "src/assets/fonts/roboto");
const WEIGHTS: ReadonlyArray<400 | 500 | 700> = [400, 500, 700];

const fonts = () => Promise.all(WEIGHTS.map(async (weight) => ({
  name: "Roboto",
  data: await readFile(join(FONT_DIR, `roboto-${weight}.ttf`)),
  weight,
  style: "normal" as const,
})));

// The film's last moment: Beyond's starfield, the same stars every time (seeded), each a small dot of light.
const STARS = (() => {
  const random = createSeededRandom(2010);

  return Array.from({ length: 150 }, () => ({
    x: Math.round(random() * SHARE_IMAGE.width),
    y: Math.round(random() * SHARE_IMAGE.height),
    size: random() < 0.85 ? 1.5 : 2.5,
    alpha: Math.round((0.25 + random() * 0.65) * 100) / 100,
  }));
})();

const layer: CSSProperties = { position: "absolute", left: 0, top: 0, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, display: "flex" };

const PADDING = { top: 64, side: 80, bottom: 56 };
const INNER = SHARE_IMAGE.width - PADDING.side * 2;

// The share card as the site draws it on request: the words, the figures and the journey's band over the last moment
// of the film, Beyond's stars with its nebulae, darkened under the words, the corners lit as the page lights them.
const ShareCard = ({ card }: { card: ShareCardContent }) => {
  const star = BACKDROP_THEME.stars.star;
  const [nebula, haze] = BACKDROP_THEME.stars.nebula;
  const figureWidth = (INNER - 40 * 2) / 3;
  const zoneWidth = (INNER - 6 * (card.zones.length - 1)) / card.zones.length;

  return (
    <div style={{ ...layer, position: "relative", background: "#0c0c0e", fontFamily: "Roboto", color: "#ffffff" }}>
      <div style={{ ...layer, backgroundImage: `radial-gradient(circle at 78% 32%, ${rgba(nebula, 0.16)}, transparent 45%)` }} />
      <div style={{ ...layer, backgroundImage: `radial-gradient(circle at 92% 88%, ${rgba(haze, 0.14)}, transparent 40%)` }} />
      {STARS.map(({ x, y, size, alpha }, index) => (
        <div
          key={index}
          style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size, background: rgba(star, alpha) }}
        />
      ))}
      <div style={{ ...layer, backgroundImage: "linear-gradient(90deg, rgba(12, 12, 14, 0.8) 0%, rgba(12, 12, 14, 0.55) 45%, rgba(12, 12, 14, 0.12) 100%)" }} />
      <div style={{ ...layer, backgroundImage: "radial-gradient(circle at 12% 0%, rgba(75, 255, 165, 0.12), transparent 42%)" }} />
      <div style={{ ...layer, backgroundImage: "radial-gradient(circle at 100% 100%, rgba(196, 210, 255, 0.1), transparent 45%)" }} />
      <div style={{ position: "absolute", left: SHARE_IMAGE.width / 3, top: 0, width: 1, height: SHARE_IMAGE.height, background: "rgba(255, 255, 255, 0.05)" }} />
      <div style={{ position: "absolute", left: (SHARE_IMAGE.width * 2) / 3, top: 0, width: 1, height: SHARE_IMAGE.height, background: "rgba(255, 255, 255, 0.05)" }} />
      <div
        style={{
          ...layer,
          flexDirection: "column",
          padding: `${PADDING.top}px ${PADDING.side}px ${PADDING.bottom}px`,
        }}
      >
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }}>{card.name}</div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 34, fontWeight: 500, lineHeight: 1.2, color: "#dcdcdc" }}>{card.role}</div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 21, color: "#9d9d9d" }}>{card.availability}</div>
        <div style={{ display: "flex", marginTop: 46, gap: 40 }}>
          {card.figures.map((figure) => (
            <div key={figure.id} style={{ display: "flex", flexDirection: "column", gap: 6, width: figureWidth }}>
              <div style={{ display: "flex", fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: -1, color: "#4bffa5" }}>{figure.value}</div>
              <div style={{ display: "flex", fontSize: 18, lineHeight: 1.35, color: "#a8a8a8" }}>{figure.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 20, fontWeight: 700 }}>{card.domain}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {card.zones.map((zone) => (
              <div key={zone.id} style={{ display: "flex", flexDirection: "column", gap: 8, width: zoneWidth, fontSize: 15, fontWeight: 700, color: zone.accent }}>
                <div style={{ display: "flex", height: 8, background: zone.accent }} />
                {zone.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// The share card as a PNG, drawn from the content each time it is asked for (the route caches it at the edge). Without
// its fonts it still draws, in the face next/og carries, rather than failing every crawler that asks.
export const renderShareImage = async (card: ShareCardContent): Promise<Buffer> => {
  const faces = await fonts().catch((error: unknown) => {
    process.stdout.write(`${JSON.stringify({ event: "share.fonts", outcome: "fallback", error: String(error) })}\n`);

    return undefined;
  });
  const response = new ImageResponse(<ShareCard card={card} />, { ...SHARE_IMAGE, fonts: faces });

  return Buffer.from(await response.arrayBuffer());
};
