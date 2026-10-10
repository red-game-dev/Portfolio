import type { RenderLayer } from "@/packages/games/engine";
import { Rgb, rgbToHex, shadeHex } from "@/packages/graphics/colour";
import { blackbody, globeFrame, surfacePoint } from "@/packages/graphics/globe";
import { LandscapePainter, Scene, SkyBody } from "@/packages/graphics/landscape";
import { angleBetween, RAD, TAU } from "@/packages/math/angles";
import { clamp01, wrap } from "@/packages/math/clamp";
import { smoothstep } from "@/packages/math/easing";

import { HOME_WORLD, SystemBody } from "../../domain/content";
import { SurfaceInfo } from "../../domain/surface";
import { markOf, tierOf } from "../../economy/config/tiers";
import { airFor, elevationOf, groundAt, phaseOf, sideOf, solarHours, toGround } from "../../utils/surface";
import { VoyageFrame } from "../frame";
import { paintHull } from "../paint/ships";
import { paintFlame, SHIP_HEIGHT, SHIP_WIDTH } from "../paint/space";
import { GlobesLayer } from "./GlobesLayer";
import { RenderKit } from "./kit";

// The Sun's radius (km), and the km in an AU, for how large it stands in a sky of ours.
const SUN_KM = 696000;
const KM_PER_AU = 149597870.7;
// How long the view takes to come in on landing and go on take off (s).
const FADE_SECONDS = 0.7;
// Where the horizon sits, how much sky the view spans (degrees), and how tall the ship stands, as shares of the
// screen.
const HORIZON_SHARE = 0.62;
const FIELD_OF_VIEW = 70;
const SHIP_SHARE = 0.15;
// How long the dust of a touchdown hangs, how long the descent to it takes, and how long a splash's spray hangs (ms).
const DUST_MS = 1400;
const DESCENT_MS = 2800;
const SPLASH_MS = 1100;

// Reads the colour of a world's map at a spot (degrees), or null when there is no map yet.
export type MapSampler = (texture: string, longitude: number, latitude: number, centreLongitude: number) => Rgb | null;

