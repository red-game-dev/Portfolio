import { useEffect, useRef, useState } from "react";

import { NextSeo } from "next-seo";
import tw, { styled } from "twin.macro";

import { createBackdropEngine } from "@/components/Journey/backdropEngine";
import { CARD_FPS, CARD_MS, cardAt, countUp } from "@/components/SocialCard/timeline";
import { SITE_URL } from "@/config/site";
import { ZONE_ACCENTS, ZONE_BOUNDARIES } from "@/config/zones";
import { portfolioData } from "@/data/resume";
import seoDetails from "@/data/seo";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { decodeFrame, toBinaryMask } from "@/packages/encoding/binary";
import { clamp } from "@/packages/math/clamp";
import { createSeededRandom } from "@/packages/math/random";

const { details, headline, cvDocument, journeyTrail } = portfolioData;

// The figures the card shows, picked by id so a changed figure changes the card when it is printed again.
const FIGURE_IDS = ["industry", "reach", "startups"];

const figures = FIGURE_IDS.flatMap((id) => details.proof.filter((figure) => figure.id === id));

const domain = SITE_URL.replace(/^https?:\/\/(www\.)?/, "");

const ZONES = ZONE_BOUNDARIES.map(({ zone }) => zone);

const CARD_SEED = 2010;

const { width, height } = seoDetails.socialCard;

const Card = styled.main`
  ${tw`relative overflow-hidden flex flex-col text-white`}

  width: ${width}px;
  height: ${height}px;
  padding: 64px 80px 56px;
  box-sizing: border-box;
  background: #0c0c0e;
`;

// The journey's own backdrop behind the card, each universe's scene in turn.
const Backdrop = tw.canvas`absolute inset-0 w-full h-full`;

// Darkens the backdrop under the words on the left and leaves the right open, where each universe shows through, with
// the corners lit as the still card always was.
const Veil = styled.div`
  ${tw`absolute inset-0 pointer-events-none`}

  background:
    radial-gradient(circle at 12% 0%, rgba(75, 255, 165, 0.12), transparent 42%),
    radial-gradient(circle at 100% 100%, rgba(196, 210, 255, 0.1), transparent 45%),
    linear-gradient(90deg, rgba(12, 12, 14, 0.8) 0%, rgba(12, 12, 14, 0.55) 45%, rgba(12, 12, 14, 0.12) 100%);
`;

// The site's backdrop guides, a third and two thirds across.
const Guides = styled.div`
  ${tw`absolute inset-0 pointer-events-none`}

  background:
    linear-gradient(to right, transparent calc(33.333% - 1px), rgba(255, 255, 255, 0.05) 33.333%, transparent calc(33.333% + 1px)),
    linear-gradient(to right, transparent calc(66.666% - 1px), rgba(255, 255, 255, 0.05) 66.666%, transparent calc(66.666% + 1px));
`;

const Name = tw.h1`relative m-0 text-[84px] leading-[1] font-bold tracking-[-2px] whitespace-pre`;

const Role = tw.p`relative m-0 mt-[16px] text-[34px] leading-[1.2] font-medium text-[#dcdcdc] whitespace-pre`;

const Availability = tw.p`relative m-0 mt-[12px] text-[21px] text-[#9d9d9d] whitespace-pre`;

const Figures = tw.dl`relative m-0 mt-[46px] grid grid-cols-3 gap-[40px]`;

const Figure = tw.div`flex flex-col gap-[6px]`;

const Value = tw.dt`text-[56px] leading-[1] font-bold text-[#4bffa5] tracking-[-1px]`;

const Label = tw.dd`m-0 text-[18px] leading-[1.35] text-[#a8a8a8]`;

const Footer = tw.footer`relative mt-auto flex flex-col gap-[12px]`;

const Band = tw.ol`m-0 p-0 list-none grid grid-cols-7 gap-[6px]`;

// Each universe on the band, its bar filling as it lights (--fill, 0 to 1) and its name coming up with it.
const Zone = styled.li`
  ${tw`flex flex-col gap-[8px] text-[15px] font-semibold`}

  color: var(--zone);
  opacity: calc(0.25 + var(--fill) * 0.75);

  &::before {
    content: "";
    height: 8px;
    background: var(--zone);
    transform: scaleX(var(--fill));
    transform-origin: left center;
  }
`;

const Domain = tw.p`absolute right-0 bottom-[44px] m-0 text-[20px] font-semibold text-white`;

declare global {
  interface Window {
    // Set while the card is being recorded (`?record`): moves the film to a moment, for the recorder to capture.
    socialCard?: { seek: (ms: number) => void };
  }
}

