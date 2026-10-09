import { Guard, isArrayOf, isFiniteNumber, isRecord, isText } from "@/packages/core/domain";

import { AtmosphereKind, BeltData, BodyData, SolarSystemData } from "../domain/content";

const ATMOSPHERES: readonly AtmosphereKind[] = ["none", "thin", "thick", "giant"];

const isAtmosphere: Guard<AtmosphereKind> = (value): value is AtmosphereKind => ATMOSPHERES.some((kind) => kind === value);

const isBody: Guard<BodyData> = (value): value is BodyData => isRecord(value) && isText(value.id) && isFiniteNumber(value.au) &&
  isFiniteNumber(value.radiusKm) && isFiniteNumber(value.surfaceGravity) && isAtmosphere(value.atmosphere) &&
  isFiniteNumber(value.surfacePressureBar) && isFiniteNumber(value.offset);

const isBelt: Guard<BeltData> = (value): value is BeltData => isRecord(value) && isText(value.id) && isFiniteNumber(value.fromAu) &&
  isFiniteNumber(value.toAu) && isFiniteNumber(value.density) && typeof value.isIcy === "boolean";

export const isSolarSystemData: Guard<SolarSystemData> = (value): value is SolarSystemData => isRecord(value) && isArrayOf(isBody)(value.bodies) &&
  isArrayOf(isBelt)(value.belts) && isFiniteNumber(value.singularityAu);
