import { Blueprint, VentureBlueprintId } from "@/types/blueprints";

// My own ventures, named in their map dialogs. Every drawing is a glance, not the full design.

export const GOZ_BLUEPRINT: Blueprint = {
  id: "goz-engine",
  tab: "MMORPG",
  zone: "mmo",
  title: "An MMORPG, from engine to live operations",
  caption: "My own game, built from scratch: the engine and the servers in C/C++ with my own framework and physics, Boost " +
    "and ACE as general libraries, and the web, payments and operations around them, on OVH and DigitalOcean servers set up by hand.",
  summary: {
    role: "Founder, CEO and CTO: built the engine and servers from scratch, then the launcher, payments, operations and marketing",
    scale: "8M+ registered accounts, and 50k active players at its peak, before mobile games took the share",
    stack: [
      "C/C++", "Own engine and framework", "Own physics", "Boost and ACE libraries", "Lua", "Python", "C#", "Laravel", "Vue", "WordPress",
      "Stripe", "PayPal", "OVH", "DigitalOcean", "Cloudflare",
    ],
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "goz-players",
        label: "Players",
        place: { col: 1, row: 1, rowSpan: 2 },
        nodes: [
          { id: "goz-launcher", label: "Launcher", detail: "C#, a minimal installer that fetches the game on first launch" },
          { id: "goz-client", label: "Game client", detail: "Own engine, framework and physics in C/C++" },
          { id: "goz-anticheat", label: "Anti tamper", detail: "Client checks, and accounts and inventory guarded on the server" },
          { id: "goz-crypto", label: "Own cryptography", detail: "And compression on the wire", kind: "note" },
        ],
      },
      {
        id: "goz-growth",
        label: "Growth",
        place: { col: 1, row: 3 },
        nodes: [
          { id: "goz-campaigns", label: "Paid campaigns", detail: "Facebook, YouTube, Twitch, Reddit, Instagram" },
          { id: "goz-landing", label: "Chapter landing pages", detail: "Sign ups before each launch" },
          { id: "goz-merch", label: "Merchandise store", detail: "Shopify" },
        ],
      },
      {
        id: "goz-edge",
        label: "Edge",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "goz-cdn", label: "CDN and WAF", detail: "Website and patches" },
          { id: "goz-firewall", label: "Origin firewall", detail: "Game ports throttled, floods filtered" },
        ],
      },
      {
        id: "goz-web",
        label: "Web, on DigitalOcean",
        place: { col: 2, row: 2, rowSpan: 2 },
        nodes: [
          { id: "goz-site", label: "Website and accounts", detail: "Laravel and Vue" },
          { id: "goz-news", label: "News and events", detail: "WordPress as the content source" },
          { id: "goz-payments", label: "Payments", detail: "Stripe and PayPal, purchases and subscriptions" },
          { id: "goz-shop", label: "Item shop", detail: "Packs, codes and purchase history" },
          { id: "goz-patches", label: "Patch distribution", detail: "Only what changed" },
        ],
      },
      {
        id: "goz-game",
        label: "Game services, on OVH dedicated servers, built from scratch for low latency",
        place: { col: 3, row: 1, rowSpan: 3 },
        nodes: [
          { id: "goz-auth", label: "Auth server", detail: "Login throttling" },
          { id: "goz-gate", label: "Gate", detail: "Sessions, channels and routing" },
          { id: "goz-world", label: "World servers", detail: "One per channel and map, Lua and Python scripts, added as players grow" },
          { id: "goz-dungeons", label: "Dungeon instances", detail: "A copy per party, bosses and group loot" },
          { id: "goz-social", label: "Guilds, parties and chat" },
          { id: "goz-market", label: "Auction and exchange", detail: "Player trading, checked on the server" },
          { id: "goz-events", label: "Event scheduler", detail: "Holiday and anniversary events" },
          { id: "goz-data", label: "Data server", detail: "Cache in front of saves, writes batched" },
          { id: "goz-logs", label: "Log server", detail: "Every trade, drop and purchase" },
          { id: "goz-admin", label: "Admin server", detail: "Private interface only" },
          { id: "goz-scale", label: "Scales out", detail: "More channels and world servers on more machines, with the gate spreading players", kind: "note" },
        ],
      },
      {
        id: "goz-ops",
        label: "Operations",
        place: { col: 4, row: 1 },
        nodes: [
          { id: "goz-gm", label: "Game master panel" },
          { id: "goz-moderation", label: "Moderation tools" },
          { id: "goz-analytics", label: "Analytics dashboards" },
          { id: "goz-support", label: "Player support" },
        ],
      },
      {
        id: "goz-storage",
        label: "Storage",
        place: { col: 4, row: 2 },
        nodes: [
          { id: "goz-db", label: "Game database", detail: "Accounts, characters, items", kind: "store" },
          { id: "goz-webdb", label: "Web database", kind: "store" },
          { id: "goz-logdb", label: "Logs", kind: "store" },
        ],
      },
      {
        id: "goz-infra",
        label: "Infrastructure, run by hand",
        place: { col: 4, row: 3 },
        nodes: [
          { id: "goz-servers", label: "Servers set up from scratch", detail: "No managed cloud: OS, network and hardening" },
          { id: "goz-backups", label: "Backups", detail: "Kept off the game servers" },
          { id: "goz-builds", label: "Build and patch pipeline", detail: "Client, servers and launcher" },
        ],
      },
    ],
    edges: [
      { from: "goz-launcher", to: "goz-cdn", label: "patches" },
      { from: "goz-launcher", to: "goz-client" },
      { from: "goz-client", to: "goz-firewall", label: "encrypted" },
      { from: "goz-firewall", to: "goz-auth" },
      { from: "goz-auth", to: "goz-gate" },
      { from: "goz-gate", to: "goz-world" },
      { from: "goz-world", to: "goz-dungeons" },
      { from: "goz-world", to: "goz-data" },
      { from: "goz-data", to: "goz-db" },
      { from: "goz-logs", to: "goz-logdb" },
      { from: "goz-campaigns", to: "goz-landing" },
      { from: "goz-landing", to: "goz-site" },
      { from: "goz-site", to: "goz-payments" },
      { from: "goz-payments", to: "goz-data", label: "items delivered" },
      { from: "goz-site", to: "goz-webdb" },
      { from: "goz-builds", to: "goz-patches" },
      { from: "goz-gm", to: "goz-admin" },
      { from: "goz-moderation", to: "goz-world" },
      { from: "goz-analytics", to: "goz-logdb" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "Launcher",
        regions: [
          { kind: "media", label: "News and events", size: 2 },
          { kind: "stat", label: "First launch downloads the game, later ones patch it" },
          { kind: "actions", label: "Play starts the client; account, store, language" },
        ],
      },
      {
        title: "Login and character select",
        regions: [
          { kind: "list", label: "Server pick" },
          { kind: "form", label: "Login, with a throttle notice" },
          { kind: "card", label: "Characters with class and level", size: 1.5 },
          { kind: "actions", label: "Create character" },
        ],
      },
      {
        title: "In game",
        regions: [
          { kind: "bar", label: "Character bars, minimap" },
          { kind: "canvas", label: "The world", size: 3 },
          { kind: "actions", label: "Skill bar and chat tabs" },
        ],
      },
      {
        title: "Web account and shop",
        regions: [
          { kind: "stat", label: "Balance and subscription" },
          { kind: "list", label: "Item packs with price", size: 1.5 },
          { kind: "actions", label: "Buy through a hosted payment page" },
          { kind: "list", label: "Purchase history, redeem a code" },
        ],
      },
    ],
    decision: "Patching, payments, moderation and support all run through tools I built, so a very small team could run a live game for years.",
    outcome: "Started in 2015 and still patched today, with 8M+ registered accounts and 50k active players at its peak.",
  },
  journeys: [
    {
      title: "A new player",
      steps: [
        "Lands on the website and downloads the minimal installer",
        "The first launch downloads the game, and Play starts the client",
        "Creates an account and picks a server",
        "Creates a character and plays the tutorial and the first quest",
        "Meets the shop at a natural point, not at the door",
      ],
    },
    {
      title: "A returning player after a patch",
      steps: [
        "The launcher sees the new version and patches only what changed",
        "Plays, and an in game notice says what is new",
        "Joins the event the patch brought",
      ],
    },
  ],
};

