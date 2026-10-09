import type { RenderLayer } from "@/packages/games/engine";
import { Rgb, rgbToHex } from "@/packages/graphics/colour";
import { blackbody, globeFrame, surfacePoint } from "@/packages/graphics/globe";
import { LandscapePainter, Scene, SkyBody } from "@/packages/graphics/landscape";

import { HOME_WORLD, SystemBody } from "../../domain/content";
import { SurfaceInfo } from "../../domain/surface";
import { markOf, tierOf } from "../../economy/config/tiers";
import { airFor, groundAt, phaseOf, skyPlace, solarHours, toGround } from "../../utils/surface";
import { VoyageFrame } from "../frame";
import { paintHull } from "../paint/ships";
import { paintFlame, SHIP_HEIGHT, SHIP_WIDTH } from "../paint/space";
import { GlobesLayer } from "./GlobesLayer";
import { RenderKit } from "./kit";

const DEG = 180 / Math.PI;
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
// How long the dust of a touchdown hangs (ms).
const DUST_MS = 1400;

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
    const ground = state.phase !== "lost" && ship?.landedOn ? state.system.bodies.find((candidate) => candidate.id === ship.landedOn) : undefined;

    const up = ship?.landedOffset ? Math.atan2(ship.landedOffset.y, ship.landedOffset.x) : 0;

    // A new world, or another spot on the same one.
    if (ground && ship?.landedOffset && (ground.id !== this.body || Math.abs(Math.atan2(Math.sin(up - this.up), Math.cos(up - this.up))) > 0.01)) {
      this.land(frame, ground, up);
    }

    this.shown = Math.max(0, Math.min(1, this.shown + (ground ? 1 : -1) * (dt / FADE_SECONDS)));

    // A still frame (a photo, the map over a held run) shows the ground at once if the ship is on it.
    if (dt === 0 && ground) {
      this.shown = 1;
    }

    if (!ground && this.shown === 0) {
      this.body = null;
      this.info = null;
      this.scene = null;

      return;
    }

    const scene = this.scene;
    const place = state.system.bodies.find((candidate) => candidate.id === this.body);

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
    const latitude = point.latitude * DEG;
    const longitude = ((((point.longitude * DEG + 180) % 360) + 360) % 360) - 180;
    const map = look?.surface.map;
    const sample = map ? this.sample(map, longitude, latitude, look?.surface.centreLongitude ?? 0) : null;
    const preset = groundAt(place.id, look, sample, latitude, longitude, isHome);

    this.body = place.id;
    this.up = up;
    this.landedAt = state.elapsedMs;
    this.scene = { air: airFor(place.id, look, place.air?.pressureBar ?? null, isHome), sun: null, bodies: [], ground: toGround(preset, latitude, longitude) };
    this.info = { body: place.id, isHome: isHome && place.id === HOME_WORLD, latitude, longitude, hours: 12, biome: preset.biome };
  }

  // The star, and the planet or moons in the sky, where they stand now: they move as the world goes round.
  private placeSky({ state, theme }: VoyageFrame, scene: Scene, place: SystemBody): void {
    const { star, bodies } = state.system;
    const isHome = !state.cosmos;
    const towardsStar = Math.atan2(star.y - place.y, star.x - place.x);
    const distance = Math.hypot(star.x - place.x, star.y - place.y) || 1;
    const sunPlace = skyPlace(this.up, towardsStar);
    const starLook = state.cosmos?.starLook;

    scene.sun = star.luminosity <= 0 ? null : {
      ...sunPlace,
      radius: isHome ? Math.asin(Math.min(1, SUN_KM / (Math.max(place.au, 0.01) * KM_PER_AU))) * DEG : Math.max(0.05, Math.atan(star.radius / distance) * DEG * 0.35),
      colour: starLook ? this.starColour(starLook.temperatureK) : "#fff3d6",
    };

    const neighbours = bodies.filter((other) => !other.isShattered && (other.id === place.parent || other.parent === place.id));

    scene.bodies = neighbours.map((other): SkyBody => {
      const towards = Math.atan2(other.y - place.y, other.x - place.x);
      const orbit = other.id === place.parent ? place.orbit : other.orbit;
      const kilometres = orbit.kind === "moon" ? orbit.distanceKm : Math.hypot(other.x - place.x, other.y - place.y) * place.kmPerUnit;
      const look = theme.bodies[other.id] ?? state.cosmos?.looks[other.id];

      return {
        ...skyPlace(this.up, towards),
        ...phaseOf(towards, towardsStar),
        radius: Math.asin(Math.min(1, (other.radius * other.kmPerUnit) / Math.max(kilometres, 1))) * DEG,
        colour: look?.surface.palette[2] ?? "#c8c8c8",
        hasRings: Boolean(look?.rings),
      };
    });

    if (this.info) {
      this.info.hours = solarHours(this.up, towardsStar);
    }
  }

  // A crew capsule down on Earth: a blunt cone, its heat shield charred from the way in and its sides streaked,
  // two windows and the hatch on top. At sea it rides the swell in its orange flotation collar, the water over its
  // lower edge; on land its parachutes lie spread beside it, their lines running back to it.
  private drawCapsule(x: number, groundY: number, tall: number, light: number, now: number, isSea: boolean): void {
    const context = this.kit.front.context;
    const base = tall * 0.78;
    const top = base * 0.42;
    const high = tall * 0.6;
    const bob = isSea ? Math.sin(now * 0.0025) * tall * 0.025 : 0;
    const tilt = isSea ? Math.sin(now * 0.0017) * 0.06 : 0;
    const shade = (value: number) => Math.round(value * (0.25 + 0.75 * light));

    if (!isSea) {
      // The parachutes, spread on the ground off to one side, striped orange and white.
      [-1, 0.2, 1].forEach((offset, index) => {
        const cx = x + base * (1.35 + index * 0.55) * (offset < 0 ? -1 : 1);
        const cy = groundY + tall * (0.04 + index * 0.03);

        context.strokeStyle = `rgba(${shade(230)}, ${shade(230)}, ${shade(230)}, 0.5)`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, groundY - high);
        context.lineTo(cx, cy - tall * 0.04);
        context.stroke();
        // A canopy lying in a soft heap, in orange and white gores.
        for (let gore = 0; gore < 6; gore += 1) {
          const from = Math.PI + (gore / 6) * Math.PI;

          context.fillStyle = (gore + index) % 2 === 0 ? `rgb(${shade(240)}, ${shade(112)}, ${shade(40)})` : `rgb(${shade(242)}, ${shade(240)}, ${shade(234)})`;
          context.beginPath();
          context.moveTo(cx, cy);
          context.ellipse(cx, cy, base * 0.55, tall * 0.075, 0, from, from + Math.PI / 6);
          context.closePath();
          context.fill();
        }
      });
    }

    context.save();
    context.translate(x, groundY + bob);
    context.rotate(tilt);

    // Curved sides lit from the sun's side, dark on the other, as a cone of metal is under one light.
    const lit = this.scene?.sun ? Math.sign(this.scene.sun.side) || 1 : 1;
    const body = context.createLinearGradient(-base / 2 * lit, 0, base / 2 * lit, 0);

    body.addColorStop(0, `rgb(${shade(120)}, ${shade(124)}, ${shade(132)})`);
    body.addColorStop(0.45, `rgb(${shade(214)}, ${shade(218)}, ${shade(224)})`);
    body.addColorStop(0.7, `rgb(${shade(236)}, ${shade(238)}, ${shade(242)})`);
    body.addColorStop(1, `rgb(${shade(150)}, ${shade(154)}, ${shade(162)})`);
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

    soot.addColorStop(0, `rgba(${shade(70)}, ${shade(52)}, ${shade(38)}, 0.85)`);
    soot.addColorStop(0.35, "rgba(60, 45, 35, 0.25)");
    soot.addColorStop(1, "rgba(60, 45, 35, 0)");
    context.fillStyle = soot;
    context.fill();
    // The heat shield, charred black brown and a little proud of the sides; the docking ring on top.
    context.fillStyle = `rgb(${shade(50)}, ${shade(36)}, ${shade(28)})`;
    context.beginPath();
    context.ellipse(0, -high * 0.02, base * 0.53, high * 0.08, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = `rgb(${shade(140)}, ${shade(144)}, ${shade(152)})`;
    context.beginPath();
    context.ellipse(0, -high - tall * 0.02, top * 0.32, tall * 0.025, 0, 0, Math.PI * 2);
    context.fill();
    // Two windows, catching the sky.
    context.fillStyle = "rgba(24, 34, 54, 0.92)";
    [-1, 1].forEach((side) => {
      context.beginPath();
      context.ellipse(side * base * 0.15, -high * 0.58, base * 0.045, high * 0.065, side * 0.25, 0, Math.PI * 2);
      context.fill();
    });

    if (isSea) {
      // The flotation collar and the sea washing over the capsule's lower edge.
      context.fillStyle = `rgb(${shade(240)}, ${shade(120)}, ${shade(30)})`;
      context.beginPath();
      context.ellipse(0, -high * 0.08, base * 0.62, tall * 0.05, 0, 0, Math.PI * 2);
      context.fill();
      // The sea round its base: a rippled waterline in the colour of the surface near by, the capsule's lower edge
      // showing through it.
      context.fillStyle = this.scene ? this.scene.ground.far : "#2b6b9a";
      context.globalAlpha *= 0.7;
      context.beginPath();
      context.moveTo(-base * 0.78, 0);

      for (let step = 0; step <= 12; step += 1) {
        const across = -base * 0.78 + (step / 12) * base * 1.56;

        context.lineTo(across, -high * 0.06 + Math.sin(now * 0.004 + step * 1.3) * high * 0.025);
      }

      context.lineTo(base * 0.78, high * 0.1);
      context.ellipse(0, high * 0.1, base * 0.78, high * 0.05, 0, 0, Math.PI);
      context.closePath();
      context.fill();
    }

    context.restore();
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
    const x = width / 2;
    const y = groundY - lift;
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

    context.globalAlpha = alpha * (isLeaving ? Math.max(0, 1 - lift / (height * 0.3)) : 1) * 0.45;
    context.fillStyle = "#000000";
    context.beginPath();
    context.ellipse(x - sunSide * wide * 0.4, groundY + 2, wide * 0.8, wide * 0.16, 0, 0, Math.PI * 2);
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
      this.drawCapsule(x, groundY, tall, light, now, this.scene?.ground.relief === "sea");
      context.globalAlpha = 1;

      return;
    }

    if (isLeaving) {
      const flame = this.kit.sprite(`flame:${theme.flameCore}:${size}`, size * 1.1, size * 2.8, paintFlame(theme.flameCore, theme.flameEdge));

      if (flame) {
        context.drawImage(flame.surface, x - wide * 0.22, y - tall * 0.05, wide * 0.44, tall * (0.8 + Math.sin(now * 0.05) * 0.1));
      }
    } else {
      // Landing legs braced out to the ground.
      context.strokeStyle = "#3a3f4a";
      context.lineWidth = Math.max(1.5, wide * 0.05);
      context.beginPath();
      context.moveTo(x - wide * 0.22, y - tall * 0.25);
      context.lineTo(x - wide * 0.48, y);
      context.moveTo(x + wide * 0.22, y - tall * 0.25);
      context.lineTo(x + wide * 0.48, y);
      context.stroke();
    }

    if (sprite) {
      context.drawImage(sprite.surface, x - wide / 2, y - tall * 0.98, wide, tall);
    }

    // The touchdown's dust, settling.
    const since = state.elapsedMs - this.landedAt;

    if (!isLeaving && since < DUST_MS && this.scene) {
      const progress = since / DUST_MS;

      context.globalAlpha = alpha * (1 - progress) * 0.5;
      context.fillStyle = this.scene.ground.colour;
      [-1, 1].forEach((side) => {
        context.beginPath();
        context.ellipse(x + side * wide * (0.6 + progress * 1.6), groundY - tall * 0.05, wide * (0.4 + progress), tall * (0.1 + progress * 0.15), 0, 0, Math.PI * 2);
        context.fill();
      });
    }

    context.globalAlpha = 1;
  }
}
