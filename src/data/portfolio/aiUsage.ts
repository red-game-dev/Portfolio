import {
  faFileLines,
  faRobot,
  faShieldCheck,
  faUserCheck,
} from "@fortawesome/pro-duotone-svg-icons";

import { PortfolioData } from "@/types/portfolio";

// How I use AI day to day.
export const aiUsageContent: Pick<PortfolioData, "aiUsage"> = {
  aiUsage: {
    screen: {
      message: ["33,000+ prompts", "on one machine", "Feb to Oct 2026"],
      label: "At least 33,000 prompts to my main coding agent on one machine alone, February to October 2026. ChatGPT, Gemini, " +
        "other tools, other machines and earlier years are not counted, so the real total is several times higher.",
    },
    mix: {
      title: "AI is in the loop on all of it",
      description: [
        "Where 33,000+ prompts went, on one machine, February to October 2026.",
      ],
      tasks: [
        { name: "Feature implementation and coding", count: 7916 },
        { name: "Code review, PRs and git", count: 3428 },
        { name: "Debugging and fixing", count: 3085 },
        { name: "Docs, stakeholder updates and decks", count: 2847 },
        { name: "Deploys, infrastructure and migrations", count: 2248 },
        { name: "Data, analytics and research", count: 1791 },
        { name: "Testing and verification", count: 1486 },
        { name: "Architecture and planning", count: 1368 },
        { name: "Security and compliance", count: 1087 },
      ],
      notes: [
        `Counts come from sorting prompt text by keyword, so they are approximate floors. A prompt can count in more than one row,
        so the rows do not add up to the total.`,
        `About half of all prompts are short steering turns like "continue" or "recheck", which sit outside these rows. The count
        is one coding agent on one machine since February 2026. ChatGPT (much of my architecture research and stakeholder writing),
        Gemini, other tools, other machines and the years before are not in it, so the real total is several times higher.`,
        `The mix moves with the work: architecture and consulting lean towards docs and stakeholder updates, and a verification
        heavy branch leans towards testing on the deployed build.`,
      ],
    },
    budget: {
      title: "Tokens as a budget",
      description: [
        `I treat tokens as a budget. About 96% of the input in my agent sessions is served from cache, small models do the searching
        while large models make the decisions, and agent runs are capped and resumed instead of relaunched.`,
      ],
      figures: [
        { value: "96%", label: "of input tokens served from the prompt cache" },
        { value: "53M+", label: "output tokens" },
        { value: "8", label: "models across three tiers" },
      ],
      tiersTitle: "Output by model tier, roughly: the right model per task, mostly the largest",
      shareLabel: "{name}, about {share}%",
      tiers: [
        { name: "Largest tier", share: 85, detail: "Design, review and long implementation work" },
        { name: "Middle tier", share: 8 },
        { name: "Newer top model", share: 5 },
        { name: "Smallest tier", share: 2, detail: "Search, gathering and audits" },
      ],
      practicesTitle: "How the budget holds",
      practices: [
        "Large models for design and review judgement, small models at low effort for search, gathering and audits",
        "Multi agent runs capped at about five agents and run one at a time, after one 59 agent run used a whole session quota",
        "A stopped agent is resumed, not relaunched, so it does not read everything again",
        "No builds or type checks after every edit and none inside subagents: verification runs once, before a push",
        "Trimmed transcripts, digests and search, so old context costs nothing until it is needed",
        "Skills and commands, so the agent does not spend tokens rediscovering the codebase every session",
      ],
      notes: [
        `Measured on one machine, February to 1 August 2026. Cached input is billed at a fraction of fresh input, which makes the
        cache the biggest cost lever in long agent sessions.`,
        "At Conrad I work on AI enablement under budget constraints across teams and departments.",
      ],
    },
    areas: {
      title: "Subjects I use it on",
      description: [
        "The same prompts sorted by subject instead of by kind of work. Subjects overlap, so these do not add up to anything.",
      ],
      groups: [
        {
          label: "Over a thousand prompts each",
          items: [
            "Database and migrations",
            "Testing, unit to end to end",
            "Ads and feed ranking",
            "UI and design systems",
            "CMS and content modelling",
            "Stakeholder docs and decks",
            "Authentication and identity",
            "CI/CD and hosting",
          ],
        },
        {
          label: "Hundreds of prompts each",
          items: [
            "Data analysis and audits",
            "Architecture and design docs",
            "KYC, AML, tax and legal compliance",
            "Ledgers, wallets and treasury",
            "Payments and subscriptions",
            "Performance and optimisation",
            "Analytics and tracking",
            "Caching and CDN",
            "Blockchain",
            "Cost and vendor evaluation",
            "Translations across locales",
            "Observability",
            "Mobile and offline",
            "Security hardening",
            "Real time streams",
            "Developer platform and SDK design",
            "SEO",
          ],
        },
      ],
      notes: [
        `Performance profiling and optimisation, especially for canvas and other compute heavy apps, has no row in the task split
        above: it is usually phrased as a bug, a test or a refactor, so a keyword split cannot isolate it.`,
        "Canvas and game work barely shows here because most of it happened on my other PC, which is not counted.",
      ],
    },
    agents: {
      title: "How I work with agents",
      description: [
        "Every change goes through the same four stages, and each stage has rules the agent cannot skip.",
      ],
      stages: [
        {
          name: "Context",
          icon: faFileLines,
          principles: [
            {
              title: "The contract matters more than the prompt",
              description: `Each repo has a context file with hard rules, reference docs the agent reads first,
              a memory of one fact per file and a handoff note per session.`,
            },
            {
              title: "Confidentiality first",
              description: `I check a tool's confidentiality model before it touches company code. Every tool an agent gets is scoped
              to read or write, secrets are checked by name only, and no sensitive data goes to the model.`,
            },
            {
              title: "Context that outlives the session",
              description: `I wrote tooling that trims multi gigabyte transcripts without deleting them, builds a digest and topic index
              per archived session, searches across all of them, and serves that history through a read only MCP server with its
              own evals.`,
            },
          ],
        },
        {
          name: "Agent",
          icon: faRobot,
          principles: [
            {
              title: "Production is a deliberate step",
              description: `Staging and production are separate connections I choose explicitly. Subagents never write to production,
              and migrations are applied only on my go and proven afterwards.`,
            },
            {
              title: "Synthetic data at real volume",
              description: "Money and customer paths run on synthetic data at production volumes, so scale problems show up before release.",
            },
            {
              title: "Agents with limits",
              description: `Subagents research and edit but never build or commit; the main session builds once. Parallel runs are capped
              at about five agents, after one large run used a whole session quota.`,
            },
          ],
        },
        {
          name: "Checks",
          icon: faShieldCheck,
          principles: [
            {
              title: "Dependencies are screened",
              description: "Every install passes a supply chain blocklist, and a match fails the install.",
            },
            {
              title: "Proof before acceptance",
              description: `Work is accepted on evidence from the deployed build, such as Playwright runs and API responses, with test
              data created through the real API instead of seeded.`,
            },
          ],
        },
        {
          name: "Human review",
          icon: faUserCheck,
          principles: [
            {
              title: "A person reviews every change",
              description: "Nothing merges without a human review, and features nobody asked for come back out.",
            },
            {
              title: "Decisions are written down",
              description: `Every open choice comes to me as a question with a recommendation and trade offs, and my answer is recorded
              as a numbered decision. One branch holds over 800 of them.`,
            },
          ],
        },
      ],
      examples: {
        title: "Caught in review",
        items: [
          {
            title: "A pattern violation in the generator",
            description: `Nine domain services used a shared base class directly instead of a subclass of their own. Each was wrapped in
            its own class, and the code generator template that kept emitting the violation was fixed too.`,
          },
          {
            title: "Live secrets marked as unused",
            description: `Repo instructions called two secrets dead and said to delete them. They were still live on the demo and
            production deploys. "No longer used" now means on every deployed branch.`,
          },
          {
            title: "One listener, registered twice",
            description: `A review page showed that a new pull request had absorbed an older open one. Merging both would have
            registered the same listener twice.`,
          },
        ],
      },
      footer: `The same setup serves engineers with reviews, migrations, tests and deploys,
      and it serves product and analysis stakeholders too.`,
    },
    timeline: {
      title: "How I got here",
      milestones: [
        {
          period: "Up to 2019",
          title: "Machine learning before LLMs",
          description: `From personal TensorFlow experiments to shipped models for the clients KPMG placed me with as a consultant:
          suggestions and recommendations, ads, and social media feed ranking.`,
        },
        {
          period: "Before ChatGPT",
          title: "Tabnine",
          description: "Code completion with Tabnine gave me an early, realistic sense of what AI assistance could and could not do.",
        },
        {
          period: "Early 2023",
          title: "ChatGPT at reNFT",
          description: `I started using ChatGPT seriously for frontend and backend work, from authentication and API design to serverless
          architecture. I wrote a small CLI that built a short context file for a project (architecture, directory layout, key files),
          choosing what went into it with company safety and privacy in mind. The rest was manual: paste the context, adjust,
          create the files by hand.`,
        },
        {
          period: "Later in 2023",
          title: "Cursor, Claude and Gemini",
          description: "I picked each one up as it appeared and have kept current since.",
        },
        {
          period: "Oct 2023 to Nov 2025",
          title: "HyperPlay",
          description: "AI across frontend, backend, Electron and mobile work.",
        },
        {
          period: "Feb 2025",
          title: "Project instruction sets",
          description: `I started writing detailed instructions for AI assisted development: architecture constraints, security
          requirements and conventions, so the model works inside the project instead of guessing at it.`,
        },
        {
          period: "Nov 2025 to present",
          title: "Conrad Electronic Group",
          description: `I drive AI enablement for the CMS migration, working with 90+ people across engineering, QA, product, content,
          SRE and up to CTO level. That covers Gemini Enterprise and Gemini CLI as the company tooling, a presentation to the team
          on how MCP and skills help with Gemini and Claude models, an evaluation of Strapi's MCP server and of the AEM MCP options
          (I recommended against the AEM ones), a supply chain check across the storefront repositories after the axios compromise,
          written up as an advisory for the team, and a human review before anything AI generated reaches Confluence or a pull
          request.`,
          isCurrent: true,
        },
        {
          period: "2026",
          title: "My own platform",
          description: `Claude Code is my main engineering tool on a large TypeScript monorepo for payments, ledgers, an ads engine and
          real time feeds. Around it sit skills adapted from an open source collection and extended with my own, such as an
          engineering discipline skill organised as phases and gates, a design review subagent, and private published pages that keep
          the working record: decision registers, review pages teammates use as their fix list, and live trackers.`,
          isCurrent: true,
        },
        {
          period: "Ongoing",
          title: "Gods of Zushin, my MMORPG",
          description: `I use AI to build features, write up in game events and debug support cases. For support I copy only the
          non sensitive data for that case into a sandbox of my own and let the agent work there, never on live data. Before off
          the shelf MCP servers existed I built my own for logging, audit and SQL access; now I use and configure the published
          ones. In September 2026 I also ran an owner authorised, read only security assessment of its public surface and wrote
          the hardening runbook.`,
          isCurrent: true,
        },
      ],
    },
  },
};