export const AMW_BLUEPRINT: Blueprint = {
  id: "amw-social",
  tab: "Social network",
  zone: "mmo",
  title: "A social network with an economy and an RPG",
  caption: "A social network for anime, manga, cosplay and gaming fans: a feed with videos, diaries, guilds and ship " +
    "crews, anime to watch and manga to read as a real book, a wiki, forums and chat, and a character of your own, all on one currency earned by taking part.",
  summary: {
    role: "Founder, CEO and CTO: proposed and built the product, my own PHP and JS frameworks, the game engine and the economy, and ran the community",
    scale: "10M+ registered, 3M+ active, on servers I ran by hand and tuned to the bone",
    stack: ["PHP", "My own PHP framework", "My own JS framework", "Python", "JavaScript", "jQuery", "Backbone", "WebGL and Canvas", "PayPal"],
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "amw-client",
        label: "Browser",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "amw-ui", label: "Web app", detail: "On my own JS framework" },
          { id: "amw-gfx", label: "Canvas and WebGL", detail: "Characters and scenes" },
          { id: "amw-notify", label: "Notifications", detail: "Mini messages on activity" },
        ],
      },
      {
        id: "amw-web",
        label: "Servers run by hand, on OVH and partly DigitalOcean",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "amw-regions", label: "Servers per region", detail: "Switched by hand: no load balancers back then" },
          { id: "amw-php", label: "PHP application", detail: "On my own PHP framework, in the spirit of Laravel and Symfony, tuned to the bone" },
          { id: "amw-py", label: "Python services", detail: "Feeds and jobs" },
          { id: "amw-chat", label: "Chat channels", detail: "World chat and language chats" },
        ],
      },
      {
        id: "amw-content",
        label: "Content",
        place: { col: 3, row: 1 },
        nodes: [
          { id: "amw-animebook", label: "AnimeBook", detail: "Friends, timeline, diary, sharing" },
          { id: "amw-anime", label: "Anime and video streaming", detail: "Fillers marked, skippable" },
          { id: "amw-manga", label: "Manga reader", detail: "Read as a real book" },
          { id: "amw-community", label: "Wiki, forums and galleries" },
        ],
      },
      {
        id: "amw-data",
        label: "Data",
        place: { col: 4, row: 1, rowSpan: 2 },
        nodes: [
          { id: "amw-db", label: "Relational database", kind: "store" },
          { id: "amw-cache", label: "Cache", kind: "store" },
          { id: "amw-media", label: "Media storage", detail: "Artwork, cosplay, video" },
        ],
      },
      {
        id: "amw-engine",
        label: "Game side",
        columns: 2,
        place: { col: 1, row: 2, colSpan: 2 },
        nodes: [
          { id: "amw-gameengine", label: "Game engine in PHP", detail: "Battles, levels and drops, on my own framework" },
          { id: "amw-hardening", label: "Security in the framework", detail: "PHP's usual loopholes closed once, for every page", kind: "note" },
        ],
      },
      {
        id: "amw-economy",
        label: "Economy",
        place: { col: 3, row: 2 },
        nodes: [
          { id: "amw-berries", label: "Berries", detail: "Earned by taking part, not bought" },
          { id: "amw-shop", label: "Shop and rank upgrades" },
          { id: "amw-auction", label: "Auction house" },
          { id: "amw-enhance", label: "Item enhancement", detail: "Any item, no limit" },
          { id: "amw-characters", label: "Characters", detail: "Hybrid classes across anime, random elements" },
          { id: "amw-ships", label: "Crew ships", detail: "Levelled for stat bonuses" },
        ],
      },
    ],
    edges: [
      { from: "amw-ui", to: "amw-regions" },
      { from: "amw-regions", to: "amw-php" },
      { from: "amw-php", to: "amw-content" },
      { from: "amw-php", to: "amw-economy" },
      { from: "amw-php", to: "amw-db" },
      { from: "amw-py", to: "amw-cache" },
      { from: "amw-content", to: "amw-media" },
      { from: "amw-gfx", to: "amw-gameengine" },
      { from: "amw-gameengine", to: "amw-economy", label: "drops and berries" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "AnimeBook",
        regions: [
          { kind: "list", label: "Posts, videos, artwork and forum activity", size: 2.2 },
          { kind: "card", label: "Friends and notifications" },
          { kind: "card", label: "Auctions ending soon" },
        ],
      },
      {
        title: "Diary",
        regions: [
          { kind: "form", label: "A new timeline entry, and who can read it" },
          { kind: "list", label: "Entries by date, with comments and favourites", size: 2 },
        ],
      },
      {
        title: "Guild and ship crew",
        regions: [
          { kind: "media", label: "Crew banner and flag" },
          { kind: "list", label: "Members and their roles" },
          { kind: "steps", label: "The crew's ship, levelled for stat bonuses" },
          { kind: "actions", label: "Join or leave" },
        ],
      },
      {
        title: "Read manga",
        regions: [
          { kind: "canvas", label: "The page, turned like a real book", size: 2.4 },
          { kind: "bar", label: "Chapter and progress" },
          { kind: "actions", label: "Previous page, next page, chapters" },
        ],
      },
      {
        title: "Watch anime",
        regions: [
          { kind: "media", label: "The episode", size: 2.4 },
          { kind: "bar", label: "Skip fillers: on" },
          { kind: "list", label: "Episodes, fillers marked" },
        ],
      },
      {
        title: "Wiki and forums",
        regions: [
          { kind: "bar", label: "Search the wiki" },
          { kind: "list", label: "Articles and forum threads", size: 2 },
          { kind: "card", label: "World chat" },
        ],
      },
      {
        title: "Build your character",
        regions: [
          { kind: "canvas", label: "Your character, mixed from many anime", size: 2 },
          { kind: "list", label: "Classes and abilities, hybrids allowed, a random element" },
          { kind: "steps", label: "Level, with no cap" },
        ],
      },
      {
        title: "Items and berries",
        regions: [
          { kind: "stat", label: "Berries balance" },
          { kind: "list", label: "Inventory, each item enhanceable without limit", size: 1.4 },
          { kind: "list", label: "Ways to earn: posting, reading, watching, taking part" },
          { kind: "actions", label: "Enhance, sell at auction, buy, upgrade rank" },
        ],
      },
    ],
    decision: "Every way of taking part earned berries, and berries bought items, enhancements, auction lots and rank upgrades, so being active was the game.",
    outcome: "10M+ registered and 3M+ active, on frameworks and servers I built and ran myself.",
  },
  journeys: [
    {
      title: "A fan's evening",
      steps: [
        "Watches an episode, skipping the fillers",
        "Reads the next manga chapter as a real book",
        "Writes a diary entry and posts to the crew",
        "Earns berries for all of it",
        "Enhances a piece of gear for a character mixed from different anime",
      ],
    },
    {
      title: "A creator",
      steps: [
        "Uploads a drawing or a video",
        "Earns berries from comments, favourites and shares",
        "Lists an item at the auction house",
        "Spends the proceeds on a rank upgrade",
      ],
    },
  ],
};