// Standing on a world: once the ship sets down, the view comes down to its surface at the very spot it landed,
// read from the globe as it is drawn so the place is the one under the ship: the ground in the colour of the map
// there (Earth's sea, ice, desert, forest or grassland, the grey of the Moon, the rust of Mars), the world's own
// sky with its star where it stands at that spot and that moment (night on the night side), its planet hanging
// in the sky over a moon, its moons over a planet, all as large as they really look. The ship stands on its legs
// in the settling dust, its lights on by night. On take off it lifts out of the view on its flame as the view
// gives way to space again.
export class SurfaceLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "surface";
  public info: SurfaceInfo | null = null;
  private readonly painter = new LandscapePainter(17);
  private scene: Scene | null = null;
  private body: string | null = null;
  // The world stood on, and what hangs in its sky (its planet, or its moons) with how far each really is.
  private place: SystemBody | null = null;
  private neighbours: Array<{ body: SystemBody; sky: SkyBody }> = [];
  // The world angle straight up from the spot.
  private up = 0;
  private shown = 0;
  private landedAt = 0;
  private hull: { key: string; paint: ReturnType<typeof paintHull> } | null = null;

  constructor(private readonly kit: RenderKit, private readonly globes: GlobesLayer, private readonly sample: MapSampler) {}

  // Fully over the view, so nothing under it needs drawing.
  public get isCovering(): boolean {
    return this.shown >= 1;
  }

  public get isShown(): boolean {
    return this.shown > 0;
  }

  public draw(frame: VoyageFrame): void {
    const { state, world, dt, now } = frame;
    const ship = world.stores.ship.get(state.ship);
    const landedOn = state.phase !== "lost" ? ship?.landedOn ?? null : null;
    // The world already stood on is kept, so a frame only looks one up when the ship sets down somewhere new.
    const ground = landedOn === null ? undefined : landedOn === this.place?.id ? this.place : state.system.bodies.find((candidate) => candidate.id === landedOn);

    const up = ship?.landedOffset ? Math.atan2(ship.landedOffset.y, ship.landedOffset.x) : 0;

    // A new world, or another spot on the same one.
    if (ground && ship?.landedOffset && (ground.id !== this.body || Math.abs(angleBetween(this.up, up)) > 0.01)) {
      this.land(frame, ground, up);
    }

    this.shown = clamp01(this.shown + (ground ? 1 : -1) * (dt / FADE_SECONDS));

    // A still frame (a photo, the map over a held run) shows the ground at once if the ship is on it.
    if (dt === 0 && ground) {
      this.shown = 1;
    }

    if (!ground && this.shown === 0) {
      this.body = null;
      this.place = null;
      this.neighbours = [];
      this.info = null;
      this.scene = null;

      return;
    }

    const { scene, place } = this;

    if (!scene || !place) {
      return;
    }

    this.placeSky(frame, scene, place);

    const { front } = this.kit;
    const { width, height } = front;
    const horizon = height * HORIZON_SHARE;
    const view = { context: front.context, width, height, horizon, fieldOfView: FIELD_OF_VIEW, drop: 0, density: 1, now, opacity: this.shown, isWholeSky: true };
    const sky = this.painter.paint(view, scene);

    this.drawShip(frame, horizon, sky.light, !ground);
    front.context.globalAlpha = 1;
  }

  // Where the ship set down: the spot on the globe under it, the ground there, the world's sky.
  private land({ state, theme }: VoyageFrame, place: SystemBody, up: number): void {
    const isHome = !state.cosmos;
    const look = theme.bodies[place.id] ?? state.cosmos?.looks[place.id];
    const frame = globeFrame(this.globes.poseOf(state, place));
    const offset = up - frame.angle;
    const point = surfacePoint(frame, [Math.cos(offset), -Math.sin(offset), 0]);
    const latitude = point.latitude * RAD;
    const longitude = wrap(point.longitude * RAD + 180, 360) - 180;
    const map = look?.surface.map;
    const sample = map ? this.sample(map, longitude, latitude, look?.surface.centreLongitude ?? 0) : null;
    const preset = groundAt(place.id, look, sample, latitude, longitude, isHome);

    const { star, bodies } = state.system;
    const starLook = state.cosmos?.starLook;
    const toStar = Math.hypot(star.x - place.x, star.y - place.y) || 1;

    this.body = place.id;
    this.place = place;
    this.up = up;
    this.landedAt = state.elapsedMs;
    // Its planet over a moon, its moons over a planet, each as large as it really looks from here.
    this.neighbours = bodies.filter((other) => !other.isShattered && (other.id === place.parent || other.parent === place.id)).map((other) => {
      const orbit = other.id === place.parent ? place.orbit : other.orbit;
      const kilometres = orbit.kind === "moon" ? orbit.distanceKm : Math.hypot(other.x - place.x, other.y - place.y) * place.kmPerUnit;
      const otherLook = theme.bodies[other.id] ?? state.cosmos?.looks[other.id];

      return {
        body: other,
        sky: {
          elevation: 0,
          side: 0,
          lit: 1,
          lightSide: 1,
          radius: Math.asin(Math.min(1, (other.radius * other.kmPerUnit) / Math.max(kilometres, 1))) * RAD,
          colour: otherLook?.surface.palette[2] ?? "#c8c8c8",
          hasRings: Boolean(otherLook?.rings),
        },
      };
    });
    this.scene = {
      air: airFor(place.id, look, place.air?.pressureBar ?? null, isHome),
      sun: star.luminosity <= 0 ? null : {
        elevation: 0,
        side: 0,
        radius: isHome ? Math.asin(Math.min(1, SUN_KM / (Math.max(place.au, 0.01) * KM_PER_AU))) * RAD : Math.max(0.05, Math.atan(star.radius / toStar) * RAD * 0.35),
        colour: starLook ? this.starColour(starLook.temperatureK) : "#fff3d6",
      },
      bodies: this.neighbours.map(({ sky }) => sky),
      ground: toGround(preset, latitude, longitude),
    };
    this.info = {
      body: place.id, name: state.cosmos?.names[place.id] ?? null, isHome: isHome && place.id === HOME_WORLD, latitude, longitude, hours: 12, biome: preset.biome,
    };
  }

  // The star, and the planet or moons in the sky, where they stand now, as the world goes round: the scene's own
  // objects moved in place, so a frame makes none.
  private placeSky({ state }: VoyageFrame, scene: Scene, place: SystemBody): void {
    const { star } = state.system;
    const towardsStar = Math.atan2(star.y - place.y, star.x - place.x);

    if (scene.sun) {
      scene.sun.elevation = elevationOf(this.up, towardsStar);
      scene.sun.side = sideOf(this.up, towardsStar);
    }

    this.neighbours.forEach(({ body, sky }) => {
      const towards = Math.atan2(body.y - place.y, body.x - place.x);
      const phase = phaseOf(towards, towardsStar);

      sky.elevation = elevationOf(this.up, towards);
      sky.side = sideOf(this.up, towards);
      sky.lit = phase.lit;
      sky.lightSide = phase.lightSide;
    });

    if (this.info) {
      this.info.hours = solarHours(this.up, towardsStar);
    }
  }

  // A crew capsule coming home to Earth: a blunt cone, its heat shield charred from the way in and its sides
  // streaked, two windows and the hatch on top. On the way down it swings under its three main parachutes; on land
  // its soft landing rockets flash just before touchdown and the canopies settle beside it, their lines running
  // back to it; at sea it splashes down and rides the swell in its orange flotation collar. `altitude` is how far
  // above the ground it still is (pixels) and `touchdownMs` how long since it came down (negative before).
  private drawCapsule(x: number, groundY: number, tall: number, light: number, now: number, isSea: boolean, altitude = 0, touchdownMs = DUST_MS): void {
    const context = this.kit.front.context;
    const base = tall * 0.78;
    const top = base * 0.42;
    const high = tall * 0.6;
    const isDown = altitude <= 0.5;
    const baseY = groundY - altitude;
    const swing = isDown ? 0 : Math.sin(now * 0.0021) * 0.05;
    const bob = isSea && isDown ? Math.sin(now * 0.0025) * tall * 0.025 : 0;
    const tilt = isSea && isDown ? Math.sin(now * 0.0017) * 0.06 : swing;
    // Never darker than a quarter lit, so the capsule still reads at night.
    const ambient = 0.25 + 0.75 * light;

    if (!isDown) {
      // Three main parachutes open overhead, swaying, in orange and white gores.
      [-1, 0, 1].forEach((offset, index) => {
        const cx = x + offset * base * 0.8 + Math.sin(now * 0.0019 + index) * base * 0.06;
        const cy = baseY - high - tall * (1.35 + Math.abs(offset) * 0.12);
        const rx = base * 0.62;
        const ry = tall * 0.34;

        context.strokeStyle = shadeHex("#e6e6e6", ambient, 0.55);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(cx - rx, cy);
        context.lineTo(x, baseY - high);
        context.moveTo(cx + rx, cy);
        context.lineTo(x, baseY - high);
        context.stroke();

        for (let gore = 0; gore < 8; gore += 1) {
          const from = Math.PI + (gore / 8) * Math.PI;

          context.fillStyle = shadeHex((gore + index) % 2 === 0 ? "#f07028" : "#f2f0ea", ambient);
          context.beginPath();
          context.moveTo(cx, cy);
          context.ellipse(cx, cy, rx, ry, 0, from, from + Math.PI / 8);
          context.closePath();
          context.fill();
        }
      });
    }

    if (!isSea && isDown) {
      // The parachutes, spread on the ground off to one side, striped orange and white.
      [-1, 0.2, 1].forEach((offset, index) => {
        const cx = x + base * (1.35 + index * 0.55) * (offset < 0 ? -1 : 1);
        const cy = groundY + tall * (0.04 + index * 0.03);

        context.strokeStyle = shadeHex("#e6e6e6", ambient, 0.5);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, groundY - high);
        context.lineTo(cx, cy - tall * 0.04);
        context.stroke();
        // A canopy lying in a soft heap, in orange and white gores.
        for (let gore = 0; gore < 6; gore += 1) {
          const from = Math.PI + (gore / 6) * Math.PI;

          context.fillStyle = shadeHex((gore + index) % 2 === 0 ? "#f07028" : "#f2f0ea", ambient);
          context.beginPath();
          context.moveTo(cx, cy);
          context.ellipse(cx, cy, base * 0.55, tall * 0.075, 0, from, from + Math.PI / 6);
          context.closePath();
          context.fill();
        }
      });
    }

    context.save();
    context.translate(x, baseY + bob);
    context.rotate(tilt);

    // Curved sides lit from the sun's side, dark on the other, as a cone of metal is under one light.
    const lit = this.scene?.sun ? Math.sign(this.scene.sun.side) || 1 : 1;
    const body = context.createLinearGradient(-base / 2 * lit, 0, base / 2 * lit, 0);

    body.addColorStop(0, shadeHex("#787c84", ambient));
    body.addColorStop(0.45, shadeHex("#d6dae0", ambient));
    body.addColorStop(0.7, shadeHex("#eceef2", ambient));
    body.addColorStop(1, shadeHex("#969aa2", ambient));
    context.fillStyle = body;
    context.beginPath();
    context.moveTo(-base / 2, 0);
    context.quadraticCurveTo(-base * 0.44, -high * 0.55, -top / 2, -high);
    context.quadraticCurveTo(0, -high - tall * 0.05, top / 2, -high);
    context.quadraticCurveTo(base * 0.44, -high * 0.55, base / 2, 0);
    context.closePath();
    context.fill();
    // Streaks of soot up from the shield, from the way in.
    const soot = context.createLinearGradient(0, 0, 0, -high);

    soot.addColorStop(0, shadeHex("#463426", ambient, 0.85));
    soot.addColorStop(0.35, "rgba(60, 45, 35, 0.25)");
    soot.addColorStop(1, "rgba(60, 45, 35, 0)");
    context.fillStyle = soot;
    context.fill();
    // The heat shield, charred black brown and a little proud of the sides; the docking ring on top.
    context.fillStyle = shadeHex("#32241c", ambient);
    context.beginPath();
    context.ellipse(0, -high * 0.02, base * 0.53, high * 0.08, 0, 0, TAU);
    context.fill();
    context.fillStyle = shadeHex("#8c9098", ambient);
    context.beginPath();
    context.ellipse(0, -high - tall * 0.02, top * 0.32, tall * 0.025, 0, 0, TAU);
    context.fill();
    // Two windows, catching the sky.
    context.fillStyle = "rgba(24, 34, 54, 0.92)";
    [-1, 1].forEach((side) => {
      context.beginPath();
      context.ellipse(side * base * 0.15, -high * 0.58, base * 0.045, high * 0.065, side * 0.25, 0, TAU);
      context.fill();
    });

    if (isSea && isDown) {
      // The flotation collar and the sea washing over the capsule's lower edge.
      context.fillStyle = shadeHex("#f0781e", ambient);
      context.beginPath();
      context.ellipse(0, -high * 0.08, base * 0.62, tall * 0.05, 0, 0, TAU);
      context.fill();
      // The sea round its base: an even ring of water in the colour of the surface near by, over the capsule's lower
      // edge, with a pale ripple at the waterline.
      context.fillStyle = this.scene ? this.scene.ground.far : "#2b6b9a";
      context.globalAlpha *= 0.75;
      context.beginPath();
      context.ellipse(0, -high * 0.01, base * 0.82, high * 0.09, 0, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(235, 245, 255, 0.55)";
      context.lineWidth = Math.max(1, tall * 0.012);
      context.beginPath();
      context.ellipse(0, -high * 0.04, base * (0.7 + Math.sin(now * 0.004) * 0.04), high * 0.06, 0, Math.PI, TAU);
      context.stroke();
    }

    context.restore();

    // On land the soft landing rockets fire a moment before touchdown, kicking up the ground.
    if (!isSea && !isDown && altitude < tall * 0.5) {
      const flash = context.createRadialGradient(x, groundY, 0, x, groundY, base * 1.1);

      flash.addColorStop(0, "rgba(255, 236, 190, 0.95)");
      flash.addColorStop(0.4, "rgba(255, 150, 60, 0.6)");
      flash.addColorStop(1, "rgba(255, 120, 40, 0)");
      context.fillStyle = flash;
      context.fillRect(x - base * 1.1, baseY - base * 0.4, base * 2.2, groundY - baseY + base * 0.6);
    }

    // At sea the splash: spray thrown up round it, falling back.
    if (isSea && touchdownMs >= 0 && touchdownMs < SPLASH_MS) {
      const spray = touchdownMs / SPLASH_MS;

      context.fillStyle = `rgba(240, 248, 255, ${(0.75 * (1 - spray)).toFixed(3)})`;
      [-1, -0.45, 0.45, 1].forEach((side, index) => {
        const reach = base * (0.5 + spray * (0.8 + index * 0.1));
        const rise = Math.sin(spray * Math.PI) * tall * (0.35 + (index % 2) * 0.15);

        context.beginPath();
        context.ellipse(x + side * reach, groundY - rise, base * 0.16 * (1 - spray * 0.4), tall * 0.07, 0, 0, TAU);
        context.fill();
      });
    }
  }

  private starColour(kelvin: number): string {
    const [red, green, blue] = blackbody(kelvin);

    return rgbToHex([red * 255, green * 255, blue * 255]);
  }

  // The ship on its legs, its shadow away from the sun, the dust of the touchdown settling, its lights on by night;
  // on take off, lifting away on its flame.
  private drawShip({ state, theme, universe, now }: VoyageFrame, horizon: number, light: number, isLeaving: boolean): void {
    const { front } = this.kit;
    const context = front.context;
    const { width, height } = front;
    const tall = height * SHIP_SHARE;
    const wide = tall * (SHIP_WIDTH / SHIP_HEIGHT);
    const groundY = horizon + height * 0.07;
    const lift = isLeaving ? (1 - this.shown) ** 2 * height * 0.8 : 0;
    // The descent: coming down from high in the view, fast at first and slowing to touchdown.
    const since = state.elapsedMs - this.landedAt;
    const descent = isLeaving ? 1 : clamp01(since / DESCENT_MS);
    const altitude = (1 - descent) ** 2 * height * 0.6;
    const touchdownMs = since - DESCENT_MS;
    const x = width / 2;
    const y = groundY - lift - altitude;
    const sunSide = this.scene?.sun ? Math.sign(this.scene.sun.side) || 1 : 1;
    const tier = tierOf(state.level);
    const mark = markOf(state.level);
    const accent = universe?.accent ?? theme.danger;
    const key = `${tier}:${mark}:${accent}`;

    if (this.hull?.key !== key) {
      this.hull = { key, paint: paintHull(tier, mark, { ...theme, accent }) };
    }

    const size = Math.max(16, Math.round(wide / SHIP_WIDTH));
    const sprite = this.kit.sprite(`ship:${tier}:${mark}:${accent}:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, this.hull.paint);
    const alpha = this.shown;

    // Its shadow, sharper and darker as it comes down to meet it.
    const nearness = 1 - Math.min(1, (lift + altitude) / (height * 0.4));

    context.globalAlpha = alpha * nearness * 0.45;
    context.fillStyle = "#000000";
    context.beginPath();
    context.ellipse(x - sunSide * wide * 0.4, groundY + 2, wide * (0.5 + 0.3 * nearness), wide * 0.16, 0, 0, TAU);
    context.fill();

    // Lights on the ground in front of it once it is dark.
    if (light < 0.45 && !isLeaving) {
      const pool = context.createRadialGradient(x, groundY + tall * 0.15, 0, x, groundY + tall * 0.15, tall * 1.4);

      pool.addColorStop(0, `rgba(255, 240, 210, ${(0.45 - light) * 0.9})`);
      pool.addColorStop(1, "rgba(255, 240, 210, 0)");
      context.globalAlpha = alpha;
      context.fillStyle = pool;
      context.fillRect(x - tall * 1.4, groundY - tall * 0.2, tall * 2.8, tall * 1.2);
    }

    context.globalAlpha = alpha;

    // Home: the capsule that brought the crew down, not the ship; a new rocket lifts off in its place.
    if (this.info?.isHome && !isLeaving) {
      this.drawCapsule(x, groundY, tall, light, now, this.scene?.ground.relief === "sea", altitude, touchdownMs);
      context.globalAlpha = 1;

      return;
    }

    const isBurning = isLeaving || descent < 1;

    if (isBurning) {
      // Lifting off, or the landing burn: throttled up hardest just before touchdown.
      const flame = this.kit.sprite(`flame:${theme.flameCore}:${size}`, size * 1.1, size * 2.8, paintFlame(theme.flameCore, theme.flameEdge));
      const thrust = isLeaving ? 1 : 0.55 + 0.45 * descent;
      // From the nozzle, and no further than the ground: what reaches it spreads out along it as a glow.
      const nozzle = y - tall * 0.2;
      const length = Math.min(tall * thrust * (0.8 + Math.sin(now * 0.05) * 0.1), Math.max(0, groundY - nozzle));

      if (flame) {
        context.drawImage(flame.surface, x - wide * 0.22, nozzle, wide * 0.44, length);
      }

      if (!isLeaving && groundY - nozzle < tall * thrust) {
        const spread = context.createRadialGradient(x, groundY, 0, x, groundY, wide * 1.6);

        spread.addColorStop(0, "rgba(255, 220, 160, 0.7)");
        spread.addColorStop(1, "rgba(255, 160, 80, 0)");
        context.fillStyle = spread;
        context.fillRect(x - wide * 1.6, groundY - wide * 0.5, wide * 3.2, wide);
      }
    }

    if (!isLeaving) {
      // Landing legs, swinging out from the hull as the ground comes up, braced on it at touchdown.
      const out = smoothstep(0.35, 0.8, descent);

      context.strokeStyle = "#3a3f4a";
      context.lineWidth = Math.max(1.5, wide * 0.05);
      context.beginPath();
      [-1, 1].forEach((side) => {
        context.moveTo(x + side * wide * 0.22, y - tall * 0.25);
        context.lineTo(x + side * wide * (0.26 + 0.22 * out), y - tall * 0.12 * (1 - out));
      });
      context.stroke();
    }

    if (sprite) {
      context.drawImage(sprite.surface, x - wide / 2, y - tall * 0.98, wide, tall);
    }

    // The dust: kicked up by the landing burn as the ground comes near, then settling after touchdown.
    const blast = isLeaving ? 0 : clamp01((descent - 0.7) / 0.3);
    const settling = touchdownMs > 0 ? touchdownMs / DUST_MS : 0;

    if (!isLeaving && blast > 0 && settling < 1 && this.scene) {
      const progress = touchdownMs > 0 ? settling : (blast - 1) * 0.3;

      context.globalAlpha = alpha * blast * (1 - Math.max(0, progress)) * 0.5;
      context.fillStyle = this.scene.ground.colour;
      [-1, 1].forEach((side) => {
        context.beginPath();
        context.ellipse(x + side * wide * (0.6 + progress * 1.6), groundY - tall * 0.05, wide * (0.4 + progress), tall * (0.1 + progress * 0.15), 0, 0, TAU);
        context.fill();
      });
    }

    context.globalAlpha = 1;
  }
}
