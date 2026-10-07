import { PortfolioData } from "@/types/portfolio";

// The game layer: the HUD, the trail, the duels, the arena and the finale.
export const gameContent: Pick<PortfolioData, "bossLabels" | "hud" | "journeyTrail" | "finale" | "arena" | "duels"> = {
  bossLabels: { boss: "Boss", hp: "HP", defeated: "Defeated", loot: "Loot" },
  hud: { pick: "Pick a character", level: "Level", xp: "XP", bosses: "Bosses defeated" },
  journeyTrail: {
    zoneLabel: "Zone {index} of {total}: {zone}",
    zones: { matrix: "The Matrix", ai: "AI", chain: "Chain", casino: "Casino", mmo: "Game world" },
    titles: { started: "Start", about: "Who I am" },
  },
  finale: {
    kicker: "Run complete",
    title: "Wow! You made it to the end.",
    screen: ["THANKS FOR", "PLAYING"],
    screenLabel: "Thanks for playing",
    summaryTitle: "Your run",
    stats: {
      zones: "Zones crossed",
      bosses: "Bosses defeated",
      duels: "Duels played",
      character: "Character",
      raid: "Bug Raid best",
      time: "Time on this run",
    },
    none: "None picked",
    notPlayed: "Not played",
    rankLabel: "Rank",
    objectives: "{done} of {total} objectives",
    ranks: [
      { min: 0, name: "Explorer" },
      { min: 2, name: "Adventurer" },
      { min: 4, name: "Champion" },
      { min: 5, name: "Legend" },
    ],
    finalQuest: "Final quest: start a conversation",
    contactNote: "How did you find the journey? The best time to reach me is after 4:30 PM CET on business days.",
    emailLabel: "Email me",
    emailSubject: "I finished your portfolio run",
    emailBody: "Rank {rank}. Bosses {bosses}, duels {duels}.",
    linkedInLabel: "LinkedIn",
    cvLabel: "Download my CV",
    restartLabel: "New game+",
  },
  arena: {
    boardLabel: "Bug Raid game board",
    hint: "Click or tap a bug to squash it, or use the arrow keys to aim and Space to squash. Regressions take two hits and flaky bugs jump.",
    ready: "Bugs are heading for production.",
    start: "Start the raid",
    again: "Play again",
    resume: "Resume",
    paused: "Paused while off screen",
    over: "Production is down",
    newBest: "New best",
    score: "Score",
    lives: "Lives",
    wave: "Wave",
    best: "Best",
    production: "production",
  },
  duels: {
    agentLabel: "Agent",
    humanLabel: "Me",
    resultLabel: "Shipped",
    verdict: "Overruled",
    scoreLabel: "Rounds won",
    scoreOf: "of",
    roundLabel: "Round",
    versusLabel: "VS",
    koLabel: "K.O.",
    ruleLabel: "Rule kept",
    rulesTitle: "Rules of engagement",
    rulesDescription: "What I put in place before a team works with agents, so the speed comes with guardrails.",
    rules: [
      {
        name: "Security",
        detail: `Tools scoped per environment, with staging and production on separate connections. Subagents never write to
        production, secrets are handled by name only, and a supply chain blocklist runs in CI.`,
      },
      {
        name: "Company policy",
        detail: `What employees and contractors may use AI for, written down. At Conrad I enforced the rule that nothing AI generated
        reaches the wiki or a pull request without human review.`,
      },
      {
        name: "Data privacy",
        detail: "A tool's confidentiality model is checked before company code goes near it. No sensitive data to a model, and synthetic data for money paths.",
      },
      {
        name: "The right skills and MCP servers",
        detail: "Project skills and MCP servers installed per job, each evaluated for access control before the team relies on it.",
      },
      {
        name: "A process that scales",
        detail: `One flow from idea to code: plan, design doc, tickets, test first, review. Decisions go in registers the agents
        search before they ask.`,
      },
      {
        name: "Fits the frameworks you run",
        detail: "Built to plug into what a company already uses: Agile sprints, the issue tracker and the wiki, through to HR and accountancy processes.",
      },
    ],
    rounds: [
      {
        agent: "A payer can change their country to unlock instant statutory refunds.",
        human: "The country locks once set. The real gap is that it is never checked against the payment.",
        result: "A jurisdiction snapshot on every charge.",
      },
      {
        human: "Write that agents never get write access to production and never see production data.",
        agent: "The configuration says otherwise: a production database connection exists without a read only flag. The absolute claim would not survive one question.",
        result: "The accurate version: staging and production as separate, chosen connections, and subagents that never write to production.",
        winner: "agent",
        rule: "A claim about how I work is checked against the actual configuration before it is published.",
      },
      {
        agent: "These two auth secrets match no code. Delete them from both hosting projects.",
        human: "Demo and production still run the old provider. Deleting them takes production down.",
        result: 'Live secrets kept, and "no longer used" now means on every deployed branch.',
      },
      {
        human: "Keep the role filter on plan lookups; without it, how do we filter plans by role?",
        agent: "Two kinds of query: one follows a subscription's own link to its plan, where a filter can only lose data; catalogue browsing keeps it.",
        result: "The split, after a fee bug charged some accounts the default rate instead of their plan's. I added the case it had missed.",
        winner: "agent",
        rule: "When a link already says which row is right, do not filter it again.",
      },
      {
        agent: "Nine domain services can use the shared base class directly.",
        human: "Each domain gets a subclass of its own, and the generator stops emitting the shortcut.",
        result: "Nine services wrapped and the generator template fixed.",
      },
      {
        human: "A cost saving and a user figure, written as I remembered them.",
        agent: "The documents mix a two year total with one year, and the public record for those years shows fewer users.",
        result: "About 80%, worded as the case and the architecture, and 1.5M+ users in 167 countries.",
        winner: "agent",
        rule: "Floors only, the measure named, nothing rounded up.",
      },
      {
        agent: "Post the review with the page's finding numbers.",
        human: "Comment on the exact lines instead.",
        result: "43 line comments, and three fix samples calling helpers that do not exist caught before posting.",
      },
    ],
  },
};
