
import {
  faArrowRightArrowLeft,
  faBrain,
  faBullhorn,
  faChartLine,
  faCloudArrowUp,
  faCog,
  faCoins,
  faCreditCard,
  faCubes,
  faDice,
  faGamepad,
  faGaugeHigh,
  faGem,
  faLayerGroup,
  faPlane,
  faRocket,
  faShieldHalved,
  faSitemap,
  faTerminal,
  faUsers,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

import { SECTION_IDS } from "@/config/sections";
import { PortfolioData } from "@/types/portfolio";

// What I offer, grouped, and the actions under it.
export const servicesContent: Pick<PortfolioData, "serviceActions" | "serviceGroups"> = {
  serviceActions: {
    email: "Email me about this",
    linkedIn: "LinkedIn",
  },
  serviceGroups: [
    {
      label: "Architecture & Platforms",
      services: [
        {
          title: "Software Architecture & Technical Leadership",
          icon: faSitemap,
          description: `I take ownership of the architecture and stay hands on while doing it. I work across engineering, product, QA
          and stakeholders up to CTO level, and I design so that a vendor, a framework or a cloud can be changed without a rewrite.`,
          points: [
            "Target architecture, trade offs and a migration path",
            "C4 diagrams, decision records and a numbered decision log",
            "Adapter contracts for every external vendor, with business logic kept free of framework code",
            "Infrastructure behind adapters, with a written cut over plan that protects data",
            "Technical direction across several squads, with mentoring and review",
            "A clean handover guide at the end",
          ],
          emailSubject: "Software architecture",
        },
        {
          title: "Payments & Ledger Architecture",
          icon: faCreditCard,
          description: "I design and build the money side of a product so that it adds up, survives retries and passes review.",
          points: [
            "Payment gateway that is not tied to one provider",
            "Double entry ledgers with reconciliation",
            "Payouts, multi currency and tax per region",
            "Holds and wallet adjustments above a threshold need a second admin's approval",
            "Idempotency and signed webhooks end to end",
            "KYC, AML and PCI scope designed in from the start",
          ],
          emailSubject: "Payments and ledgers",
          see: { label: "See the payments work", href: `#${SECTION_IDS.payments}` },
        },
        {
          title: "Migration & Modernisation",
          icon: faArrowRightArrowLeft,
          description: `I plan and lead migrations off legacy systems, from the first audit to the last cut over. I have moved a storefront
          in 16 markets off AEM to a headless CMS, an unstable mobile app onto a new core, Backbone frontends to Redux and RxJS,
          brownfield client systems in finance, iGaming and pharmatech, and a Web3 platform from Polkadot parachains to a chain of its
          own.`,
          points: [
            "An audit of what moves: components, content, data, integrations, redirects and translations, all counted",
            "The target picked on evidence: a scored evaluation of platforms, frameworks or chains",
            "An adapter so old and new run side by side behind a feature flag",
            "A working proof of concept before commitment",
            "Rollout per market or per slice, with monitoring and rollback",
            "A business case that shows what the move saves, licence and running cost included",
          ],
          emailSubject: "Platform migration",
        },
        {
          title: "Architecture & Security Review",
          icon: faShieldHalved,
          description: "I review a codebase or a set of pull requests and return findings against the real code with a fix plan.",
          points: [
            "Findings shown on the exact lines, with numbered fix steps",
            "Authorisation, billing integrity and data exposure checks",
            "Supply chain and dependency review",
            "A definition of done the re-review is checked against",
          ],
          emailSubject: "Architecture review",
        },
        {
          title: "DevOps & Release Engineering",
          icon: faCloudArrowUp,
          description: "I set up the pipelines, environments and release paths that let a team ship often without breaking production.",
          points: [
            "CI/CD with audit logs, permission controls and rollback",
            "Kubernetes, canary rollouts and edge caching, or simpler hosts behind deploy adapters",
            "Environments, migrations and feature flags that keep staging honest",
            "Disaster recovery and business continuity plans",
          ],
          emailSubject: "DevOps and release engineering",
        },
      ],
    },
    {
      label: "AI",
      services: [
        {
          title: "Enterprise AI Enablement & Agent Workflows",
          icon: faBrain,
          description: `I help an engineering organisation adopt AI agents safely and get real speed from them, from the policy down
          to the repository.`,
          points: [
            "Tool evaluation, including MCP options and data privacy",
            "Rules for what agents may access, per environment, read only where it should be",
            "Project instructions, skills, commands and subagents written for your codebase",
            "Human review, security checks and verification on the real surface built into the workflow",
            "Decision registers so long sessions lose nothing",
            "Cost and context control so usage stays affordable",
          ],
          emailSubject: "AI enablement",
        },
        {
          title: "LLM Integration",
          icon: faWandMagicSparkles,
          description: "I build features and internal tools on the GPT, Claude and Gemini APIs, with the guardrails a real product needs.",
          points: [
            "Content generation, summaries and translation",
            "Classification and moderation behind a provider interface, so the model can be swapped",
            "Data extraction and analysis over documents and logs",
            "Tool calling and agent workflows that act on your systems",
            "Prompt standards, output checks and cost limits",
          ],
          emailSubject: "LLM integration",
        },
        {
          title: "AI-Generated App Rescue & Hardening",
          icon: faCog,
          description: `Shipped fast with AI and now it is buggy, insecure, leaking data, or actively under attack?
          I audit the codebase, close the holes, and get it stable enough to trust in production. Urgent help?`,
          emailSubject: "AI app rescue",
        },
      ],
    },
    {
      label: "Engineering",
      services: [
        {
          title: "Full Stack Product Engineering",
          icon: faLayerGroup,
          description: "I build features end to end across web, mobile and desktop, and take them to production.",
          points: [
            "React, Next.js, Vue and Nuxt on the front",
            "Node.js with NestJS, or Laravel, on the back",
            "React Native, Flutter and Electron apps",
            "Tests at the seams, including end to end",
            "Zero to one builds as well as existing codebases",
          ],
          emailSubject: "Product engineering",
        },
        {
          title: "Performance Engineering",
          icon: faGaugeHigh,
          description: "I find and remove what makes a product slow, in the browser and on the server.",
          points: [
            "Profiling of rendering, canvas and heavy client code",
            "Query and index review, pagination and caching rules",
            "Lighthouse and real device checks before and after",
            "Native modules where the web is not enough",
          ],
          emailSubject: "Performance",
        },
        {
          title: "Developer Experience & Tooling",
          icon: faTerminal,
          description: "I make engineering teams and outside developers faster, with the tools, docs and portals around the product.",
          points: [
            "CLI tools, scaffolders and internal documentation",
            "A developer portal for game studios",
            "Design systems documented in Storybook, with interaction tests",
            "Test Driven Development brought in org wide, reaching 95%+ coverage on the front end and mobile code",
          ],
          emailSubject: "Developer experience",
        },
      ],
    },
    {
      label: "Web3 & Blockchain",
      services: [
        {
          title: "Blockchain Product Engineering",
          icon: faCubes,
          description: "I build products on chains: wallets, contracts, indexers and the apps people use on top of them.",
          points: [
            "Wallet connections and contract calls across EVM chains, with Ethers.js and Wagmi",
            "Indexing and node providers: The Graph, Alchemy and our own",
            "Solana, Polkadot parachains and a chain of our own on Substrate",
            "Rust and Solidity alongside TypeScript where the work needs them",
            "Store, wallet and install in one flow across web, desktop and mobile",
          ],
          emailSubject: "Blockchain engineering",
        },
        {
          title: "Exchanges, Tokens & Launchpads",
          icon: faChartLine,
          description: "I design platforms that move tokens and money: trading, listings, launchpads and custody.",
          points: [
            "Trading, listing and risk, built for exchange and DeFi volume from day one",
            "Creator coin launchpads, live before they were a trend",
            "Deposits, hot wallets, cold storage and withdrawals to whitelisted addresses",
            "Crypto deposits and withdrawals on several chains, on one balance",
            "Fan engagement with real time rewards and NFTs, for 1.5M+ users in 167 countries",
          ],
          emailSubject: "Exchanges and tokens",
        },
        {
          title: "NFT Marketplaces & Contract Security",
          icon: faGem,
          description: "I build NFT products and check the contracts behind them before any money moves.",
          points: [
            "An NFT lending marketplace, rebuilt as V2 so it could keep changing without breaking its critical flows",
            "Smart contract security audits that look for attack paths",
            "End to end tests on the flows that move assets",
          ],
          emailSubject: "NFTs and contract security",
        },
      ],
    },
    {
      label: "Games & iGaming",
      services: [
        {
          title: "Game Development",
          icon: faGamepad,
          description: "I design and build games and live systems where latency and scale decide the experience.",
          points: [
            "Game UI in PixiJS, WebGL and canvas",
            "My own engine and servers in C/C++ and Lua, still in active use",
            "Real time back ends over WebSockets and server sent events",
            "Custom cryptography and compression between client and server",
          ],
          emailSubject: "Game development",
        },
        {
          title: "Game Publishing & Live Operations",
          icon: faRocket,
          description: "I take games to players and keep them running: stores, launchers, portals for studios and live operations.",
          points: [
            "A game store and launcher with a portal for studios, on web, desktop and mobile",
            "A low code builder that let anyone build, host and update a whole game",
            "Live patching, moderation and analytics for an MMORPG run for over five years",
            "In game purchases and subscriptions through Stripe and PayPal",
            "Communities grown on Facebook, YouTube, Twitch, Reddit and Instagram",
          ],
          emailSubject: "Game publishing",
        },
        {
          title: "iGaming Platforms",
          icon: faDice,
          description: "I build casino products: live tables, game clients and the money flows a licence asks for.",
          points: [
            "Live dealer game UI for every screen, and a new mobile app",
            "Tooling that automated onboarding new casino operators",
            "Regulated deposit and withdrawal flows under Malta licensing",
            "A crypto casino and sportsbook built in full: games from many studios, live odds, bonuses and tournaments",
            "PixiJS interfaces for iGaming and game publishing clients",
          ],
          emailSubject: "iGaming",
        },
      ],
    },
    {
      label: "Social & Monetisation",
      services: [
        {
          title: "Social Platforms & Communities",
          icon: faUsers,
          description: "I build social products people come back to: profiles, feeds, groups and the reasons to take part.",
          points: [
            "A social network for anime, manga, cosplay and gaming fans, grown to 10M+ registered and 3M+ active users",
            "Friends, timelines, guilds, forums, wikis and galleries",
            "Taking part that levels up your own character, and an economy earned by joining in",
            "A fan engagement app for 1.5M+ users in 167 countries",
            "Real time feeds and milestone based funding on my own platform",
          ],
          emailSubject: "Social platforms",
        },
        {
          title: "Ads, Economies & Monetisation",
          icon: faCoins,
          description: "I build the ways a product earns: ads, in product economies, purchases and subscriptions.",
          points: [
            "An ads engine with its own auction, bidding and attribution",
            "Self serve ads, an auction house and points earned by taking part",
            "Payments on a double entry ledger",
            "Points earned by giving, spent with partner businesses",
            "In game purchases and subscriptions",
          ],
          emailSubject: "Ads and monetisation",
        },
      ],
    },
    {
      label: "Product & Growth",
      services: [
        {
          title: "Product, Growth & Marketing Leadership",
          icon: faBullhorn,
          description: `I have founded and run my own companies, so I can sit on the business side of the table as well as the technical
          one. That mix is what a CPTO role needs: one person who understands both worlds.`,
          points: [
            "Product direction, roadmap and monetisation from zero to launch",
            "Paid acquisition on Meta, Google, TikTok and other networks",
            "Community building and content across social and streaming platforms",
            "Founder and executive experience across 14 startups, as CEO, CTO and on the marketing side",
            `I have also built an ads engine with its own auction, bidding and attribution, so I know advertising from the buyer's
            side and the builder's side`,
          ],
          emailSubject: "Product and growth",
        },
        {
          title: "TasteTravellers Collaborations",
          icon: faPlane,
          description: "",
          emailSubject: "TasteTravellers collaboration",
        },
      ],
    },
  ],
};
