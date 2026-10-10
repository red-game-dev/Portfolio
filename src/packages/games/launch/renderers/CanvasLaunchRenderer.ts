import { Canvas2DContext, CanvasRenderer, SpriteCache } from "@/packages/graphics/canvas";
import { mixRgb, Rgb, shadeHex } from "@/packages/graphics/colour";
import { CanvasGlobeRenderer, EARTH_LOOK, GlobeLook, GlobeRenderer, northUp } from "@/packages/graphics/globe";
import { Air, Ground, LandscapePainter, Scene, SkyLight } from "@/packages/graphics/landscape";
import { TAU } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";
import { easeInOut, smoothstep } from "@/packages/math/easing";
import { createSeededRandom } from "@/packages/math/random";
import { formatDuration, formatNumber } from "@/packages/text/format";

import { LaunchLabels, LaunchTheme, VEHICLES } from "../config";
import { LaunchLand, LaunchMilestone, LaunchSize, LaunchState } from "../domain/types";
import { limbOf, paintAirglow, paintCloud, paintPlainEarth } from "./paint/earth";
import { paintPad } from "./paint/pad";
import { BUILDS, nozzles, paintPlume, paintVehicle, PLUMES, Stack } from "./paint/vehicles";
import { Smoke } from "./Smoke";

// Earth's air from the ground: blue by day, a pale horizon, orange at dusk, deep blue at night.
const EARTH_AIR: Air = { zenith: "#3b7bd0", horizon: "#b5d5f2", dusk: "#ff8d4d", night: "#0b1631", strength: 1, haze: 0 };
// The land round each kind of pad, and the sea behind it.
const LAND: Readonly<Record<LaunchLand, Ground>> = {
  scrub: { relief: "flat", colour: "#55703e", far: "#3c5a3c", hasRocks: false, seed: 3 },
  flats: { relief: "flat", colour: "#b9a47c", far: "#8d7d5c", hasRocks: false, seed: 5 },
  hills: { relief: "hills", colour: "#9a8a57", far: "#6c6a52", hasRocks: false, seed: 9 },
};
const SEA: Ground = { relief: "sea", colour: "#164a78", far: "#2b6b9a", hasRocks: false, seed: 1 };
// Above this height the view compresses (metres): the pad and tower at true scale, the climb to orbit on a log
// scale, so the clouds and the sky go past at a pace the eye can follow.
const TRUE_SCALE = 160;
// How the sky darkens with height as the eye sees it: still blue a few km up, deep blue by twenty, black by sixty.
const SKY_FADE_KM = 22;
const FIELD_OF_VIEW = 46;
// Earth's air is a skin a sixtieth of its radius thick at this scale, not the glowing shell a small globe wears.
const EARTH_BELOW: GlobeLook = { ...EARTH_LOOK, atmosphere: EARTH_LOOK.atmosphere ? { ...EARTH_LOOK.atmosphere, thickness: 0.012 } : undefined };
// The rocket's height on the board, and where its base sits on the pad and once the camera follows it.
const ROCKET_SHARE = 0.44;
const PAD_SHARE = 0.88;
const FOLLOW_SHARE = 0.7;
// About how many seconds the climb takes, for how fast separated stages fall away.
const CLIMB_SECONDS = 9;
// What each quality level keeps (0 the finest): the share of the smoke made, whether the clouds that pass in front
// are drawn, and whether the Earth below is the GPU's globe or a plain painted one.
const QUALITY = { smoke: [1, 0.5, 0.25], frontClouds: [true, true, false], gpuEarth: [true, true, false] };
// A cloud's sprite (units): the cloud painted `size` across round its middle, with room for its puffs.
const CLOUD = { width: 128, height: 90, x: 64, y: 44, size: 60 };

const stretch = (metres: number) => (metres < TRUE_SCALE ? metres : TRUE_SCALE * (1 + Math.log(metres / TRUE_SCALE)));

interface Cloud {
  x: number;
  altitude: number;
  size: number;
}

