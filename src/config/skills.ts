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

// Names too ambiguous to look for in prose: "Git" would match "git-diff" in a sentence about a readout.
export const SKILL_MENTION_EXCLUDE = ["Git"];

// Which skill groups are forge stations, in order. Languages and team skills are talents instead.
export const FORGE_STATIONS = [
  "programming", "frontend", "backend", "mobile", "blockchain", "cloud", "cms", "tools", "testing", "integrations", "observability", "ai", "design",
] as const;

export const skillStationId = (title: string) => `section-skills-${title.replace(/[^a-zA-Z0-9]/g, "")}`;
