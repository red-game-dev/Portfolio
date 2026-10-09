import { SystemScale } from "../domain/content";

// The world distance from the star for a real distance in AU.
export const radiusForAu = ({ unitsPerRootAu, innerAu, starRadius, starRadiusAu }: SystemScale, au: number): number => {
  if (au >= innerAu) {
    return unitsPerRootAu * Math.sqrt(au);
  }

  // Between the star's surface and Mercury, a straight line in log-log, which meets both ends exactly.
  const inner = unitsPerRootAu * Math.sqrt(innerAu);
  const t = Math.log(Math.max(au, starRadiusAu * 0.5) / starRadiusAu) / Math.log(innerAu / starRadiusAu);

  return starRadius * (inner / starRadius) ** t;
};

// The real distance in AU for a world distance from the star: the inverse of `radiusForAu`.
export const auForRadius = ({ unitsPerRootAu, innerAu, starRadius, starRadiusAu }: SystemScale, radius: number): number => {
  const inner = unitsPerRootAu * Math.sqrt(innerAu);

  if (radius >= inner) {
    return (radius / unitsPerRootAu) ** 2;
  }

  const t = Math.log(Math.max(radius, starRadius * 0.5) / starRadius) / Math.log(inner / starRadius);

  return starRadiusAu * (innerAu / starRadiusAu) ** t;
};