// Past ventures, kept undated on purpose. What they did comes from my own description; no stack is on record,
// so none is shown.
const PAST_SCALE = "A past venture, launched and closed for lack of funding";

export const ARCAVIUM_BLUEPRINT: Blueprint = {
  id: "low-code-game-builder",
  tab: "Game builder",
  zone: "mmo",
  title: "A low code game builder",
  caption: "Build a whole game, its client and its server, by choosing from menus and uploading models, write classes in " +
    "several languages only where you want to, and let the platform host and run the rest.",
  summary: {
    role: "Founder, CEO and CTO: proposed the product and its architecture, and built it",
    scale: PAST_SCALE,
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "ar-creator",
        label: "Creator",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "ar-builder", label: "Builder", detail: "Menus and dropdowns, no code" },
          { id: "ar-assets", label: "Model upload", detail: "Models and assets" },
          { id: "ar-code", label: "Custom classes", detail: "In several languages, when needed" },
        ],
      },
      {
        id: "ar-pipeline",
        label: "Build pipeline",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "ar-definition", label: "Game definition", detail: "Everything the menus chose" },
          { id: "ar-generator", label: "Generator", detail: "Client and server from one definition" },
          { id: "ar-runtimes", label: "Language runtimes", detail: "Custom classes run safely" },
        ],
      },
      {
        id: "ar-game",
        label: "The game",
        place: { col: 3, row: 1 },
        nodes: [
          { id: "ar-client", label: "Game client", detail: "The interface players see" },
          { id: "ar-server", label: "Game server", detail: "Rules, state and players" },
        ],
      },
      {
        id: "ar-run",
        label: "Run for the creator",
        place: { col: 4, row: 1 },
        nodes: [
          { id: "ar-hosting", label: "Hosting", detail: "Handled by the platform" },
          { id: "ar-updates", label: "Updates", detail: "Rebuilt and shipped on every change" },
          { id: "ar-players", label: "Players", kind: "actor" },
        ],
      },
    ],
    edges: [
      { from: "ar-builder", to: "ar-definition" },
      { from: "ar-assets", to: "ar-definition" },
      { from: "ar-code", to: "ar-runtimes" },
      { from: "ar-definition", to: "ar-generator" },
      { from: "ar-generator", to: "ar-game" },
      { from: "ar-runtimes", to: "ar-server" },
      { from: "ar-game", to: "ar-run" },
    ],
  },
  wireframe: {
    device: "desktop",
    screens: [
      {
        title: "Builder",
        regions: [
          { kind: "bar", label: "Game name and publish state", area: "header" },
          { kind: "list", label: "Scenes, characters, items, rules", area: "left" },
          { kind: "canvas", label: "Live preview", area: "main" },
          { kind: "form", label: "Properties, all from dropdowns", area: "right" },
          { kind: "actions", label: "Upload a model, add code, publish", area: "footer" },
        ],
      },
      {
        title: "Custom code",
        regions: [
          { kind: "bar", label: "Pick a language" },
          { kind: "form", label: "A class, hooked to a game event", size: 2.2 },
          { kind: "bar", label: "Runs on the game server" },
        ],
      },
      {
        title: "Publish",
        regions: [
          { kind: "steps", label: "Build client and server, host, go live" },
          { kind: "stat", label: "Players online" },
          { kind: "actions", label: "Update, roll back" },
        ],
      },
    ],
    decision: "One game definition, built from menu choices, generates both the client and the server, so creators never " +
      "wire the two by hand, and code is an option, never a requirement.",
    outcome: "It let creators build and run a full game without writing an engine or managing servers. It launched, and closed for lack of funding.",
  },
  journeys: [
    {
      title: "A creator ships a game",
      steps: [
        "Sets the game up from menus",
        "Uploads the models",
        "Adds a class in their own language for one special rule",
        "Publishes, and the platform builds and hosts the client and the server",
        "Players join",
      ],
    },
  ],
};

