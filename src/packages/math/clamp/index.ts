export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clamp01 = (value: number) => clamp(value, 0, 1);

// A value brought into 0 to `size` by wrapping round, the way a clock or a compass does: -1 in 24 is 23. Unlike
// the % operator, a negative value wraps to the top of the range rather than staying below 0.
export const wrap = (value: number, size: number) => ((value % size) + size) % size;
