// Records the share card from a deployed /social-card/?record: for every frame the backdrop's clock is moved on
// (Playwright's fake clock drives its animation frames and performance.now) and the card is sent to that moment
// (window.socialCard.seek), then captured once it says it drew it, so every frame lands at exactly its moment however
// slow the machine. The frames become public/images/social-card.mp4, and the last frame,
// the finished card, public/images/social-card.png. Needs ffmpeg on the path. Run by .github/workflows/social-card.yml.
//
//   SOCIAL_CARD_URL=https://www.redgame.dev node scripts/social-card.mjs

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "@playwright/test";

const BASE = (process.env.SOCIAL_CARD_URL ?? "https://www.redgame.dev").replace(/\/$/, "");
const OUT = "public/images";
const WIDTH = 1200;
const HEIGHT = 630;

// The page answers its own length and pace, so the film follows src/components/SocialCard/timeline.ts.
const readTiming = (page) => page.evaluate(() => {
  const card = document.querySelector("[data-card-ready]");

  return card && window.socialCard ? { ms: Number(card.getAttribute("data-card-ms")), fps: Number(card.getAttribute("data-card-fps")) } : null;
});

// Sends the card to a moment and waits, in real time, until it has drawn it and the browser has painted two frames
// since, so the screenshot is that moment and not the last one painted (a fast machine outran the paint).
const seek = async (page, at) => {
  await page.evaluate((moment) => window.socialCard.seek(moment), at);

  for (let tries = 0; tries < 200; tries += 1) {
    if (await page.evaluate((moment) => document.querySelector("[data-card-ready]")?.getAttribute("data-card-at") === String(moment), at)) {
      await page.evaluate(() => new Promise((resolve) => window.paintedFrame(() => window.paintedFrame(resolve))));

      return;
    }

    await page.waitForTimeout(10);
  }

  throw new Error(`The card never drew ${at} ms`);
};

const frames = mkdtempSync(join(tmpdir(), "social-card-"));
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

  // The browser's own frames, kept before the fake clock takes requestAnimationFrame over.
  await page.addInitScript(() => {
    window.paintedFrame = window.requestAnimationFrame.bind(window);
  });
  await page.clock.install();
  await page.goto(`${BASE}/social-card/?record`, { waitUntil: "networkidle" });
  // Vercel's toolbar on a preview is not part of the card.
  await page.addStyleTag({ content: "vercel-live-feedback { display: none !important; }" });

  let timing = null;

  // Everything the card draws with loads in real time while its clock stands still, then it says it is ready.
  for (let tries = 0; tries < 200 && !timing; tries += 1) {
    await page.clock.runFor(50);
    await page.waitForTimeout(50);
    timing = await readTiming(page);
  }

  if (!timing) {
    throw new Error(`The card at ${BASE}/social-card/ never said it was ready`);
  }

  const count = Math.round((timing.ms / 1000) * timing.fps);
  let elapsed = 0;

  for (let index = 0; index <= count; index += 1) {
    const at = Math.round((index * 1000) / timing.fps);

    if (at > elapsed) {
      await page.clock.runFor(at - elapsed);
      elapsed = at;
    }

    await seek(page, at);
    await page.screenshot({ path: join(frames, `${String(index).padStart(4, "0")}.png`), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  }

  const encoded = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(timing.fps), "-i", join(frames, "%04d.png"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
    join(OUT, "social-card.mp4"),
  ], { stdio: "inherit" });

  if (encoded.status !== 0) {
    throw new Error("ffmpeg could not encode the card");
  }

  copyFileSync(join(frames, `${String(count).padStart(4, "0")}.png`), join(OUT, "social-card.png"));
  console.log(`social-card.mp4 ${Math.round(statSync(join(OUT, "social-card.mp4")).size / 1024)} KB, ${count + 1} frames from ${BASE}`);
} finally {
  await browser.close();
  rmSync(frames, { recursive: true, force: true });
}