export const ADOTTA_BLUEPRINT: Blueprint = {
  id: "donations-rewards",
  zone: "mmo",
  title: "Donations to shelters that earn points",
  caption: "Donors give to animal shelters and earn points they can spend wherever partners accept them.",
  summary: {
    role: "Founder and CTO: proposed the product and built it",
    scale: PAST_SCALE,
  },
  architecture: {
    columns: 3,
    groups: [
      {
        id: "ad-donors",
        label: "Donors",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "ad-app", label: "Donor app" },
          { id: "ad-shelters", label: "Shelter profiles", detail: "And what each needs" },
        ],
      },
      {
        id: "ad-core",
        label: "Core",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "ad-donations", label: "Donations" },
          { id: "ad-points", label: "Points ledger", detail: "Earned with every donation" },
          { id: "ad-redeem", label: "Redemption", detail: "Wherever partners accept them" },
        ],
      },
      {
        id: "ad-partners",
        label: "Outside",
        isExternal: true,
        place: { col: 3, row: 1 },
        nodes: [
          { id: "ad-payments", label: "Payment provider" },
          { id: "ad-shelter-side", label: "Shelters", detail: "Receive the donations" },
          { id: "ad-partner", label: "Partner businesses", detail: "Accept the points" },
        ],
      },
    ],
    edges: [
      { from: "ad-app", to: "ad-donations" },
      { from: "ad-donations", to: "ad-payments" },
      { from: "ad-donations", to: "ad-shelter-side" },
      { from: "ad-donations", to: "ad-points" },
      { from: "ad-points", to: "ad-redeem" },
      { from: "ad-redeem", to: "ad-partner" },
    ],
  },
  wireframe: {
    device: "phone",
    screens: [
      {
        title: "Shelters",
        regions: [
          { kind: "bar", label: "Near you", size: 0.6 },
          { kind: "list", label: "Shelters and what they need", size: 2.4 },
        ],
      },
      {
        title: "Donate",
        regions: [
          { kind: "card", label: "The shelter" },
          { kind: "stat", label: "Amount" },
          { kind: "form", label: "Payment" },
          { kind: "actions", label: "Donate", size: 0.8 },
        ],
      },
      {
        title: "Points",
        regions: [
          { kind: "stat", label: "Points balance" },
          { kind: "list", label: "Earned per donation", size: 1.6 },
        ],
      },
      {
        title: "Spend",
        regions: [
          { kind: "list", label: "Partners that accept points", size: 1.8 },
          { kind: "actions", label: "Redeem", size: 0.8 },
        ],
      },
    ],
    decision: "Every donation earns points that partners accept, so giving to a shelter also comes back to the donor as value.",
    outcome: "It launched to donors, shelters and partners, and closed for lack of funding.",
  },
  journeys: [
    {
      title: "A donor",
      steps: ["Finds a shelter and sees what it needs", "Donates", "Earns points", "Spends them with a partner"],
    },
  ],
};

