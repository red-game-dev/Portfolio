import { ARCAVIUM_BLUEPRINT, GOZ_BLUEPRINT } from "@/data/blueprints/ventures";
import { Blueprint } from "@/types/blueprints";

// The game world's engine room: games and game platforms. No company is named. Every drawing is a glance, not the full design.
const blueprints: Blueprint[] = [
  GOZ_BLUEPRINT,
  ARCAVIUM_BLUEPRINT,
  {
    id: "location-game",
    tab: "Location game",
    zone: "mmo",
    title: "A location based mobile game",
    caption: "A game played on the real map: rewards spawn near the player, are caught through the camera and land in the " +
      "wallet, while location checks keep spoofers out.",
    summary: {
      role: "Proposed and built the core the app and its game run on",
      scale: "A game inside a large consumer app",
      stack: ["React Native", "Kotlin", "Java", "C/C++", "RxJS", "Maps", "Location services", "Camera"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "lg-client",
          label: "Mobile client",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "lg-map", label: "Map view", detail: "Tiles and the player's position" },
            { id: "lg-gps", label: "Location", detail: "Sampled to save battery" },
            { id: "lg-camera", label: "Camera catch", detail: "AR over the real world" },
            { id: "lg-native", label: "Native modules", detail: "Kotlin, Java, C/C++" },
          ],
        },
        {
          id: "lg-spawns",
          label: "Spawns",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "lg-spawn", label: "Spawn service", detail: "Rewards near each player" },
            { id: "lg-geo", label: "Geo index", detail: "Nearby lookups" },
            { id: "lg-drops", label: "Timed drops", detail: "Events in set places" },
          ],
        },
        {
          id: "lg-fair",
          label: "Fair play",
          place: { col: 2, row: 2 },
          nodes: [
            { id: "lg-spoof", label: "Location checks", detail: "Impossible speed and jumps" },
            { id: "lg-limits", label: "Catch limits", detail: "Per player and area" },
          ],
        },
        {
          id: "lg-play",
          label: "Play",
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "lg-catch", label: "Catch", detail: "Validated on the server" },
            { id: "lg-collection", label: "Collection" },
            { id: "lg-push", label: "Real time notifications" },
          ],
        },
        {
          id: "lg-rewards",
          label: "Rewards",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "lg-wallet", label: "In app wallet" },
            { id: "lg-claim", label: "Claim on chain", detail: "Confirmed from the indexer" },
          ],
        },
      ],
      edges: [
        { from: "lg-gps", to: "lg-spawn", label: "position" },
        { from: "lg-spawn", to: "lg-geo" },
        { from: "lg-spawn", to: "lg-map", label: "nearby" },
        { from: "lg-camera", to: "lg-catch" },
        { from: "lg-fair", to: "lg-catch", style: "dashed" },
        { from: "lg-catch", to: "lg-collection" },
        { from: "lg-catch", to: "lg-wallet" },
        { from: "lg-wallet", to: "lg-claim" },
      ],
    },
    wireframe: {
      device: "phone",
      screens: [
        {
          title: "Map",
          regions: [
            { kind: "bar", label: "Events nearby", size: 0.6 },
            { kind: "canvas", label: "The real map, the player and rewards nearby", size: 3 },
            { kind: "actions", label: "Collection, wallet", size: 0.8 },
          ],
        },
        {
          title: "Catch",
          regions: [
            { kind: "media", label: "Camera, with the reward over the real world", size: 3 },
            { kind: "actions", label: "Catch", size: 0.8 },
          ],
        },
        {
          title: "Reward",
          regions: [
            { kind: "card", label: "What was caught", size: 1.4 },
            { kind: "steps", label: "In the wallet, then claimed on chain" },
            { kind: "actions", label: "Claim", size: 0.8 },
          ],
        },
        {
          title: "Collection",
          regions: [
            { kind: "stat", label: "Caught so far" },
            { kind: "list", label: "Rewards by event and place", size: 2 },
          ],
        },
      ],
      decision: "Spawns and catches are decided on the server around the player's checked position, so the phone draws the game but cannot invent rewards.",
      outcome: "A game on the real map inside the app, with rewards that land in the wallet and confirm from the chain.",
    },
    journeys: [
      {
        title: "A fan on a walk",
        steps: [
          "Opens the map and sees a reward nearby",
          "Walks to it",
          "Catches it through the camera",
          "The server checks the location and the catch",
          "The reward lands in the wallet and can be claimed on chain",
        ],
      },
    ],
  },
  {
    id: "render-performance",
    tab: "Rendering",
    zone: "mmo",
    title: "Rendering at frame rate: GPU and heavy animation",
    caption: "Heavy animation on phones and desktops: one loop, sprites drawn once and reused, draws batched for the GPU, " +
      "nothing allocated per frame, and profiling that finds the frame that drops.",
    summary: {
      role: "Built profiling tools for canvas rendering, native modules for mobile and desktop, and the animation engines on this site",
      scale: "Canvas and WebGL games and interfaces on phones, tablets, desktops and launchers",
      stack: ["PixiJS", "WebGL", "Canvas", "C/C++", "Electron", "React Native", "Lighthouse", "Performance traces"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "rp-loop",
          label: "Frame loop",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "rp-raf", label: "One loop", detail: "A fixed rate, paused off screen" },
            { id: "rp-budget", label: "Frame budget", detail: "Update, then draw" },
            { id: "rp-still", label: "Reduced motion", detail: "A still frame instead" },
          ],
        },
        {
          id: "rp-assets",
          label: "Assets",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "rp-atlas", label: "Sprite and glyph atlases", detail: "Drawn once, reused" },
            { id: "rp-cache", label: "Cached glows and gradients" },
            { id: "rp-pools", label: "Object pools", detail: "Nothing allocated per frame" },
          ],
        },
        {
          id: "rp-gpu",
          label: "GPU",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "rp-batch", label: "Batched draws", detail: "WebGL through PixiJS" },
            { id: "rp-composite", label: "Transforms and opacity", detail: "Composited, never layout" },
            { id: "rp-opaque", label: "Opaque canvases", detail: "Less to blend" },
          ],
        },
        {
          id: "rp-native",
          label: "Native and tools",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "rp-modules", label: "Native modules", detail: "C/C++ for mobile and desktop" },
            { id: "rp-profiler", label: "Profiling tools", detail: "Canvas rendering" },
            { id: "rp-audits", label: "Lighthouse and traces", detail: "On every release" },
          ],
        },
      ],
      edges: [
        { from: "rp-raf", to: "rp-budget" },
        { from: "rp-loop", to: "rp-assets" },
        { from: "rp-assets", to: "rp-gpu" },
        { from: "rp-profiler", to: "rp-gpu", label: "finds the dropped frame", style: "dashed" },
      ],
    },
    journeys: [
      {
        title: "How one frame is spent",
        steps: [
          "The loop wakes at its fixed rate, or not at all off screen",
          "State updates first",
          "Cached sprites are drawn, batched for the GPU",
          "Only transforms and opacity change, so nothing reflows",
          "The rest of the frame stays idle for input",
        ],
      },
      {
        title: "Finding a dropped frame",
        steps: [
          "Profile the scene on a real low end device",
          "Find the long task in the frame",
          "Cache it, move it out of the frame or into a native module",
          "Measure again, on every release",
        ],
      },
    ],
  },
  {
    id: "goz-hardening",
    tab: "Hardening",
    zone: "mmo",
    title: "A game server, before and after hardening",
    caption: "Before, the origin answered the internet directly. After, only the CDN and expected game traffic reach it. " +
      "Anti cheat is not anti DDoS: a flood that never signs in has to be stopped before the game.",
    summary: {
      role: "Owner of the game: ran the assessment with an agent and wrote the runbook",
      scale: "A live game server under a flood of connections",
      stack: ["Cloudflare", "Firewall rules", "Windows and Linux scripts", "TLS", "Web server rules"],
    },
    architecture: {
      columns: 2,
      groups: [
        {
          id: "before",
          label: "Before",
          columns: 2,
          isExternal: true,
          place: { col: 1, row: 1 },
          nodes: [
            { id: "internet-before", label: "Internet", kind: "actor" },
            { id: "bot-flood", label: "Bot flood" },
            { id: "origin-before", label: "Origin", detail: "Every service on every interface", span: 2 },
          ],
        },
        {
          id: "after",
          label: "After",
          columns: 2,
          place: { col: 2, row: 1 },
          nodes: [
            { id: "internet-after", label: "Internet", kind: "actor" },
            { id: "game-ports", label: "Game ports", detail: "Connection throttling" },
            { id: "edge-shield", label: "CDN, WAF, rate limits", detail: "Bot challenge during floods" },
            { id: "origin-firewall", label: "Origin firewall", detail: "CDN ranges and admin only", span: 2 },
            { id: "web-tier", label: "Web tier" },
            { id: "private-tier", label: "Admin and database tier", detail: "Private interfaces only" },
            { id: "configs", label: "Config files", detail: "No longer served on the web", kind: "note", span: 2 },
          ],
        },
      ],
      edges: [
        { from: "internet-before", to: "origin-before", label: "direct", style: "dashed" },
        { from: "bot-flood", to: "origin-before" },
        { from: "internet-after", to: "edge-shield" },
        { from: "edge-shield", to: "origin-firewall" },
        { from: "game-ports", to: "origin-firewall" },
        { from: "origin-firewall", to: "web-tier" },
        { from: "origin-firewall", to: "private-tier" },
      ],
    },
  },
  {
    id: "game-launcher",
    tab: "Game launcher",
    zone: "mmo",
    title: "A Web3 game launcher and store",
    caption: "A store and developer portal on the web, a desktop launcher and a mobile app on one back end and one design " +
      "system, with the wallet held by the launcher.",
    summary: {
      role: "Proposed and built the architecture for web and desktop, and introduced and architected the mobile app",
      scale: "A store, a developer portal, a desktop launcher and a mobile app on one back end",
      stack: ["TypeScript", "React", "Next.js", "Electron", "React Native", "Node.js", "GraphQL", "PostgreSQL", "C/C++", "Storybook"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "gl-shared",
          label: "Shared",
          columns: 2,
          place: { col: 1, row: 1, colSpan: 4 },
          nodes: [
            { id: "gl-design", label: "Design system", detail: "Storybook, interaction tests" },
            { id: "gl-tooling", label: "Developer tooling", detail: "CLI, scaffolders, docs" },
          ],
        },
        {
          id: "gl-clients",
          label: "Clients",
          columns: 4,
          place: { col: 1, row: 2, colSpan: 4 },
          nodes: [
            { id: "gl-store", label: "Store website", detail: "Next.js" },
            { id: "gl-portal", label: "Developer portal" },
            { id: "gl-launcher", label: "Desktop launcher", detail: "Electron, native C/C++ modules" },
            { id: "gl-mobile", label: "Mobile app", detail: "React Native" },
          ],
        },
        {
          id: "gl-backend",
          label: "Back end",
          columns: 2,
          place: { col: 1, row: 3, colSpan: 2 },
          nodes: [
            { id: "gl-api", label: "Platform services", detail: "Node.js, GraphQL" },
            { id: "gl-db", label: "Catalogue and accounts", kind: "store" },
            { id: "gl-hosting", label: "Hosting", detail: "AWS and Vercel", span: 2 },
          ],
        },
        {
          id: "gl-play",
          label: "Play",
          columns: 2,
          place: { col: 3, row: 3, colSpan: 2 },
          nodes: [
            { id: "gl-download", label: "Download and verify" },
            { id: "gl-wallet", label: "Wallet session", detail: "EVM chains" },
            { id: "gl-game", label: "Game process", detail: "Signs through the launcher" },
            { id: "gl-contracts", label: "Smart contracts", detail: "Reviewed for attack paths" },
          ],
        },
      ],
      edges: [
        { from: "gl-shared", to: "gl-clients" },
        { from: "gl-clients", to: "gl-api" },
        { from: "gl-api", to: "gl-db" },
        { from: "gl-launcher", to: "gl-play" },
        { from: "gl-wallet", to: "gl-game" },
        { from: "gl-game", to: "gl-contracts" },
      ],
    },
    wireframe: {
      device: "phone",
      screens: [
        {
          title: "Store page",
          regions: [
            { kind: "media", label: "Cover", size: 1.6 },
            { kind: "card", label: "Description" },
            { kind: "list", label: "Chain and wallet needs" },
            { kind: "actions", label: "Install", size: 0.8 },
          ],
        },
        {
          title: "Wallet",
          regions: [
            { kind: "card", label: "The chain this game needs" },
            { kind: "form", label: "Connect a wallet", size: 1.4 },
            { kind: "actions", label: "Connect", size: 0.8 },
          ],
        },
        {
          title: "Install",
          regions: [
            { kind: "card", label: "The game" },
            { kind: "stat", label: "Download progress" },
            { kind: "list", label: "Verified files", size: 1.4 },
          ],
        },
        {
          title: "Library",
          regions: [
            { kind: "list", label: "Installed games", size: 2 },
            { kind: "card", label: "Updates" },
            { kind: "actions", label: "Play", size: 0.8 },
          ],
        },
        {
          title: "In game",
          regions: [
            { kind: "media", label: "The game", size: 2.6 },
            { kind: "bar", label: "Wallet session kept", size: 0.7 },
            { kind: "overlay", label: "Sign a transaction" },
          ],
        },
      ],
      decision: "Wallet and install live in one launcher, so a Web3 game is one click away instead of three tools.",
      outcome: "The same flow on web, desktop and mobile with one design system, and native modules and profiling cut memory use and load times.",
    },
    journeys: [
      {
        title: "A player, from store to playing",
        steps: [
          "Finds a game in the store",
          "Connects a wallet, told which chain the game needs",
          "Installs it inside the launcher",
          "Plays, and the game signs transactions through the launcher's wallet session",
        ],
      },
    ],
  },
];

export default blueprints;
