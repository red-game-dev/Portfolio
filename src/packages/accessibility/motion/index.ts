// How much the page moves: as the device asks (its reduced motion setting), always reduced, or always in full.
export type MotionSetting = "system" | "reduced" | "full";

// The attribute on the page's root that every rule about motion reads, "reduced" or "full", so a switch on the page
// stops what moves as surely as the device's own setting does (WCAG 2.2.2 asks for one on the page).
export const MOTION_ATTRIBUTE = "data-motion";

const SYSTEM_QUERY = "(prefers-reduced-motion: reduce)";

// Whether the page should keep still, from the reader's setting and the device's.
export const isMotionReduced = (setting: MotionSetting, systemReduced: boolean): boolean =>
  setting === "reduced" || (setting === "system" && systemReduced);

// The setting a switch on the page moves to: back to moving (the device's choice, or in full where the device asks
// for less), or to still.
export const toggledMotion = (isReduced: boolean, systemReduced: boolean): MotionSetting => {
  if (!isReduced) {
    return "reduced";
  }

  return systemReduced ? "full" : "system";
};

// Whether the device asks for reduced motion.
export const systemPrefersReduced = (): boolean => typeof window !== "undefined"
  && typeof window.matchMedia === "function"
  && window.matchMedia(SYSTEM_QUERY).matches;

// Whether the page keeps still right now: the root's attribute once it is set, else the device's setting.
export const prefersReducedMotion = (): boolean => {
  const value = typeof document === "undefined" ? null : document.documentElement.getAttribute(MOTION_ATTRIBUTE);

  return value === "reduced" || value === "full" ? value === "reduced" : systemPrefersReduced();
};

// How to scroll to something: smoothly, unless the reader asked for less motion.
export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth");

// A script for the document's head that sets the root's attribute before the first paint, from the setting kept
// under `key` (a JSON record with a `motion` field) and the device's setting, so nothing moves for a moment that the
// reader asked to keep still. It touches nothing else and survives blocked or broken storage.
export const motionScript = (key: string): string => [
  "(function(){try{var s='system';",
  `try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(key)})||'null');`,
  "if(v&&(v.motion==='reduced'||v.motion==='full'))s=v.motion;}catch(e){}",
  `var r=s==='reduced'||(s==='system'&&window.matchMedia&&window.matchMedia(${JSON.stringify(SYSTEM_QUERY)}).matches);`,
  `document.documentElement.setAttribute(${JSON.stringify(MOTION_ATTRIBUTE)},r?'reduced':'full');}catch(e){}})();`,
].join("");
