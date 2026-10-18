import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBuildingColumns, faCashRegister, faCloud, faCode, faGlobe, faLayerGroup, faServer, faStore,
} from "@fortawesome/free-solid-svg-icons";

import { RECEIPT_PAPER } from "@/components/Payments/scene/looks";
import { PAYMENT_SWITCH_MS } from "@/components/SwitchStage/config";
import { THEME_ACCENTS } from "@/config/sectionThemes";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { CHECKOUT_SCENE as PANEL } from "@/packages/graphics/checkout";
import { paintStory, STORY_AT } from "@/packages/graphics/payment-stories";
import type { StoryIcon, StoryIcons, StoryId, StoryLook } from "@/packages/graphics/payment-stories";

const Canvas = tw.canvas`block w-full h-full`;

const iconOf = ({ icon: [width, height, , , path] }: IconDefinition): StoryIcon => ({ width, height, path: Array.isArray(path) ? path.join(" ") : path });

const ICONS: StoryIcons = {
  gateway: iconOf(faServer),
  bank: iconOf(faBuildingColumns),
  till: iconOf(faCashRegister),
  network: iconOf(faGlobe),
  cloud: iconOf(faCloud),
  platform: iconOf(faLayerGroup),
  seller: iconOf(faStore),
  developer: iconOf(faCode),
};

const LOOK: StoryLook = { accent: THEME_ACCENTS.payments, failure: "#ff6b6b", paper: RECEIPT_PAPER, gold: ["#ffe08a", "#b7811c"] };

// A payments drawing's opening story, drawn on canvas across the switch's panel and played once over the switch.
// With less motion asked for, the switch shows nothing, so nothing is drawn.
export const StoryCanvas: FC<{ story: StoryId }> = ({ story }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || prefersReducedMotion()) {
      return undefined;
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    const tell = STORY_AT[story];
    const started = performance.now();
    let frame = 0;

    canvas.width = Math.round(PANEL.width * ratio);
    canvas.height = Math.round(PANEL.height * ratio);

    const draw = (now: number) => {
      const t = Math.min(1, (now - started) / PAYMENT_SWITCH_MS);

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, PANEL.width, PANEL.height);
      paintStory(context, tell(t), LOOK, ICONS, t);

      if (t < 1) {
        frame = requestAnimationFrame(draw);
      }
    };

    frame = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frame);
  }, [story]);

  return <Canvas ref={canvasRef} aria-hidden="true" />;
};
