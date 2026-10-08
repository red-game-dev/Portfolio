
import {
  faArrowRightArrowLeft,
  faBrain,
  faBullhorn,
  faCloudArrowUp,
  faCog,
  faCreditCard,
  faCubes,
  faGamepad,
  faGaugeHigh,
  faLayerGroup,
  faPlane,
  faShieldHalved,
  faSitemap,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

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
        },
        {
          title: "CMS & Platform Migration",
          icon: faArrowRightArrowLeft,
          description: "I plan and lead migrations off legacy platforms, from the first audit to the rollout per market.",
          points: [
            "Content and component audit, with redirects, forms and translations counted",
            "Content model and CMS evaluation",
            "An adapter so old and new run side by side behind a feature flag",
            "A working proof of concept before commitment",
            "Rollout plan per market with rollback",
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
          title: "Web3 Platform Engineering",
          icon: faCubes,
          description: "I build and review products that touch chains, wallets and contracts.",
          points: [
            "Wallet connections and contract interactions on EVM chains",
            "Marketplaces, launchers and token platforms",
            "Smart contract review for attack paths",
            "Experience from parachains to a chain of our own",
          ],
          emailSubject: "Web3",
        },
        {
          title: "Games & Real Time Systems",
          icon: faGamepad,
          description: "I design and build game and live systems where latency and scale decide the experience.",
          points: [
            "Game UI in PixiJS, WebGL and canvas",
            "Real time back ends over WebSockets and server sent events",
            "Custom engine work in C/C++ and Lua",
            "Monetisation with in game purchases and subscriptions",
          ],
          emailSubject: "Games and real time",
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
