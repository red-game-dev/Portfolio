import type { RenderLayer } from "@/packages/games/engine";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb, rgbToHex, shadeHex } from "@/packages/graphics/colour";
import { blackbody, globeFrame, surfacePoint } from "@/packages/graphics/globe";
import { LandscapePainter, Scene, SkyBody } from "@/packages/graphics/landscape";
import { angleBetween, RAD, TAU } from "@/packages/math/angles";
import { clamp01, wrap } from "@/packages/math/clamp";
import { smoothstep } from "@/packages/math/easing";

import { HOME_WORLD, SystemBody } from "../../domain/content";
import { Descent } from "../../domain/state";
import { SurfaceInfo } from "../../domain/surface";
import { markOf, tierOf } from "../../economy/config/tiers";
import { densityAt, DescentState } from "../../landing";
import { airFor, elevationOf, groundAt, phaseOf, sideOf, solarHours, toGround } from "../../utils/surface";
import { VoyageFrame } from "../frame";
import {
  AEROSHELL, CAPSULE, canopiesFor, paintCanopies, paintDrapedCanopies, paintDust, paintPlasma, paintPlate, paintShell, paintSplash, ShellColours,
} from "../paint/landers";
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
// How long the dust of a touchdown hangs and how long a splash's spray hangs (ms).
const DUST_MS = 1400;
const SPLASH_MS = 1100;
// Coming down, the craft is held in view no higher than this share of the screen from the top while the land lies
// far below, and comes down to its spot over the last stretch: its height above the ground on screen grows with the
// log of its real height over `LIFT_METRES`, so the last hundred metres take as much of the screen as the kilometres
// above them.
const HIGHEST = 0.2;
const LIFT_METRES = 12;
const LIFT_SCALE = 1.6;
// Seen from this high (m) the land is half as near as standing on it; the legs swing out between these heights
// (m); a burn raises dust from this high (m); and a craft down too hard leans this far (radians).
const NEAR_METRES = 2000;
const LEGS_HIGH = 250;
const LEGS_LOW = 60;
const DUST_METRES = 30;
const HARD_TILT = 0.18;
// Where the air thins to nearly nothing it shows edge on as a bright band along the horizon, this tall.
const AIR_BAND = 0.03;

// Where the craft is drawn and what it is doing, for drawing the ship.
interface ShipPlace {
  x: number;
  y: number;
  groundY: number;
  tall: number;
  wide: number;
  ambient: number;
  descent: Descent | null;
  isLeaving: boolean;
  sinceDown: number;
  altitude: number;
}