// The finished card at once, with nothing moving: for a reader who asked for less motion, or `?still`.
const isStillCard = () => prefersReducedMotion() || new URLSearchParams(window.location.search).has("still");

const isRecorded = () => new URLSearchParams(window.location.search).has("record");

// The share card's clock: the finished card on the server and until everything it draws with is loaded, then the
// journey from its first frame, ending on the finished card. A reader who asked for less motion, or `?still`, gets the
// finished card at once. Recorded (`?record`), it keeps no clock of its own: scripts/social-card.mjs moves it frame by
// frame through `window.socialCard.seek`, and reads back which moment it drew (`data-card-at`).
// It also says whether the film has started, so the backdrop follows the timeline only from then: before, the finished
// card's last universe would cross back into the first.
const useCardClock = (isReady: boolean) => {
  const [ms, setMs] = useState(CARD_MS);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setIsStarted(true);

    if (isStillCard()) {
      return;
    }

    if (isRecorded()) {
      setMs(0);
      window.socialCard = { seek: (at) => setMs(clamp(at, 0, CARD_MS)) };

      return () => {
        window.socialCard = undefined;
      };
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = clamp(now - start, 0, CARD_MS);

      setMs(elapsed);

      if (elapsed < CARD_MS) {
        frame = requestAnimationFrame(tick);
      }
    };

    setMs(0);
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isReady]);

  return { ms, isStarted };
};

const decoded = (text: string, progress: number, tick: number) => decodeFrame(text, toBinaryMask(text), Math.floor(progress * Array.from(text).length), tick);

// The picture shown when the site is shared (Open Graph and X), as a film of the journey: the name decodes from
// binary, each universe lights on the band as the backdrop crosses into it, the figures count up, and it warps into
// the stars and holds on the card. Not a page for readers: it is recorded to public/images/social-card.mp4 and its
// last frame to social-card.png at 1200 by 630, and kept out of search.
export default function SocialCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasFonts, setHasFonts] = useState(false);
  const engine = useCanvasEngine(canvasRef, {
    contextOptions: { alpha: false },
    nearMargin: "0px",
    create: (context) => createBackdropEngine(context, {
      zone: ZONES[0],
      isStatic: isStillCard(),
      config: { background: "#0c0c0e", fadeMs: 600, maxPixelRatio: 1 },
      // The same draws every time, so the same page records the same film.
      random: createSeededRandom(CARD_SEED),
    }),
    resize: (backdrop, size) => backdrop.resize(size.width, size.height, size.pixelRatio),
  }, []);
  const isReady = engine !== null && hasFonts;
  const { ms, isStarted } = useCardClock(isReady);
  const frame = cardAt(ms, ZONES);

  useEffect(() => {
    let isGone = false;

    void document.fonts.ready.then(() => {
      if (!isGone) {
        setHasFonts(true);
      }
    });

    return () => {
      isGone = true;
    };
  }, []);

  useEffect(() => {
    engine?.start();
  }, [engine]);

  useEffect(() => {
    if (isStarted) {
      engine?.setScene(frame.zone);
    }
  }, [engine, frame.zone, isStarted]);

  return (
    <Card data-card-ready={isReady ? "" : undefined} data-card-ms={CARD_MS} data-card-fps={CARD_FPS} data-card-at={Math.round(ms)}>
      <NextSeo title={seoDetails.socialCard.alt} noindex nofollow />
      <Backdrop ref={canvasRef} aria-hidden="true" />
      <Veil aria-hidden="true" />
      <Guides aria-hidden="true" />
      <Name>{decoded(details.name, frame.name, frame.tick)}</Name>
      <Role>{decoded(cvDocument.headline, frame.role, frame.tick)}</Role>
      <Availability>{decoded(headline.availability, frame.availability, frame.tick)}</Availability>
      <Figures>
        {figures.map((figure) => (
          <Figure key={figure.id}>
            <Value>{countUp(figure.value, frame.figures)}</Value>
            <Label>{figure.label}</Label>
          </Figure>
        ))}
      </Figures>
      <Footer>
        <Domain>{domain}</Domain>
        <Band aria-label={Object.values(journeyTrail.zones).join(", ")}>
          {ZONES.map((zone, index) => (
            <Zone key={zone} style={{ "--zone": ZONE_ACCENTS[zone], "--fill": clamp(frame.lit - index, 0, 1) }}>
              {journeyTrail.zones[zone]}
            </Zone>
          ))}
        </Band>
      </Footer>
    </Card>
  );
}
