import type { System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";

import { SystemBody } from "../domain/content";
import { VoyageContext } from "./context";
import { applyDamage } from "./damage";
import { addCrater, arrivalSpeed, bindingEnergy, craterKm, impactEnergy, impactorMass, impactOutcome, isOnCourseNow, predictApproach } from "./impacts";
import { isInSystem, isSolar, shipOf } from "./queries";

// Worlds within this distance of the ship can be the target of a rock (world units), and how far from its
// target a rock starts.
const TARGET_REACH = 35;
const START_DISTANCE: [number, number] = [9, 13];
// Rocks that missed are let go this far from their target.
const LET_GO = 26;
// How fast scars cool: a crater, and a world's melted face (heat a second).
const CRATER_COOLING = 0.03;
const MELT_COOLING = 0.008;
const DEG = 180 / Math.PI;
// How many times an aim is corrected before a course is given up as one gravity will not allow, and how often
// (ms) a rock's course is looked at again.
const AIM_ATTEMPTS = 5;
const COURSE_CHECK_MS = 250;

// Rocks headed for worlds. Every so often one sets out for a world near the ship, on a course that will hit it,
// with a warning of how big it is and how long until it hits; gravity pulls it in as it comes. If it hits, its
// energy against what holds the world together decides: a crater scaled from its size, speed and the world's
// gravity, a burst in thick air, a melted hemisphere, or the world broken into rubble. The ship can shoot it,
// to break it apart or push it off course (see impacts.ts). Old scars cool.
export class ImpactSystem implements System<VoyageContext> {
  public readonly name = "impacts";

  public update(context: VoyageContext, dt: number): void {
    const { state, world, config, random } = context;

    Object.values(state.craters).forEach((scars) => scars.forEach((scar) => {
      scar.heat = Math.max(0, scar.heat - (scar.size > 25 ? MELT_COOLING : CRATER_COOLING) * dt);
    }));

    if (state.status !== "flying" || !isInSystem(context)) {
      return;
    }

    state.nextImpactAt = state.nextImpactAt ?? state.elapsedMs + randomBetween(random, config.impacts.every[0], config.impacts.every[1]) * 1000;

    if (state.elapsedMs >= state.nextImpactAt) {
      state.nextImpactAt = state.elapsedMs + randomBetween(random, config.impacts.every[0], config.impacts.every[1]) * 1000;
      this.launch(context);
    }

    const isCheckDue = Math.floor(state.elapsedMs / COURSE_CHECK_MS) !== Math.floor((state.elapsedMs - dt * 1000) / COURSE_CHECK_MS);

    world.stores.impactor.entities.forEach((entity, index) => {
      const impactor = world.stores.impactor.values[index];
      const rock = world.stores.body.get(entity);
      const target = state.system.bodies.find((body) => body.id === impactor.target);

      if (!rock || !target || target.isShattered) {
        world.despawn(entity);

        return;
      }

      const away = Math.hypot(rock.x - target.x, rock.y - target.y);

      // Gravity may carry it past without anyone touching it; then it is no longer coming. Looked at a few times a
      // second, not every step: following a path through the field is the dearest thing done here.
      if (impactor.isOnCourse && isCheckDue && !isOnCourseNow(context, rock, target)) {
        impactor.isOnCourse = false;
      }

      if (away < target.radius) {
        this.strike(context, target, rock, impactor.diameterKm);
        world.despawn(entity);
      } else if (!impactor.isOnCourse && away > LET_GO) {
        world.despawn(entity);
      }
    });
  }

  private launch(context: VoyageContext): void {
    const { state, world, config, random, events } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    const near = state.system.bodies.filter((body) => !body.isShattered && Math.hypot(body.x - parts.body.x, body.y - parts.body.y) < TARGET_REACH);
    const target = near[Math.floor(random() * near.length)];

    if (!target) {
      return;
    }

    const solar = isSolar(context);
    const isPlanetoid = !solar && random() < config.impacts.planetoid;
    const [smallest, largest] = solar ? config.impacts.solarKm : config.impacts.universeKm;
    // Small rocks are far more common than big ones.
    const diameterKm = isPlanetoid ? randomBetween(random, 0.25, 0.7) * target.radius * target.kmPerUnit : smallest * (largest / smallest) ** (random() ** 2);
    const radius = isPlanetoid ? Math.min(target.radius * 0.7, diameterKm / target.kmPerUnit / 2) : 0.07 + 0.1 * Math.min(1, diameterKm / largest);
    const angle = random() * Math.PI * 2;
    const distance = randomBetween(random, START_DISTANCE[0], START_DISTANCE[1]);
    const speed = randomBetween(random, config.impacts.speed[0], config.impacts.speed[1]);
    const x = target.x + Math.cos(angle) * distance;
    const y = target.y + Math.sin(angle) * distance;
    const course = this.aim(context, target, x, y, distance / speed, speed);

    // A course gravity will not let hit is no threat to announce: the rock is never sent.
    if (!course) {
      return;
    }

    const seconds = distance / speed;
    const rock = world.spawn();
    const maxHp = 80 * (radius / 0.1) ** 3;

    world.stores.body.set(rock, { x, y, vx: course.vx, vy: course.vy, prevX: x, prevY: y, radius, mass: impactorMass(radius) });
    world.stores.spin.set(rock, { angle: random() * Math.PI * 2, rate: randomBetween(random, -0.8, 0.8) });
    world.stores.impactor.set(rock, { target: target.id, hp: maxHp, maxHp, diameterKm, isFragment: false, isOnCourse: true });
    events.emit("impactAlert", { target: target.id, diameterKm, seconds });
  }

  // A velocity that will hit: aimed at where the target will be, then corrected by however far its path through
  // the world's gravity still misses, a few times over.
  private aim(context: VoyageContext, target: SystemBody, x: number, y: number, seconds: number, speed: number): { vx: number; vy: number } | null {
    let aimX = target.x + target.vx * seconds;
    let aimY = target.y + target.vy * seconds;

    for (let attempt = 0; attempt < AIM_ATTEMPTS; attempt += 1) {
      const length = Math.hypot(aimX - x, aimY - y) || 1;
      const course = { x, y, vx: ((aimX - x) / length) * speed, vy: ((aimY - y) / length) * speed };
      const miss = predictApproach(context, course, target);

      // Its path reaches the surface: a hit.
      if (miss.distance < target.radius) {
        return course;
      }

      aimX -= miss.dx;
      aimY -= miss.dy;
    }

    return null;
  }

  private strike(context: VoyageContext, target: SystemBody, rock: { x: number; y: number; vx: number; vy: number }, diameterKm: number): void {
    const { state, config, events, random } = context;
    const approach = Math.hypot(rock.vx - target.vx, rock.vy - target.vy) * config.units.kmPerSecond;
    const speed = arrivalSpeed(approach, target);
    const radiusKm = target.radius * target.kmPerUnit;
    const ratio = impactEnergy(diameterKm, speed) / bindingEnergy(target.surfaceGravity, radiusKm);
    const outcome = impactOutcome(ratio, diameterKm, target.air !== null && target.air.kind !== "thin");
    const crater = craterKm(diameterKm, speed, target.surfaceGravity);
    const angle = Math.atan2(rock.y - target.y, rock.x - target.x);
    const toStar = Math.atan2(state.system.star.y - target.y, state.system.star.x - target.x);

    if (outcome === "crater" || outcome === "catastrophe") {
      addCrater(context, target.id, {
        longitude: target.subsolarLongitude - (angle - toStar) * DEG,
        latitude: randomBetween(random, -25, 25),
        size: Math.min(80, Math.max(2.5, (outcome === "catastrophe" ? 3 : 1) * (crater / radiusKm) * DEG)),
        heat: 1,
      });
    }

    if (outcome === "shattered") {
      this.shatter(context, target);
    }

    // A ship resting on a world that is struck is thrown, and one on a world that breaks goes with it.
    const parts = shipOf(context);

    if (parts?.ship.landedOn === target.id && outcome !== "crater" && outcome !== "airburst") {
      parts.ship.landedOn = null;
      parts.ship.landedOffset = null;
      applyDamage(context, outcome === "shattered" ? 900 : 300, angle, "impact");
    }

    const x = target.x + Math.cos(angle) * target.radius;
    const y = target.y + Math.sin(angle) * target.radius;

    events.emit("impact", { target: target.id, x, y, ratio, craterKm: crater, outcome });
  }

  // A world broken apart: its gravity and air gone, its pieces flung out as rubble round where it was.
  private shatter(context: VoyageContext, target: SystemBody): void {
    const { world, random } = context;
    const pieces = 18;

    target.isShattered = true;
    target.mu = 0;
    target.air = null;

    for (let index = 0; index < pieces; index += 1) {
      const angle = (index / pieces) * Math.PI * 2 + random() * 0.3;
      const speed = randomBetween(random, 0.3, 1.1);
      const out = target.radius * randomBetween(random, 0.3, 1);
      const rock = world.spawn();
      const x = target.x + Math.cos(angle) * out;
      const y = target.y + Math.sin(angle) * out;
      const radius = target.radius * randomBetween(random, 0.08, 0.22);

      const vx = target.vx + Math.cos(angle) * speed;
      const vy = target.vy + Math.sin(angle) * speed;

      world.stores.body.set(rock, { x, y, vx, vy, prevX: x, prevY: y, radius, mass: radius * radius * 60 });
      world.stores.spin.set(rock, { angle: random() * Math.PI * 2, rate: randomBetween(random, -1.5, 1.5) });
      world.stores.hazard.set(rock, { shape: Math.floor(random() * 6), isIcy: false, isComet: false });
    }
  }
}

