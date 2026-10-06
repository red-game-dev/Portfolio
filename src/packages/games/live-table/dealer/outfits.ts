// How the dealer is dressed. The cut decides the shapes, the colours the look; "sheen" is the satin or
// sequin highlight and "jewellery" her earrings and necklace.
export type DealerCut = "sweetheart" | "offShoulder" | "halter" | "waistcoat";

export interface DealerOutfit {
  id: string;
  cut: DealerCut;
  primary: string;
  shade: string;
  sheen: string;
  jewellery: string;
  // Sequins that catch the light.
  hasSparkle?: boolean;
  // A glowing edge, for the neon look.
  glow?: string;
}

export interface DealerLook {
  skin: string;
  skinShade: string;
  hair: string;
  hairShine: string;
  lips: string;
  eyes: string;
  liner: string;
}

export const DEFAULT_DEALER_LOOK: DealerLook = {
  skin: "#f1c7a4",
  skinShade: "#d9a27f",
  hair: "#2a170e",
  hairShine: "#7a4a2a",
  lips: "#c41e3a",
  eyes: "#6b4226",
  liner: "#140b06",
};

export const DEFAULT_DEALER_OUTFITS: DealerOutfit[] = [
  { id: "red", cut: "sweetheart", primary: "#c0122f", shade: "#7a0a1d", sheen: "#ff5a72", jewellery: "#e8c25a" },
  { id: "emerald", cut: "offShoulder", primary: "#0f7a4a", shade: "#064428", sheen: "#4fd39a", jewellery: "#f0f0f6" },
  { id: "sequin", cut: "halter", primary: "#17171c", shade: "#050507", sheen: "#5a5a66", jewellery: "#f0f0f6", hasSparkle: true },
  { id: "classic", cut: "waistcoat", primary: "#141418", shade: "#050507", sheen: "#3a3a44", jewellery: "#e8c25a" },
  { id: "neon", cut: "sweetheart", primary: "#24104a", shade: "#12062a", sheen: "#ff4fd8", jewellery: "#4fd8ff", glow: "#ff4fd8" },
];
