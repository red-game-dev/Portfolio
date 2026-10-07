// An MMO class as data: what the hero wears, what is on his head, what he holds and the colours.
export type HeroCut = "regal" | "plate" | "robe" | "leather" | "cloak";
export type HeroHeadgear = "crown" | "hood" | "featherCap" | "goggles" | "circlet" | "none";
export type HeroProp = "sceptre" | "staff" | "quill" | "blueprint" | "gear" | "hexChain" | "sword" | "bow" | "hammer" | "gauntlet";

export interface HeroClass {
  id: string;
  cut: HeroCut;
  headgear: HeroHeadgear;
  prop: HeroProp;
  primary: string;
  shade: string;
  trim: string;
  // The glow of the aura, the gem or the spell.
  aura: string;
  cape?: string;
}

export interface HeroLook {
  skin: string;
  skinShade: string;
  hair: string;
  hairShine: string;
  eyes: string;
}

// Short dark hair swept back, a slim face, clean shaven: the player behind every class.
export const DEFAULT_HERO_LOOK: HeroLook = {
  skin: "#efc6a6",
  skinShade: "#d2a080",
  hair: "#1d1410",
  hairShine: "#4a3428",
  eyes: "#3a2a1e",
};

export const DEFAULT_HERO_CLASSES: HeroClass[] = [
  { id: "sovereign", cut: "regal", headgear: "crown", prop: "sceptre", primary: "#d4a017", shade: "#8a6408", trim: "#fff4d6", aura: "#ffd36b", cape: "#9e1028" },
  { id: "archmage", cut: "robe", headgear: "hood", prop: "staff", primary: "#1f3a8a", shade: "#0c1a45", trim: "#b8c7ff", aura: "#58d6ff" },
  { id: "strategist", cut: "leather", headgear: "featherCap", prop: "quill", primary: "#2f7a4a", shade: "#173d25", trim: "#e8c25a", aura: "#9df0b8" },
  { id: "paladin", cut: "plate", headgear: "circlet", prop: "blueprint", primary: "#c9ced8", shade: "#6b7280", trim: "#e8c25a", aura: "#7fb6ff", cape: "#1f3a8a" },
  { id: "artificer", cut: "leather", headgear: "goggles", prop: "gear", primary: "#8a5a2b", shade: "#4a2e14", trim: "#d9a441", aura: "#ffb347" },
  { id: "runeKnight", cut: "plate", headgear: "none", prop: "hexChain", primary: "#2a2440", shade: "#120f1f", trim: "#b896ff", aura: "#b896ff" },
  { id: "captain", cut: "plate", headgear: "none", prop: "sword", primary: "#9aa3b2", shade: "#4b5260", trim: "#c0122f", aura: "#ff7a7a", cape: "#c0122f" },
  { id: "ranger", cut: "cloak", headgear: "hood", prop: "bow", primary: "#1f6b5a", shade: "#0e332b", trim: "#c9a227", aura: "#4bffa5" },
  { id: "warsmith", cut: "plate", headgear: "none", prop: "hammer", primary: "#a0612a", shade: "#5a3414", trim: "#f0c060", aura: "#ff9a3c" },
  { id: "battlemage", cut: "robe", headgear: "circlet", prop: "gauntlet", primary: "#5b2a86", shade: "#2a1040", trim: "#ff7ad9", aura: "#ff4fd8" },
];
