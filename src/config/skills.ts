// Other names a skill goes by in the stacks of my roles and projects, so the forge can find its evidence.
export const SKILL_ALIASES: Record<string, string[]> = {
  "SQL": ["PostgreSQL", "MariaDB", "SQL"],
  "NoSQL": ["MongoDB", "Redis"],
  // Writing React, Vue, Node.js, Backbone or jQuery is writing JavaScript, and front end frameworks mean HTML and CSS.
  "Javascript": ["JS", "JavaScript", "React", "Vue.js", "Node.js", "Backbone.js", "JQuery"],
  "HTML / CSS": ["HTML", "CSS", "SASS", "React", "Vue.js", "Web Development"],
  "LESS / SASS": ["SASS"],
  // PixiJS draws through WebGL onto a canvas, so every PixiJS role counts for both.
  "Canvas": ["HTML5 Canvas", "Native Canvas", "WebGL & Canvas", "PixiJS"],
  "WebGL": ["WebGL & Canvas", "PixiJS"],
  "State Management": ["Redux", "Redux Observables", "RxJS", "Zustand", "Recoil"],
  "C#, .NET": ["C#", "C# (ASP.NET)"],
  "TheGraph": ["The Graph Protocol"],
  "Vercel": ["Vercel Enterprise"],
  "Ethers.js": ["Ethers"],
  "draw.io / C4 model": ["C4 model"],
  "Automated Testing (unit, integration, end to end)": ["Automated Testing", "Software Test Automation"],
  "Google Analytics 4": ["GA4"],
  "Tailwind CSS": ["Tailwind", "Tailwind v4"],
  "Visual Studio 2003-2022": ["Visual Studio"],
  "Oracle OCI Procurement": ["Oracle OCI"],
  "SAP (customer master data)": ["SAP Ariba"],
  "Claude Code Max CLI": ["Claude Code"],
  "Strapi": ["Strapi v5"],
};

// Names not to look for in prose: "Git" would match "git-diff" in a sentence about a readout, and Laravel and
// Symfony are named as the inspiration for a framework of my own, not as something I used there.
export const SKILL_MENTION_EXCLUDE = ["Git", "Laravel", "Symfony"];

// When each tool first shipped publicly. A role that began earlier counts it only from then, so a stack
// that grew over a long role never credits a tool before it existed.
export const SKILL_RELEASES: Record<string, string> = {
  "Cloudflare": "Sep 2010",
  // The company began in 2011; its cloud servers launched in January 2013.
  "Digital Ocean": "Jan 2013",
  "Laravel": "Jun 2011",
  "Stripe": "Sep 2011",
  "Typescript": "Oct 2012",
  "React": "May 2013",
  "Docker": "Mar 2013",
  "Electron": "Jul 2013",
  "Vue": "Feb 2014",
  "Jest": "May 2014",
  "Swift": "Jun 2014",
  "GKE / Kubernetes": "Jun 2014",
  "React Native": "Mar 2015",
  "Rust": "May 2015",
  "Solidity": "Aug 2015",
  "Graphql": "Sep 2015",
  "Strapi": "Oct 2015",
  "Vercel": "Nov 2015",
  "Helm": "Nov 2015",
  "Kotlin": "Feb 2016",
  "Storybook": "Apr 2016",
  "Figma": "Sep 2016",
  "NextJs": "Oct 2016",
  "Nuxt / Nuxt 4": "Oct 2016",
  "Svelte": "Nov 2016",
  "NestJS": "Feb 2017",
  "Flutter": "May 2017",
  "Istio": "May 2017",
  "pnpm": "Jun 2017",
  "Cloudflare Workers": "Sep 2017",
  "Tailwind CSS": "Nov 2017",
  "TensorFlow": "Nov 2015",
  "PyTorch": "Sep 2016",
  "Playwright": "Jan 2020",
  "Supabase": "Jan 2020",
  "Railway": "Jan 2020",
  "Radix UI": "Dec 2020",
  "Turborepo": "Dec 2021",
  "ChatGPT / GPT-4": "Nov 2022",
  "shadcn-vue / shadcn-ui": "Mar 2023",
};

// Where I remember first using a tool later than a long role's start, the year it really began.
export const SKILL_FIRST_USED: Record<string, string> = {
  Laravel: "Jan 2018",
  // The earliest use on record is KPMG; my own products came after, so nothing counts before it.
  PyTorch: "Feb 2019",
};

// Which skill groups are forge stations, in order. Languages and team skills are talents instead.
export const FORGE_STATIONS = [
  "programming", "frontend", "backend", "mobile", "blockchain", "cloud", "cms", "tools", "testing", "integrations", "observability", "ai", "design",
] as const;

export const skillStationId = (title: string) => `section-skills-${title.replace(/[^a-zA-Z0-9]/g, "")}`;
