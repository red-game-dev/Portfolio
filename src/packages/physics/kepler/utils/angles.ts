export const DEG = Math.PI / 180;

// An angle in degrees brought into -180 to 180.
export const wrapDegrees = (degrees: number): number => {
  const wrapped = ((degrees + 180) % 360 + 360) % 360 - 180;

  return wrapped === -180 ? 180 : wrapped;
};

// An angle in radians brought into -pi to pi.
export const wrapRadians = (radians: number): number => wrapDegrees(radians / DEG) * DEG;