// Draws a real launch as a broadcast tracking camera sees it: the pad under the sky of the moment (day, dusk or a
// floodlit night), the sea or hills behind, steam boiling out of the trench as the engines light, the rocket
// climbing on its flame through the clouds while the sky darkens to black, its stages and fairing falling away at
// their moments, the vapour cone of Max Q, the glowing exhaust of a twilight launch, then the curve of the Earth
// rising below as it reaches orbit. A readout gives the mission clock, height and speed. In orbit, the button
// nobody should press counts down and blows the upper stage apart.
export class CanvasLaunchRenderer extends CanvasRenderer<LaunchState> {
  private readonly theme: LaunchTheme;
  private readonly labels: LaunchLabels;
  private readonly painter = new LandscapePainter(11);
  private readonly smoke = new Smoke();
  private readonly clouds: Cloud[];
  private globes: GlobeRenderer;
  // The real maps handed over, kept to hand on if the GPU's globe gives way to the 2D one.
  private readonly textures = new Map<string, TexImageSource>();
  private readonly cloudSprites = new SpriteCache({ width: CLOUD.width, height: CLOUD.height, scale: 1, maxEntries: 32 });
  private quality = 0;
  private lastNow = 0;

  constructor(context: Canvas2DContext, theme: LaunchTheme, labels: LaunchLabels, globes: GlobeRenderer) {
    super(context, { background: "#04060c" });
    this.theme = theme;
    this.labels = labels;
    this.globes = globes;

    const random = createSeededRandom(29);

    random();
    this.clouds = Array.from({ length: 9 }, () => ({ x: random() * 1.4 - 0.2, altitude: 1500 + random() * 1300, size: 0.22 + random() * 0.3 }));
  }

  public resize({ width, height }: LaunchSize, pixelRatio: number): void {
    this.resizeSurface(width, height, pixelRatio);
    this.globes.resize(width, height, Math.min(2, pixelRatio));
  }

  public setTexture(id: string, image: TexImageSource): void {
    this.textures.set(id, image);
    this.globes.setTexture(id, image);
  }

  // How fine to draw, 0 the finest (see `QUALITY`): stepped down on a device whose frames run slow.
  public setQuality(level: number): void {
    this.quality = Math.max(0, Math.min(QUALITY.smoke.length - 1, level));
  }

  public dispose(): void {
    this.globes.dispose();
  }

  public draw(state: LaunchState, now: number): void {
    const { width, height } = this.size;

    if (width === 0 || height === 0) {
      return;
    }

    // A still frame (now 0) moves nothing.
    const seconds = now > 0 && this.lastNow > 0 ? Math.min(0.05, (now - this.lastNow) / 1000) : 0;

    this.lastNow = now;

    const { site } = state;
    const spec = VEHICLES[site.vehicle];
    const rocketHeight = height * ROCKET_SHARE;
    const perMetre = rocketHeight / spec.heightM;
    const rocketWidth = rocketHeight * BUILDS[site.vehicle].width;
    const padY = height * PAD_SHARE;
    const altitude = state.altitudeKm * 1000;
    const camera = Math.max(0, stretch(altitude) - (padY - height * FOLLOW_SHARE) / perMetre);
    const toY = (metres: number) => padY - (stretch(metres) - camera) * perMetre;
    const groundY = toY(0);
    const density = Math.exp(-((state.altitudeKm / SKY_FADE_KM) ** 1.4));
    const scene: Scene = {
      air: EARTH_AIR,
      sun: { elevation: state.sunElevation, side: state.sunSide, radius: 0.27, colour: "#fff3d6" },
      bodies: [],
      ground: site.hasSea ? SEA : LAND[site.land],
    };
    const sky = this.painter.paint({ context: this.context, width, height, horizon: groundY - height * 0.07, fieldOfView: FIELD_OF_VIEW, drop: 0, density, now }, scene);
    const x = width / 2;
    const baseY = toY(altitude);
    const stack = this.stackAt(state);
    const shake = state.status === "destructing" ? Math.sin(now * 0.09) * (1.5 + state.destructMs / 600) : 0;
    // The floodlights carry the pad and the rocket at night, until the rocket climbs out of their reach.
    const floodlights = (1 - sky.light) * (1 - smoothstep(0.05, 0.6, state.altitudeKm));
    const rocketLight = Math.max(sky.light, floodlights * 0.85, state.status === "launching" ? 0.38 : 0.22);

    this.drawClouds(toY, sky, x, baseY, state, false);
    this.drawEarth(state, smoothstep(14, 200, state.altitudeKm), now);
    paintPad(this.context, {
      width,
      height,
      x,
      groundY,
      perMetre,
      rocketWidth,
      rocketHeight,
      towerHeight: spec.towerM * perMetre,
      vehicle: site.vehicle,
      land: site.land,
      towerSide: -site.downrange,
      light: sky.light,
      floodlights,
      armSwing: state.status === "ready" ? 0 : easeInOut(state.status === "charging" ? state.charge : 1),
    });

    this.puff(state, seconds, rocketWidth, rocketHeight, density);
    this.smoke.step(seconds);
    this.smoke.draw(this.context, x, toY, sky.light, state.status === "launching" || state.status === "charging" ? { x, y: baseY, reach: rocketHeight * 0.8 } : null);

    if (state.status === "exploding") {
      this.drawExplosion(state, x, baseY - rocketHeight * 0.35);
    } else {
      this.drawSeparated(state, x, baseY, rocketHeight, rocketLight);
      this.drawRocket(state, stack, x + shake, baseY, rocketHeight, rocketLight, density, now);
    }

    if (QUALITY.frontClouds[this.quality]) {
      this.drawClouds(toY, sky, x, baseY, state, true);
    }
    this.drawReadout(state);

    if (state.status === "destructing") {
      this.drawAlarm(state, now);
    }

    this.context.globalAlpha = 1;
  }