// How far above its spot the craft stands on screen (pixels) at a real height (m), no higher than `highest`.
const liftOf = (altitude: number, tall: number, highest: number) => Math.min(highest, tall * LIFT_SCALE * Math.log1p(Math.max(0, altitude) / LIFT_METRES));

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
    // On the way down the eye is as high as the craft: the air thins over it and the land lies far below.
    const descent = ground && state.descent?.body === place.id && state.descent.downAt === null ? state.descent : null;
    const altitude = descent?.craft.altitude ?? 0;
    const air = descent?.world.air ?? null;
    const density = air ? densityAt(air, altitude) / air.density : 1;
    const nearness = 1 / (1 + altitude / NEAR_METRES);
    const view = {
      context: front.context, width, height, horizon, fieldOfView: FIELD_OF_VIEW, drop: 0, density, nearness, now, opacity: this.shown, isWholeSky: true,
    };
    const sky = this.painter.paint(view, scene);

    if (air && scene.air) {
      this.drawAirBand(horizon, width, height, scene.air.horizon, 1 - density);
    }

    this.drawCraft(frame, horizon + height * 0.07, sky.light, !ground);
    front.context.globalAlpha = 1;
  }

  // The air seen edge on from high above: a thin bright band in the sky's own colour along the horizon, strongest
  // where the air round the eye has thinned to almost nothing.
  private drawAirBand(horizon: number, width: number, height: number, colour: string, thinness: number): void {
    if (thinness < 0.2) {
      return;
    }

    const context = this.kit.front.context;
    const band = height * AIR_BAND;
    const glow = context.createLinearGradient(0, horizon - band, 0, horizon);

    glow.addColorStop(0, "rgba(0, 0, 0, 0)");
    glow.addColorStop(1, colour);
    context.globalAlpha = this.shown * Math.min(1, (thinness - 0.2) / 0.6) * 0.9;
    context.fillStyle = glow;
    context.fillRect(0, horizon - band, width, band);
    context.globalAlpha = this.shown;
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

  private starColour(kelvin: number): string {
    const [red, green, blue] = blackbody(kelvin);

    return rgbToHex([red * 255, green * 255, blue * 255]);
  }

  // The craft where the way down has it: held in view as it comes down (high up, the land is far below and the air
  // thins to black), coming down to its spot over the last stretch, then standing on it. Home, the crew capsule
  // under its parachutes; elsewhere an aeroshell through entry, then the ship under its canopies, on its drag
  // plate or on its engine, legs swinging out as the ground comes up; the dust it raises and the splash at sea. On
  // take off it lifts away on its flame.
  private drawCraft({ state, theme, universe, now }: VoyageFrame, groundY: number, light: number, isLeaving: boolean): void {
    const { front } = this.kit;
    const context = front.context;
    const { width, height } = front;
    const tall = height * SHIP_SHARE;
    const wide = tall * (SHIP_WIDTH / SHIP_HEIGHT);
    const descent = state.descent?.body === this.body ? state.descent : null;
    const craft = isLeaving ? null : descent?.craft ?? null;
    const altitude = craft?.altitude ?? 0;
    const lift = isLeaving ? (1 - this.shown) ** 2 * height * 0.8 : liftOf(altitude, tall, groundY - height * HIGHEST);
    const x = width / 2;
    const y = groundY - lift;
    const sunSide = this.scene?.sun ? Math.sign(this.scene.sun.side) || 1 : 1;
    const sinceDown = descent?.downAt !== null && descent?.downAt !== undefined ? state.elapsedMs - descent.downAt : Infinity;
    const isHome = descent ? descent.world.isHome : this.info?.isHome ?? false;
    const ambient = 0.25 + 0.75 * light;
    const alpha = this.shown;
    // The craft's shadow, sharper and darker as it comes down to meet it.
    const nearness = 1 - Math.min(1, lift / (height * 0.4));

    context.globalAlpha = alpha * nearness * 0.45;
    context.fillStyle = "#000000";
    context.beginPath();
    context.ellipse(x - sunSide * wide * 0.4, groundY + 2, wide * (0.5 + 0.3 * nearness), wide * 0.16, 0, 0, TAU);
    context.fill();

    // Lights on the ground in front of it once it is down and it is dark.
    if (light < 0.45 && !isLeaving && lift < tall * 0.2) {
      const pool = context.createRadialGradient(x, groundY + tall * 0.15, 0, x, groundY + tall * 0.15, tall * 1.4);

      pool.addColorStop(0, `rgba(255, 240, 210, ${(0.45 - light) * 0.9})`);
      pool.addColorStop(1, "rgba(255, 240, 210, 0)");
      context.globalAlpha = alpha;
      context.fillStyle = pool;
      context.fillRect(x - tall * 1.4, groundY - tall * 0.2, tall * 2.8, tall * 1.2);
    }

    context.globalAlpha = alpha;

    if (isHome && !isLeaving) {
      this.drawCapsule(context, x, y, groundY, tall, ambient, sunSide, now, descent, sinceDown);
    } else if (craft?.phase === "entry") {
      this.drawShell(context, x, y, tall, ambient, sunSide, now, craft, AEROSHELL);
    } else {
      this.drawShip({ state, theme, universe, now }, { x, y, groundY, tall, wide, ambient, descent, isLeaving, sinceDown, altitude });
    }

    context.globalAlpha = 1;
  }

  // The crew capsule home: through entry in its plasma, swinging under its drogues then its mains, the landing
  // rockets flashing a moment before touchdown on land; down, its canopies spread beside it, or at sea riding the
  // swell in its flotation collar after the splash.
  private drawCapsule(context: Canvas2DContext, x: number, y: number, groundY: number, tall: number, ambient: number, lit: number, now: number,
    descent: Descent | null, sinceDown: number): void {
    const craft = descent?.craft ?? null;
    const isDown = !craft || craft.isDown;
    const isSea = descent?.world.isWater ?? this.scene?.ground.relief === "sea";
    const wide = tall * 0.78;
    const high = tall * 0.6;

    if (craft?.phase === "entry") {
      this.drawShell(context, x, y, tall, ambient, lit, now, craft, CAPSULE);

      return;
    }

    const canopies = craft && !isDown ? canopiesFor("parachutes", craft.phase) : null;

    if (canopies) {
      paintCanopies(context, x, y - high, tall, wide, canopies, ambient, now);
    }

    if (isDown && !isSea) {
      paintDrapedCanopies(context, x, groundY, tall, wide, high, ambient);
    }

    const bob = isSea && isDown ? Math.sin(now * 0.0025) * tall * 0.025 : 0;
    const tilt = isSea && isDown ? Math.sin(now * 0.0017) * 0.06 : isDown ? 0 : Math.sin(now * 0.0021) * 0.05;

    context.save();
    context.translate(x, y + bob);
    context.rotate(tilt);
    paintShell(context, wide, high, tall, ambient, lit, CAPSULE);

    if (isSea && isDown) {
      // The flotation collar, and an even ring of sea round the capsule's lower edge with a pale ripple at the
      // waterline, in the colour of the water near by.
      context.fillStyle = shadeHex("#f0781e", ambient);
      context.beginPath();
      context.ellipse(0, -high * 0.08, wide * 0.62, tall * 0.05, 0, 0, TAU);
      context.fill();
      context.fillStyle = this.scene ? this.scene.ground.far : "#2b6b9a";
      context.globalAlpha *= 0.75;
      context.beginPath();
      context.ellipse(0, -high * 0.01, wide * 0.82, high * 0.09, 0, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(235, 245, 255, 0.55)";
      context.lineWidth = Math.max(1, tall * 0.012);
      context.beginPath();
      context.ellipse(0, -high * 0.04, wide * (0.7 + Math.sin(now * 0.004) * 0.04), high * 0.06, 0, Math.PI, TAU);
      context.stroke();
    }

    context.restore();

    // The landing rockets, kicking up the ground as they fire.
    if (craft?.phase === "softLanding" && craft.throttle > 0) {
      const flash = context.createRadialGradient(x, groundY, 0, x, groundY, wide * 1.1);

      flash.addColorStop(0, "rgba(255, 236, 190, 0.95)");
      flash.addColorStop(0.4, "rgba(255, 150, 60, 0.6)");
      flash.addColorStop(1, "rgba(255, 120, 40, 0)");
      context.fillStyle = flash;
      context.fillRect(x - wide * 1.1, y - wide * 0.4, wide * 2.2, groundY - y + wide * 0.6);
    }

    if (isSea) {
      paintSplash(context, x, groundY, wide, tall, sinceDown / SPLASH_MS);
    } else if (this.scene && sinceDown < DUST_MS) {
      paintDust(context, x, groundY, wide, tall, this.scene.ground.colour, sinceDown / DUST_MS, 0.6);
    }
  }

  // A blunt craft through entry, its heat shield turned into its path and wrapped in the plasma its speed makes.
  private drawShell(context: Canvas2DContext, x: number, y: number, tall: number, ambient: number, lit: number, now: number, craft: DescentState,
    colours: ShellColours): void {
    const wide = tall * 0.78;
    const high = tall * 0.6;
    // On screen down is positive: the shield faces the way it is going.
    const heading = Math.atan2(-craft.up, craft.across) - Math.PI / 2;

    context.save();
    context.translate(x, y - high / 2);
    context.rotate(heading);
    context.translate(0, high / 2);
    paintPlasma(context, wide, high, tall, craft.heating, now, false);
    paintShell(context, wide, high, tall, ambient, lit, colours);
    paintPlasma(context, wide, high, tall, craft.heating, now, true);
    context.restore();
  }

  // The ship: under its canopies or on its drag plate, burning on the way down as hard as the guidance or the pilot
  // asks (the flame reaching no further than the ground and spreading along it), legs swinging out as the ground
  // comes up, dust thrown up and settling; tilted where it came down too hard. Lifting off, burning flat out.
  private drawShip({ state, theme, universe, now }: Pick<VoyageFrame, "state" | "theme" | "universe" | "now">, place: ShipPlace): void {
    const { x, y, groundY, tall, wide, ambient, descent, isLeaving, sinceDown, altitude } = place;
    const context = this.kit.front.context;
    const craft = isLeaving ? null : descent?.craft ?? null;
    const tier = tierOf(state.level);
    const mark = markOf(state.level);
    const accent = universe?.accent ?? theme.danger;
    const key = `${tier}:${mark}:${accent}`;

    if (this.hull?.key !== key) {
      this.hull = { key, paint: paintHull(tier, mark, { ...theme, accent }) };
    }

    const size = Math.max(16, Math.round(wide / SHIP_WIDTH));
    const sprite = this.kit.sprite(`ship:${tier}:${mark}:${accent}:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, this.hull.paint);
    const canopies = craft && descent && !craft.isDown ? canopiesFor(descent.plan.method, craft.phase) : null;
    const throttle = isLeaving ? 1 : craft?.throttle ?? 0;
    const top = y - tall * 0.98;

    if (canopies) {
      paintCanopies(context, x, top, tall, wide, canopies, ambient, now);
    }

    if (throttle > 0.02) {
      const flame = this.kit.sprite(`flame:${theme.flameCore}:${size}`, size * 1.1, size * 2.8, paintFlame(theme.flameCore, theme.flameEdge));
      const nozzle = y - tall * 0.2;
      const reach = tall * (0.3 + 0.8 * throttle) * (0.9 + Math.sin(now * 0.05) * 0.1);
      const length = Math.min(reach, Math.max(0, groundY - nozzle));

      if (flame) {
        context.drawImage(flame.surface, x - wide * 0.22, nozzle, wide * 0.44, length);
      }

      if (!isLeaving && groundY - nozzle < reach) {
        const spread = context.createRadialGradient(x, groundY, 0, x, groundY, wide * 1.6);

        spread.addColorStop(0, `rgba(255, 220, 160, ${(0.7 * throttle).toFixed(3)})`);
        spread.addColorStop(1, "rgba(255, 160, 80, 0)");
        context.fillStyle = spread;
        context.fillRect(x - wide * 1.6, groundY - wide * 0.5, wide * 3.2, wide);
      }
    }

    const isHard = descent !== null && descent.downAt !== null && !descent.isSoft;
    const legs = isLeaving || !craft || craft.isDown || craft.isPilot ? 1 : smoothstep(LEGS_HIGH, LEGS_LOW, altitude);

    context.save();
    context.translate(x, y);
    context.rotate(isHard ? HARD_TILT : 0);
    context.strokeStyle = "#3a3f4a";
    context.lineWidth = Math.max(1.5, wide * 0.05);
    context.beginPath();
    [-1, 1].forEach((side) => {
      context.moveTo(side * wide * 0.22, -tall * 0.25);
      context.lineTo(side * wide * (0.26 + 0.22 * legs), -tall * 0.12 * (1 - legs));
    });
    context.stroke();

    if (sprite) {
      context.drawImage(sprite.surface, -wide / 2, -tall * 0.98, wide, tall);
    }

    context.restore();

    if (craft?.phase === "dragPlate") {
      paintPlate(context, x, y - tall * 0.45, wide, tall, ambient);
    }

    if (!this.scene || isLeaving) {
      return;
    }

    // Raised by the burn as the ground comes near, then settling once down (more of it after a hard landing).
    const blast = craft && !craft.isDown ? throttle * (1 - Math.min(1, altitude / DUST_METRES)) : 0;

    if (blast > 0) {
      paintDust(context, x, groundY, wide, tall, this.scene.ground.colour, -0.3 * (1 - blast), blast);
    } else if (sinceDown < DUST_MS) {
      paintDust(context, x, groundY, wide, tall, this.scene.ground.colour, sinceDown / DUST_MS, isHard ? 1 : 0.7);
    }
  }
}
