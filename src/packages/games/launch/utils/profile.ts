import { Profile } from "../config";

// The value of a profile at `at` (0 to 1 through the climb), straight between the readings either side.
export const profileAt = (profile: Profile, at: number): number => {
  const next = profile.findIndex(([point]) => point >= at);

  if (next <= 0) {
    return next === 0 ? profile[0][1] : profile[profile.length - 1][1];
  }

  const [fromAt, from] = profile[next - 1];
  const [toAt, to] = profile[next];

  return from + ((to - from) * (at - fromAt)) / (toAt - fromAt || 1);
};