  // The Earth from on high, as it really looks: the GPU's globe from its real maps (continents, clouds, the glint
  // of the sea, city lights on the night side), lit from where the Sun is at that moment and turned so its real
  // longitudes lie under the light; the band of the air along its edge over it.
  private drawEarth(state: LaunchState, rise: number, now: number): void {
    if (rise <= 0) {
      return;
    }

    const { width, height } = this.size;
    const scene = { width, height, rise, sunElevation: state.sunElevation, sunSide: state.sunSide };
    const limb = limbOf(scene);

    if (!QUALITY.gpuEarth[this.quality]) {
      paintPlainEarth(this.context, scene);
      paintAirglow(this.context, scene);

      return;
    }

    // A GPU context the browser took back (a phone backgrounding the tab) leaves the Earth to the 2D globe, with
    // the maps it already had.
    if (this.globes.isGpu && !this.globes.available) {
      this.globes = new CanvasGlobeRenderer();
      this.globes.resize(width, height, Math.min(2, this.pixelRatio));
      this.textures.forEach((image, id) => this.globes.setTexture(id, image));
    }

    // The Sun's side and height, as an angle from the Earth's centre: overhead light comes from straight up, a
    // Sun below the horizon from below the edge.
    const lightAngle = -Math.PI / 2 + Math.sign(state.sunSide || 1) * ((90 - state.sunElevation) * Math.PI) / 180;

    this.globes.drawGlobe(this.context, {
      x: limb.x,
      y: limb.y,
      radius: limb.radius,
      look: EARTH_BELOW,
      pose: {
        lightAngle,
        subsolarLatitude: state.subsolarLatitude,
        subsolarLongitude: state.subsolarLongitude,
        // Seen from over the pad's latitude, so the land round it lies along the visible curve.
        viewElevation: clamp(90 - Math.abs(state.site.latitude), 15, 75),
        isTurned: northUp(lightAngle, false),
      },
      time: now / 1000,
      light: 1,
      aurora: 0,
      craters: [],
    });
    paintAirglow(this.context, scene);
  }

  // How far through the climb a moment comes for this rocket, or never.
  private momentAt(state: LaunchState, milestone: LaunchMilestone): number {
    return VEHICLES[state.site.vehicle].milestones.find(([id]) => id === milestone)?.[1] ?? Infinity;
  }

  private separationAt(state: LaunchState): number {
    return this.momentAt(state, state.site.vehicle === "steel" ? "hotStaging" : "stageSeparation");
  }

  private fairingAt(state: LaunchState): number {
    // The heavy lifter's abort tower goes shortly after its core.
    return state.site.vehicle === "booster" ? this.momentAt(state, "fairing") : state.site.vehicle === "heavy" ? this.separationAt(state) + 0.05 : Infinity;
  }

  private stackAt(state: LaunchState): Stack {
    const { ascent } = state;

    return {
      hasCore: ascent < this.separationAt(state),
      hasUpper: true,
      hasSides: state.site.vehicle === "heavy" && ascent < this.momentAt(state, "boosterSeparation"),
      hasFairing: ascent < this.fairingAt(state),
    };
  }

