import type { RenderLayer } from "@/packages/games/engine";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import type { StarLook } from "@/packages/graphics/globe";
import { createSeededRandom } from "@/packages/math/random";

import { PhenomenonSpec } from "../../domain/universe";
import { VoyageFrame } from "../frame";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

const TAU = Math.PI * 2;
const PULSAR_REACH = 45;

// The dead and dying stars these things are made of.
const NEUTRON_STAR = (seed: number): StarLook => ({ temperatureK: 40000, granulation: 0, spots: 0, corona: 0.5, seed });
const REMNANT = (seed: number): StarLook => ({ temperatureK: 30000, granulation: 0, spots: 0, corona: 0.8, seed });
const SUPERGIANT = (seed: number): StarLook => ({ temperatureK: 3400, granulation: 1, spots: 0.9, corona: 0.7, seed });

// A nebula: soft overlapping clouds in its universe's colour and its opposite.
const paintNebula = (accent: string, hazard: string, seed: number) => (context: Canvas2DContext, width: number) => {
  const random = createSeededRandom(seed);
  const c = width / 2;

  context.globalCompositeOperation = "lighter";

  for (let index = 0; index < 26; index += 1) {
    const angle = random() * TAU;
    const reach = Math.sqrt(random()) * c * 0.75;
    const radius = c * (0.18 + random() * 0.35);
    const x = c + Math.cos(angle) * reach;
    const y = c + Math.sin(angle) * reach;
    const cloud = context.createRadialGradient(x, y, 0, x, y, radius);

    cloud.addColorStop(0, index % 3 === 0 ? hazard : accent);
    cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalAlpha = 0.06 + random() * 0.08;
    context.fillStyle = cloud;
    context.fillRect(0, 0, width, width);
  }

  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
};

