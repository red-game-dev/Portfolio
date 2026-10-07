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

// The three ways to read the site, as character select portraits.

// Recruiter or hiring manager: a hooded scout carrying a scroll of facts.
export const SCOUT_SPRITE: SpriteArt = {
  rows: [
    "................",
    ".....TTTT.......",
    "....TttttT......",
    "....tsssst......",
    "....tseset......",
    "....tsssst......",
    "...cTTTTTTc.....",
    "..cccTttTccc.pp.",
    "..cc.cccccc.spPp",
    "..s..cccccc..pPp",
    ".....cccccc..pPp",
    ".....cyyyyc.....",
    ".....cc..cc.....",
    ".....cc..cc.....",
    "....bbb..bbb....",
    "................",
  ],
  palette: {
    T: "#4fd8ff",
    t: "#24596b",
    s: "#e0a878",
    e: "#101010",
    c: "#2b7a94",
    y: "#ffc45c",
    p: "#e8d9b0",
    P: "#8b6b3a",
    b: "#3a2f26",
  },
};

// Product: a strategist in a cape, planting a milestone flag.
export const STRATEGIST_SPRITE: SpriteArt = {
  rows: [
    ".............FF.",
    ".....hhhh....FFF",
    "....hhhhhh...qFF",
    "....hsssss...q..",
    "....hsesse...q..",
    ".....ssss....q..",
    "...VvvvvvvV..q..",
    "..VVvvMvvvVVsq..",
    "..VVvvvvvvVV.q..",
    "..VVvvvvvvVV.q..",
    "..VVvyyyyvVV.q..",
    "..VV.vvvv.VV.q..",
    "...V.vv.vv.V.q..",
    ".....vv.vv...q..",
    "....bbb.bbb..q..",
    "................",
  ],
  palette: {
    F: "#ffc45c",
    h: "#3b2a1a",
    s: "#e0a878",
    e: "#101010",
    q: "#8b949e",
    V: "#8a5a12",
    v: "#ffc45c",
    M: "#ffffff",
    y: "#b07d2a",
    b: "#4a3a2a",
  },
};

// Engineer: a netrunner behind a green visor, hands on a glowing deck.
export const NETRUNNER_SPRITE: SpriteArt = {
  rows: [
    "................",
    ".....kkkk.......",
    "....kKKKKk......",
    "....KggggK......",
    "....KsssK.......",
    ".....KssK.......",
    "...kkKKKKkk.....",
    "..kkkKggKkkk....",
    "..kk.KKKK.kk....",
    "..ss.KKKK.ss....",
    ".lgggggggggl....",
    ".llllllllllll...",
    ".....KK..KK.....",
    ".....KK..KK.....",
    "....kkk..kkk....",
    "................",
  ],
  palette: {
    k: "#1c2420",
    K: "#33403a",
    g: "#4bffa5",
    s: "#e0a878",
    l: "#5c6773",
  },
};