  // Steam boiling out of the trench as the engines light and the rocket clears the tower, the trail it leaves
  // while the air is thick, and the cold wisps venting off it while it waits fuelled on the pad.
  private puff(state: LaunchState, seconds: number, rocketWidth: number, rocketHeight: number, density: number): void {
    if (seconds <= 0) {
      return;
    }

    const random = Math.random;
    const scale = this.size.height / 220;
    const share = QUALITY.smoke[this.quality];

    const isLighting = state.status === "charging" || (state.status === "launching" && state.ascent < 0.07);

    if (isLighting) {
      const count = Math.round(seconds * 90 * share * (state.status === "charging" ? 0.4 + state.charge : 1));

      for (let puff = 0; puff < count; puff += 1) {
        const side = random() < 0.5 ? -1 : 1;

        this.smoke.emit(side * rocketWidth * (1 + random() * 2), random() * 8, side * (50 + random() * 120) * scale, 2 + random() * 9,
          (5 + random() * 6) * scale, 26 * scale, 2.6, 0.9);
      }
    }

    if (state.status === "launching" && density > 0.06 && state.ascent < this.momentAt(state, "meco")) {
      const count = Math.round(seconds * 60 * share * density + random());

      for (let puff = 0; puff < count; puff += 1) {
        this.smoke.emit((random() - 0.5) * rocketWidth, state.altitudeKm * 1000 - rocketHeight * 0.02, (random() - 0.5) * 12 * scale, 0,
          rocketWidth * 1.1, rocketWidth * 2.2, 3, state.site.vehicle === "heavy" ? 0.95 : 0.7);
      }
    }
  }

  private drawClouds(toY: (metres: number) => number, sky: SkyLight, x: number, baseY: number, state: LaunchState, isFront: boolean): void {
    const { width } = this.size;
    const day = sky.light;
    const lit: Rgb = mixRgb(mixRgb([60, 66, 82], [250, 251, 255], day), sky.glow, sky.glowStrength * 0.45);
    const isBurning = state.status === "launching";

    this.clouds.forEach((cloud, index) => {
      // Every other cloud passes in front of the rocket.
      if ((index % 2 === 1) !== isFront) {
        return;
      }

      const y = toY(cloud.altitude);
      const size = cloud.size * width;

      if (y < -size || y > this.size.height + size) {
        return;
      }

      const near = isBurning ? Math.max(0, 1 - Math.hypot(cloud.x * width - x, y - baseY) / (width * 0.5)) : 0;
      const colour = mixRgb(lit, [255, 170, 90], near * (1 - day) * 0.8);

      // Painted once per colour and blitted after.
      const alpha = isFront ? 0.75 : 0.9;
      const key = `cloud:${Math.round(colour[0] / 8)}:${Math.round(colour[1] / 8)}:${Math.round(colour[2] / 8)}:${alpha}`;
      const sprite = this.cloudSprites.get(key, (context) => paintCloud(context, CLOUD.x, CLOUD.y, CLOUD.size, colour, alpha));
      const scale = size / CLOUD.size;

      if (sprite) {
        this.context.drawImage(sprite, cloud.x * width - CLOUD.x * scale, y - CLOUD.y * scale, CLOUD.width * scale, CLOUD.height * scale);
      }
    });
  }