export const PUNTI_BLUEPRINT: Blueprint = {
  id: "loyalty-service",
  zone: "mmo",
  title: "Loyalty as a service",
  caption: "A ready loyalty scheme for online shops, physical outlets and restaurants, so a business never builds or maintains its own app.",
  summary: {
    role: "Founder and CTO: proposed the product and built it",
    scale: "A past venture against established competition, launched and closed for lack of funding",
  },
  architecture: {
    columns: 3,
    groups: [
      {
        id: "pu-customers",
        label: "Customers",
        place: { col: 1, row: 1 },
        nodes: [
          { id: "pu-app", label: "One app", detail: "Every business in one wallet" },
          { id: "pu-scan", label: "Earn", detail: "At the till or online" },
        ],
      },
      {
        id: "pu-core",
        label: "Platform",
        place: { col: 2, row: 1 },
        nodes: [
          { id: "pu-rules", label: "Earning rules", detail: "Set by each business" },
          { id: "pu-ledger", label: "Points ledger" },
          { id: "pu-rewards", label: "Rewards and redemption" },
        ],
      },
      {
        id: "pu-business",
        label: "Businesses",
        isExternal: true,
        place: { col: 3, row: 1 },
        nodes: [
          { id: "pu-dashboard", label: "Business dashboard", detail: "Rules and rewards, no app to build" },
          { id: "pu-outlets", label: "Shops, outlets and restaurants" },
        ],
      },
    ],
    edges: [
      { from: "pu-scan", to: "pu-ledger" },
      { from: "pu-rules", to: "pu-ledger", style: "dashed" },
      { from: "pu-ledger", to: "pu-rewards" },
      { from: "pu-dashboard", to: "pu-rules" },
      { from: "pu-outlets", to: "pu-scan", style: "dashed" },
    ],
  },
  wireframe: {
    device: "phone",
    screens: [
      {
        title: "My places",
        regions: [
          { kind: "stat", label: "Points across every place" },
          { kind: "list", label: "Businesses I collect with", size: 2 },
        ],
      },
      {
        title: "A business",
        regions: [
          { kind: "stat", label: "My points here" },
          { kind: "list", label: "Rewards I can get", size: 1.6 },
        ],
      },
      {
        title: "Earn",
        regions: [
          { kind: "media", label: "Code to scan at the till", size: 2 },
          { kind: "bar", label: "Points added", size: 0.7 },
        ],
      },
      {
        title: "Redeem",
        regions: [
          { kind: "card", label: "The reward", size: 1.4 },
          { kind: "actions", label: "Redeem", size: 0.8 },
        ],
      },
    ],
    decision: "One app for every business, so customers carry one loyalty wallet and a business joins without building anything.",
    outcome: "It launched for shops, outlets and restaurants against established competition, and closed for lack of funding.",
  },
  journeys: [
    {
      title: "A customer",
      steps: ["Scans at a restaurant", "Collects points with every visit", "Redeems a reward", "Uses the same app at the next shop"],
    },
    {
      title: "A business",
      steps: ["Signs up", "Sets its earning rules and rewards", "Starts rewarding customers without building an app"],
    },
  ],
};

