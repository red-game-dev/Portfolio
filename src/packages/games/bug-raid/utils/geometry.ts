export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const distanceSquared = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;
