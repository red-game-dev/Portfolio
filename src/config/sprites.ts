// Pixel art for the game layer, as rows of palette keys. "." is transparent. Both fighters are drawn
// facing right; the scene mirrors whichever one stands on the right.

export interface SpriteArt {
  rows: string[];
  palette: Record<string, string>;
}

// Me: a warrior in gold armour with a plumed helmet, a round shield and a raised sword.
export const WARRIOR_SPRITE: SpriteArt = {
  rows: [
    ".....rr.........",
    "....rHHHH.......",
    "....HhhhhH......",
    "....hhhhhh....w.",
    "....hsesss...ww.",
    "....Hsssss..ww..",
    "...DD.aaa..ww...",
    "..DddDaaaagg....",
    "..DddDAaaas.....",
    "..DddDaaAa......",
    "..DddDaaaa......",
    "...DD.aAAa......",
    ".....aa..aa.....",
    ".....bb..bb.....",
    "....bbb..bbb....",
    "................",
  ],
  palette: {
    r: "#ff5a5a",
    H: "#8b949e",
    h: "#c9d1d9",
    s: "#e0a878",
    e: "#101010",
    D: "#ffc45c",
    d: "#8b5a2b",
    a: "#ffc45c",
    A: "#b07d2a",
    b: "#6b4a2b",
    w: "#e6edf3",
    g: "#ffc45c",
  },
};

// The agent: a robot swordsman with a visor, a glowing core and an energy blade.
export const AGENT_SPRITE: SpriteArt = {
  rows: [
    "......aa........",
    ".......M........",
    ".....MMMMM......",
    "....MmmmmmM.....",
    "....mmmvvvv.....",
    "....mmmmmmm.....",
    ".....mmmmm.....x",
    ".....jmmmj....x.",
    "....jmMcMmj..x..",
    "...jmmmmmmjjx...",
    "..j.mMmmMm.j....",
    "....mm..mm......",
    "....jj..jj......",
    "...MMM..MMM.....",
    "................",
    "................",
  ],
  palette: {
    a: "#4fd8ff",
    M: "#5c6773",
    m: "#9aa7b5",
    v: "#4fd8ff",
    c: "#4fd8ff",
    j: "#4a5560",
    x: "#b896ff",
  },
};
