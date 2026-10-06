import { SpriteArt } from "@/config/sprites";

// The dealer at the live table: upper body behind the felt, holding the deck, drawn as rows of palette keys
// like the other sprites. Outfits only swap colours: "A" and "a" are the garment, "W" what shows at the
// neckline (a shirt, or skin for a dress) and "B" and "g" the accents (a bow tie and buttons, or jewellery).
const ROWS = [
  "............HHHHHHHH............",
  "..........HHHHHHHHHHHH..........",
  ".........HHHhhhhhhhhHHH.........",
  "........HHHhhhhhhhhhhHHH........",
  ".......HHHhhHHHHHHHHhhHHH.......",
  ".......HHhHHHHHssHHHHHhHH.......",
  "......HHhHHHHssssssHHHHhHH......",
  "......HHHHHssssssssssHHHHH......",
  "......HHHHsbbssssssbbsHHHH......",
  "......HHHssssssssssssssHHH......",
  "......HHHsseesssssseessHHH......",
  "......HHHssewsssssswessHHH......",
  "......HHHspssssSSsssspsHHH......",
  "......HHHssssmssssmssssHHH......",
  "......HHHHssssllllssssHHHH......",
  "......HHHHssssssssssssHHHH......",
  ".......HHHHssssssssssHHHH.......",
  ".......HHHHH.SSssSS.HHHHH.......",
  "......HHHHHH..ssss..HHHHHH......",
  ".....HHHHHHAAWssssWAAHHHHHH.....",
  "....HHHHAAAAAWWBBWWAAAAAHHHH....",
  "...HHHAAAAAAAAWBBWAAAAAAAAHHH...",
  "...HHAAAAAAAAAAWWAAAAAAAAAAHH...",
  "..HHAAaAAAAAAAAWWAAAAAAAAaAAHH..",
  "..HAAAaAAAAAAAAggAAAAAAAAaAAAH..",
  "..AAAAaAAAAAAAAAAAAAAAAAAaAAAA..",
  "..AAAAAaAAAAAAAggAAAAAAAaAAAAA..",
  "..AAAAAaAAAAAAAAAAAAAAAAaAAAAA..",
  "..ssAAAAaAAAAAAAAAAAAAAaAAAAss..",
  "...sssAAAAAAAAAAAAAAAAAAAAsss...",
  "....ssssssAAAAAAAAAAAAssssss....",
  "......sssssCCCCCCCCCCsssss......",
];

// The same, mid word: the mouth opens just under the lips.
const TALK_ROWS = ROWS.map((row, index) => (index === 15 ? `${row.slice(0, 15)}oo${row.slice(17)}` : row));

const BASE_PALETTE: Record<string, string> = {
  H: "#3a2416",
  h: "#6b4528",
  s: "#f0c4a0",
  S: "#d9a07c",
  e: "#1a1a1a",
  w: "#ffffff",
  b: "#3a2416",
  p: "#f2a0a0",
  l: "#c8203c",
  m: "#b0606a",
  o: "#5a1020",
  C: "#f4efe6",
};

export interface DealerOutfit {
  id: string;
  palette: Record<string, string>;
}

export const DEALER_OUTFITS: DealerOutfit[] = [
  { id: "classic", palette: { A: "#16161a", a: "#2a2a30", W: "#f2f2f2", B: "#c8102e", g: "#d4af37" } },
  { id: "red", palette: { A: "#b3122e", a: "#8a0e23", W: "#f0c4a0", B: "#d4af37", g: "#b3122e" } },
  { id: "emerald", palette: { A: "#0f7a4a", a: "#0a5a36", W: "#f0c4a0", B: "#e8e8f0", g: "#0f7a4a" } },
  { id: "neon", palette: { A: "#1b1030", a: "#2d1a50", W: "#ff4fd8", B: "#4fd8ff", g: "#4fd8ff" } },
];

export const dealerSprite = (outfit: DealerOutfit, isTalking: boolean): SpriteArt => ({
  rows: isTalking ? TALK_ROWS : ROWS,
  palette: { ...BASE_PALETTE, ...outfit.palette },
});
