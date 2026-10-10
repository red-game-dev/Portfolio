import { Guard, isArrayOf, isFiniteNumber, isRecord, isText } from "@/packages/core/domain";
import type { KeplerElements, Pole } from "@/packages/physics/kepler";

import { AirData, BeltData, BodyData, OrbitData, SolarSystemData, StarData } from "../domain/content";

const AIR_KINDS: ReadonlyArray<AirData["kind"]> = ["thin", "thick", "giant"];
const BODY_KINDS: ReadonlyArray<BodyData["kind"]> = ["planet", "dwarf", "moon"];

const isElement = (value: unknown) => isRecord(value) && isFiniteNumber(value.value) && isFiniteNumber(value.rate);

const isElements: Guard<KeplerElements> = (value): value is KeplerElements => isRecord(value) && isElement(value.a) && isElement(value.e) &&
  isElement(value.inclination) && isElement(value.meanLongitude) && isElement(value.perihelion) && isElement(value.node);

const isOrbit: Guard<OrbitData> = (value): value is OrbitData => isRecord(value) && (
  (value.kind === "sun" && isElements(value.elements)) ||
  (value.kind === "moon" && isText(value.parent) && isFiniteNumber(value.distanceKm) && isFiniteNumber(value.periodDays) && isFiniteNumber(value.longitudeAtEpoch))
);

const isAir: Guard<AirData> = (value): value is AirData => isRecord(value) && AIR_KINDS.some((kind) => kind === value.kind) &&
  isFiniteNumber(value.pressureBar) && isFiniteNumber(value.temperatureC) && isFiniteNumber(value.topTemperatureC) &&
  isFiniteNumber(value.molarMass);

const isPole: Guard<Pole> = (value): value is Pole => isRecord(value) && isFiniteNumber(value.ra) && isFiniteNumber(value.dec);

const isRings = (value: unknown) => value === null || (isRecord(value) && isFiniteNumber(value.innerKm) && isFiniteNumber(value.outerKm));

const isBody: Guard<BodyData> = (value): value is BodyData => isRecord(value) && isText(value.id) && BODY_KINDS.some((kind) => kind === value.kind) &&
  isOrbit(value.orbit) && isFiniteNumber(value.radiusKm) && isFiniteNumber(value.surfaceGravity) && (value.air === null || isAir(value.air)) &&
  isFiniteNumber(value.dayC) && isFiniteNumber(value.nightC) && (value.dayHours === null || isFiniteNumber(value.dayHours)) && isPole(value.pole) &&
  isRings(value.rings);

const isStar: Guard<StarData> = (value): value is StarData => isRecord(value) && isText(value.id) && isFiniteNumber(value.radiusKm) &&
  isFiniteNumber(value.surfaceGravity) && isFiniteNumber(value.temperatureK) && isFiniteNumber(value.rotationDays);

const isBelt: Guard<BeltData> = (value): value is BeltData => isRecord(value) && isText(value.id) && isFiniteNumber(value.fromAu) &&
  isFiniteNumber(value.toAu) && isFiniteNumber(value.density) && typeof value.isIcy === "boolean";

export const isSolarSystemData: Guard<SolarSystemData> = (value): value is SolarSystemData => isRecord(value) && isStar(value.star) &&
  isArrayOf(isBody)(value.bodies) && isArrayOf(isBelt)(value.belts) && isFiniteNumber(value.edgeAu);