// The venture blueprints by id, for the map dialogs that load them on demand.
export const CRYPTO_CASINO_BLUEPRINT: Blueprint = {
  id: "crypto-casino",
  zone: "casino",
  title: "A crypto casino and sportsbook",
  caption: "Games aggregated from many studios, a sportsbook with live odds, bonuses and tournaments, and crypto deposits and " +
    "withdrawals on several chains, all on one balance and one ledger, built to scale out.",
  summary: {
    role: "Founder, CEO and CTO: proposed the product and built it in full",
    scale: "A past venture, built for scale and ready to launch, held back only by licensing",
  },
  architecture: {
    columns: 4,
    groups: [
      {
        id: "cc-players",
        label: "Players",
        place: { col: 1, row: 1, rowSpan: 2 },
        nodes: [
          { id: "cc-lobby", label: "Casino lobby", detail: "Slots, tables and live games" },
          { id: "cc-sports", label: "Sportsbook", detail: "Pre match and live" },
          { id: "cc-cashier", label: "Crypto cashier", detail: "Deposit and withdraw on several chains" },
          { id: "cc-promos", label: "Promotions", detail: "Bonuses and tournaments" },
        ],
      },
      {
        id: "cc-core",
        label: "Platform core",
        place: { col: 2, row: 1, rowSpan: 2 },
        nodes: [
          { id: "cc-accounts", label: "Player accounts" },
          { id: "cc-balance", label: "One balance", detail: "Casino, sports and bonuses together" },
          { id: "cc-bonus", label: "Bonus engine", detail: "Wagering tracked across games" },
          { id: "cc-tournaments", label: "Tournaments", detail: "Leaderboards and prizes" },
        ],
      },
      {
        id: "cc-games",
        label: "Games and sports",
        place: { col: 3, row: 1 },
        nodes: [
          { id: "cc-aggregator", label: "Game aggregator", detail: "Many studios behind one integration" },
          { id: "cc-odds", label: "Odds feed", detail: "Live prices" },
          { id: "cc-settle", label: "Bet acceptance and settlement" },
        ],
      },
      {
        id: "cc-chain",
        label: "Crypto rails",
        place: { col: 3, row: 2 },
        nodes: [
          { id: "cc-addresses", label: "Deposit addresses", detail: "One per player and chain" },
          { id: "cc-watchers", label: "Chain watchers", detail: "Confirmations credit the balance" },
          { id: "cc-withdraw", label: "Withdrawal queue", detail: "Checked, then signed and sent" },
        ],
      },
      {
        id: "cc-records",
        label: "Records",
        place: { col: 4, row: 1 },
        nodes: [
          { id: "cc-ledger", label: "Ledger", detail: "Every movement, balanced", kind: "store" },
          { id: "cc-backoffice", label: "Back office" },
        ],
      },
      {
        id: "cc-scale",
        label: "Built to scale",
        place: { col: 4, row: 2 },
        nodes: [
          { id: "cc-stateless", label: "Stateless services", detail: "More instances as traffic grows" },
          { id: "cc-queue", label: "Event queue", detail: "Bets, credits and payouts never block each other" },
        ],
      },
    ],
    edges: [
      { from: "cc-lobby", to: "cc-aggregator" },
      { from: "cc-sports", to: "cc-settle" },
      { from: "cc-odds", to: "cc-settle" },
      { from: "cc-aggregator", to: "cc-balance", label: "debit, credit" },
      { from: "cc-settle", to: "cc-balance" },
      { from: "cc-promos", to: "cc-bonus" },
      { from: "cc-tournaments", to: "cc-bonus" },
      { from: "cc-bonus", to: "cc-balance" },
      { from: "cc-cashier", to: "cc-addresses" },
      { from: "cc-watchers", to: "cc-balance" },
      { from: "cc-balance", to: "cc-withdraw" },
      { from: "cc-balance", to: "cc-ledger" },
    ],
  },
  journeys: [
    {
      title: "A player's first deposit",
      steps: [
        "Opens the cashier and picks a coin and a chain",
        "Sends to their own deposit address",
        "The chain watcher sees the confirmations and credits the balance",
        "Plays a slot from one studio and a live game from another on the same balance",
      ],
    },
    {
      title: "A withdrawal",
      steps: ["Asks to withdraw", "The request is checked against the ledger", "It is signed and sent on chain", "The ledger closes the movement"],
    },
  ],
};

export const VENTURE_BLUEPRINTS: Record<VentureBlueprintId, Blueprint> = {
  goz: GOZ_BLUEPRINT,
  amw: AMW_BLUEPRINT,
  arcavium: ARCAVIUM_BLUEPRINT,
  adotta: ADOTTA_BLUEPRINT,
  punti: PUNTI_BLUEPRINT,
  casino: CRYPTO_CASINO_BLUEPRINT,
};