  // The rocket on its flame, pitched over as it climbs, with what it still carries; once a stage has gone, the
  // stack eases down so the stage still flying sits where the camera follows.
  private drawRocket(state: LaunchState, stack: Stack, x: number, baseY: number, height: number, light: number, density: number, now: number): void {
    const context = this.context;
    const { site, ascent, status } = state;
    const separation = this.separationAt(state);
    // Once the stage below has dropped clear, the stage still flying eases down its own axis to where the camera follows.
    const settle = stack.hasCore ? 0 : easeInOut((ascent - separation - 0.03) / 0.12) * height * BUILDS[site.vehicle].coreTop;
    const meco = this.momentAt(state, "meco");
    const seco = this.momentAt(state, "seco");
    const upperFrom = site.vehicle === "steel" ? separation - 0.012 : separation + 0.012;
    const plumes = PLUMES[site.vehicle];

    context.save();
    context.translate(x, baseY);
    context.rotate((state.pitch * Math.PI) / 180 * site.downrange);
    context.translate(0, settle);

    // The exhaust of a launch flown at twilight, high in sunlight over a dark Earth: a vast glowing bloom.
    const twilight = state.sunElevation < -3 && state.sunElevation > -22 ? smoothstep(50, 120, state.altitudeKm) : 0;
    const isBurning = status === "launching" && ascent < seco;

    if (twilight > 0 && isBurning) {
      const bloom = context.createRadialGradient(0, height * 0.6, 0, 0, height * 0.6, height * (0.9 + twilight * 0.8));

      bloom.addColorStop(0, `rgba(190, 220, 255, ${0.35 * twilight})`);
      bloom.addColorStop(0.5, `rgba(120, 170, 255, ${0.16 * twilight})`);
      bloom.addColorStop(1, "rgba(100, 150, 255, 0)");
      context.fillStyle = bloom;
      context.fillRect(-height * 2, -height * 0.5, height * 4, height * 3);
    }

    nozzles(site.vehicle, height, stack).forEach((nozzle) => {
      const isFiring = nozzle.part === "sides" || (nozzle.part === "core" && ascent < meco) || (nozzle.part === "upper" && ascent > upperFrom && ascent < seco);
      const isLit = (status === "charging" && nozzle.part !== "upper") || (status === "launching" && isFiring);

      if (!isLit) {
        return;
      }

      const kind = nozzle.part === "sides" ? plumes.sides ?? plumes.core : nozzle.part === "upper" ? plumes.upper : plumes.core;
      const strength = status === "charging" ? 0.3 + state.charge * 0.7 : 1;

      paintPlume(context, nozzle.x, nozzle.y, nozzle.width * strength, kind, density, now);
    });

    paintVehicle(context, site.vehicle, height, stack, light);

    // Max Q: a cone of condensation round the rocket as it punches through the sound barrier in thick air.
    const maxQ = this.momentAt(state, "maxQ");
    const cone = status === "launching" ? Math.max(0, 1 - Math.abs(ascent - maxQ) / 0.035) : 0;

    if (cone > 0) {
      const top = -height * 0.62;
      const width = height * BUILDS[site.vehicle].width;

      context.fillStyle = `rgba(240, 244, 255, ${0.45 * cone})`;
      context.beginPath();
      context.moveTo(-width * 0.8, top);
      context.quadraticCurveTo(-width * 2.6, top + height * 0.12, -width * 3.2, top + height * 0.3);
      context.lineTo(width * 3.2, top + height * 0.3);
      context.quadraticCurveTo(width * 2.6, top + height * 0.12, width * 0.8, top);
      context.closePath();
      context.fill();
    }

    context.restore();
  }

  // Stages and fairings that have gone, each falling away from where it let go: a first stage dropping back and
  // turning over to fly home, side boosters peeling outwards, the fairing's halves spinning off.
  private drawSeparated(state: LaunchState, x: number, baseY: number, height: number, light: number): void {
    const context = this.context;
    const { site, ascent, pitch } = state;
    const tilt = (pitch * Math.PI) / 180 * site.downrange;
    const fall = (since: number) => since * CLIMB_SECONDS;
    const drawPart = (since: number, dx: number, spin: number, stack: Stack) => {
      const t = fall(since);

      if (t <= 0 || t > 1.8) {
        return;
      }

      context.save();
      context.globalAlpha = 1 - t / 1.8;
      context.translate(x, baseY);
      context.rotate(tilt);
      // Falling back along the way it came, drifting aside, turning over slowly.
      context.translate(dx * t * height * 0.25, (0.3 * t + 0.85 * t * t) * height);
      context.rotate(spin * t * 0.45);
      paintVehicle(context, site.vehicle, height, stack, light);
      context.restore();
    };

    const none: Stack = { hasCore: false, hasUpper: false, hasSides: false, hasFairing: false };

    drawPart(ascent - this.separationAt(state), -0.15 * site.downrange, site.vehicle === "heavy" ? 0.4 : 1.6, { ...none, hasCore: true });

    if (site.vehicle === "heavy") {
      const sides = ascent - this.momentAt(state, "boosterSeparation");

      [-1, 1].forEach((side) => {
        const t = fall(sides);

        if (t <= 0 || t > 1.8) {
          return;
        }

        context.save();
        context.globalAlpha = 1 - t / 1.8;
        context.translate(x + side * t * height * 0.25, baseY + (0.1 * t + 0.3 * t * t) * height);
        context.rotate(tilt + side * t * 0.9);
        context.translate(-side * height * (BUILDS.heavy.width / 2 + BUILDS.heavy.sideWidth / 2), 0);
        paintVehicle(context, "heavy", height, { ...none, hasSides: true }, light);
        context.restore();
      });
    }

    const fairing = fall(ascent - this.fairingAt(state));

    if (site.vehicle === "booster" && fairing > 0 && fairing < 1.8) {
      const width = height * BUILDS.booster.width * 1.35;
      const top = -height * BUILDS.booster.upperTop;

      [-1, 1].forEach((side) => {
        context.save();
        context.globalAlpha = 1 - fairing / 1.8;
        context.translate(x + side * fairing * height * 0.35, baseY + height * 0.1 * fairing * fairing);
        context.rotate(tilt + side * fairing * 1.4);
        context.fillStyle = shadeHex("#f0f2f5", light);
        context.beginPath();
        context.moveTo(0, top);
        context.lineTo(side * width / 2, top);
        context.lineTo(side * width / 2, top - height * 0.07);
        context.quadraticCurveTo(side * width * 0.35, top - height * 0.13, 0, top - height * 0.14);
        context.closePath();
        context.fill();
        context.restore();
      });
    }
  }