// A wormhole's mouth: a swirl of bent light round a dark centre.
const paintSwirl = (context: Canvas2DContext, width: number) => {
  const c = width / 2;

  context.lineCap = "round";

  for (let arm = 0; arm < 4; arm += 1) {
    context.strokeStyle = "rgba(120, 200, 255, 0.7)";
    context.lineWidth = width * 0.02;
    context.beginPath();

    for (let step = 0; step <= 40; step += 1) {
      const t = step / 40;
      const angle = (arm / 4) * TAU + t * 5;
      const radius = c * (0.12 + t * 0.85);
      const x = c + Math.cos(angle) * radius;
      const y = c + Math.sin(angle) * radius;

      if (step === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.globalAlpha = 0.6;
    context.stroke();
  }

  context.globalAlpha = 1;

  const well = context.createRadialGradient(c, c, 0, c, c, c * 0.3);

  well.addColorStop(0, "rgba(0, 0, 10, 1)");
  well.addColorStop(1, "rgba(0, 0, 10, 0)");
  context.fillStyle = well;
  context.fillRect(0, 0, width, width);
};

// The strange things of a universe, drawn behind everything that moves: a nebula's clouds; a pulsar, a pinpoint
// star whose two beams sweep the sky; a magnetar in loops of field; a dying red supergiant that swells and
// flickers before it blows, then its shock front racing out and the remnant left glowing; a quasar's jet
// burning across the sky; a wormhole's two mouths; and a gamma ray burst's line of warning before it fires.
export class PhenomenaLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "phenomena";

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state } = frame;

    if (state.phase !== "universe" || !state.cosmos) {
      return;
    }

    state.cosmos.phenomena.forEach((phenomenon) => this.drawOne(frame, phenomenon));

    if (state.phenomena.burst) {
      this.drawBurstWarning(frame);
    }
  }

  private drawOne(frame: VoyageFrame, phenomenon: PhenomenonSpec): void {
    const { camera, state, now } = frame;
    const { back, globes } = this.kit;
    const context = back.context;
    const cosmos = state.cosmos;
    const x = camera.toScreenX(phenomenon.x);
    const y = camera.toScreenY(phenomenon.y);

    if (!cosmos) {
      return;
    }

    switch (phenomenon.kind) {
      case "nebula": {
        if (!camera.sees(phenomenon.x, phenomenon.y, phenomenon.radius)) {
          return;
        }

        const sprite = this.kit.cache.get(`nebula:${phenomenon.seed}`, 512, 512, paintNebula(cosmos.accent, cosmos.hazard, phenomenon.seed));
        const size = phenomenon.radius * 2 * camera.scale;

        back.blit(sprite, x, y, size, size, now * 0.00002);
        break;
      }
      case "pulsar":
      case "magnetar": {
        const isPulsar = phenomenon.kind === "pulsar";

        if (isPulsar) {
          const beam = state.phenomena.pulsarAngle;
          const reach = PULSAR_REACH * camera.scale;

          context.globalCompositeOperation = "lighter";
          [beam, beam + Math.PI].forEach((angle) => {
            const light = context.createLinearGradient(x, y, x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);

            light.addColorStop(0, "rgba(160, 220, 255, 0.5)");
            light.addColorStop(1, "rgba(160, 220, 255, 0)");
            context.fillStyle = light;
            context.beginPath();
            context.moveTo(x, y);
            context.arc(x, y, reach, angle - 0.07, angle + 0.07);
            context.closePath();
            context.fill();
          });
          context.globalCompositeOperation = "source-over";
        } else if (camera.sees(phenomenon.x, phenomenon.y, phenomenon.radius)) {
          context.strokeStyle = "rgba(190, 140, 255, 0.22)";
          context.lineWidth = 1.2;

          for (let loop = 1; loop <= 5; loop += 1) {
            const size = (phenomenon.radius * loop) / 5 * camera.scale;

            context.beginPath();
            context.ellipse(x - size * 0.5, y, size * 0.5, size * 0.28, 0, 0, TAU);
            context.ellipse(x + size * 0.5, y, size * 0.5, size * 0.28, 0, 0, TAU);
            context.stroke();
          }
        }

        if (camera.sees(phenomenon.x, phenomenon.y, 1)) {
          globes.drawStar(context, { x, y, radius: Math.max(3, 0.08 * camera.scale), look: NEUTRON_STAR(phenomenon.seed), time: now / 1000, flare: null });
        }

        break;
      }
      case "supernova": {
        const nova = state.phenomena.supernova;
        const isBlown = nova !== null && state.elapsedMs >= nova.blowsAt;

        if (nova && isBlown) {
          const shock = nova.shock * camera.scale;

          context.globalCompositeOperation = "lighter";
          context.strokeStyle = "rgba(255, 220, 180, 0.5)";
          context.lineWidth = Math.max(2, 0.4 * camera.scale);
          context.beginPath();
          context.arc(x, y, shock, 0, TAU);
          context.stroke();
          context.globalCompositeOperation = "source-over";
        }

        if (camera.sees(phenomenon.x, phenomenon.y, 3)) {
          // Before it blows, a red supergiant swelling and flickering; after, a hot white remnant.
          const left = nova ? (nova.blowsAt - state.elapsedMs) / 1000 : 60;
          const flicker = left < 15 && left > 0 ? 1 + Math.sin(now * 0.02) * 0.06 * (1 - left / 15) : 1;

          globes.drawStar(context, {
            x,
            y,
            radius: (isBlown ? 0.12 : 1.6 * flicker) * camera.scale,
            look: isBlown ? REMNANT(phenomenon.seed) : SUPERGIANT(phenomenon.seed),
            time: now / 1000,
            flare: null,
          });
        }

        break;
      }
      case "quasar": {
        const angle = Math.atan2(phenomenon.toY - phenomenon.y, phenomenon.toX - phenomenon.x);
        const reach = 200 * camera.scale;
        const width = 1.1 * camera.scale;

        context.globalCompositeOperation = "lighter";
        context.strokeStyle = "rgba(200, 160, 255, 0.16)";
        context.lineWidth = width * 2;
        context.beginPath();
        context.moveTo(x - Math.cos(angle) * reach, y - Math.sin(angle) * reach);
        context.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
        context.stroke();
        context.strokeStyle = "rgba(255, 230, 255, 0.35)";
        context.lineWidth = Math.max(1, width * 0.4);
        context.stroke();
        context.globalCompositeOperation = "source-over";
        break;
      }
      case "wormholes": {
        const swirl = this.kit.cache.get("swirl", 256, 256, paintSwirl);
        const glow = this.kit.cache.get("glow:rgba(120, 200, 255, 1)", 64, 64, paintGlow("rgba(120, 200, 255, 1)"));

        [[phenomenon.x, phenomenon.y], [phenomenon.toX, phenomenon.toY]].forEach(([mouthX, mouthY], index) => {
          if (!camera.sees(mouthX, mouthY, 1.5)) {
            return;
          }

          const size = 1.6 * camera.scale;
          const sx = camera.toScreenX(mouthX);
          const sy = camera.toScreenY(mouthY);

          context.globalCompositeOperation = "lighter";
          context.globalAlpha = 0.5;
          back.blit(glow, sx, sy, size * 1.5, size * 1.5);
          context.globalAlpha = 1;
          context.globalCompositeOperation = "source-over";
          back.blit(swirl, sx, sy, size, size, (index === 0 ? 1 : -1) * now * 0.0015);
        });
        break;
      }
      default:
        break;
    }
  }

  private drawBurstWarning({ state, camera, now }: VoyageFrame): void {
    const burst = state.phenomena.burst;

    if (!burst) {
      return;
    }

    const context = this.kit.back.context;
    const x = camera.toScreenX(burst.x);
    const y = camera.toScreenY(burst.y);
    const reach = 120 * camera.scale;
    const left = Math.max(0, (burst.firesAt - state.elapsedMs) / 1000);

    context.setLineDash([10, 8]);
    context.strokeStyle = `rgba(255, 70, 90, ${0.4 + Math.sin(now * 0.02) * 0.3 * (1 - left / 3.5)})`;
    context.lineWidth = Math.max(2, 0.7 * 2 * camera.scale);
    context.beginPath();
    context.moveTo(x - Math.cos(burst.angle) * reach, y - Math.sin(burst.angle) * reach);
    context.lineTo(x + Math.cos(burst.angle) * reach, y + Math.sin(burst.angle) * reach);
    context.stroke();
    context.setLineDash([]);
  }
}