  // The broadcast's readout in the corner: the mission clock (counting down while the engines light), height and
  // speed.
  private drawReadout(state: LaunchState): void {
    if (state.status === "ready") {
      return;
    }

    const { width, height } = this.size;
    const context = this.context;
    const counting = state.status === "charging";
    const lines = [
      counting ? `T- ${formatDuration(Math.ceil((1 - state.charge) * 5), { withHours: true })}` : `T+ ${formatDuration(state.missionSeconds, { withHours: true })}`,
      `${this.labels.altitude} ${formatNumber(state.altitudeKm, state.altitudeKm < 10 ? 1 : 0, true)} km`,
      `${this.labels.speed} ${formatNumber(state.speedKmh)} km/h`,
    ];
    const size = clamp(width / 30, 10, 13);

    context.textAlign = "right";
    context.textBaseline = "bottom";
    lines.forEach((line, index) => {
      const y = height - 10 - (lines.length - 1 - index) * (size + 4);

      context.font = `${index === 0 ? 700 : 500} ${index === 0 ? size + 1 : size}px Roboto, Arial, sans-serif`;
      context.fillStyle = "rgba(0, 0, 0, 0.6)";
      context.fillText(line, width - 9, y + 1);
      context.fillStyle = this.theme.readout;
      context.fillText(line, width - 10, y);
    });
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
  }

  // The whole board pulsing red, and the seconds left, big.
  private drawAlarm(state: LaunchState, now: number): void {
    const { width, height } = this.size;
    const context = this.context;

    context.globalAlpha = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(now * 0.014));
    context.fillStyle = this.theme.alarm;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.9;
    context.fillStyle = this.theme.alarm;
    context.font = `700 ${Math.round(height * 0.32)}px Roboto, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(state.countdown), width * 0.78, height * 0.42);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.globalAlpha = 1;
  }

  // A white flash, a fireball that swells and fades, the stage in pieces flying apart, and a ring of shock.
  private drawExplosion(state: LaunchState, x: number, y: number): void {
    const { width, height } = this.size;
    const context = this.context;
    const progress = state.explosion;
    const reach = Math.min(width, height);

    context.globalAlpha = Math.max(0, 1 - progress * 4);
    context.fillStyle = "#fff6df";
    context.fillRect(0, 0, width, height);

    const radius = reach * (0.08 + easeInOut(progress) * 0.35);
    const fire = context.createRadialGradient(x, y, 0, x, y, radius);

    fire.addColorStop(0, "#fff6df");
    fire.addColorStop(0.35, "#ffb03a");
    fire.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalAlpha = Math.max(0, 1 - progress);
    context.fillStyle = fire;
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();

    context.fillStyle = "#e8ecf5";
    state.debris.forEach((piece) => {
      const distance = piece.speed * reach * 0.6 * easeInOut(progress * 1.2);

      context.globalAlpha = Math.max(0, 1 - progress * 1.1);
      context.fillRect(x + Math.cos(piece.angle) * distance, y + Math.sin(piece.angle) * distance, piece.size, piece.size * 0.6);
    });

    context.strokeStyle = "#fff6df";
    context.globalAlpha = Math.max(0, 1 - progress);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, reach * progress * 0.6, 0, TAU);
    context.stroke();
    context.globalAlpha = 1;
  }
}
