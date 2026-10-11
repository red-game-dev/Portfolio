import { Blueprint } from "@/types/blueprints";

// AI delivery, retrieval augmented answers and how to pick a retrieval approach, drawn in the AI zone. Every drawing
// is a glance, not the full design.
const blueprints: Blueprint[] = [
  {
    id: "ai-workflow",
    tab: "AI delivery",
    zone: "ai",
    title: "AI delivery: plan artifacts, agents and test batteries",
    caption: "The plan artifact is the system of record, batteries prove each task on the deployed build, and a person " +
      "merges. A tracker is an optional view, not the source.",
    summary: {
      role: "Proposed and designed it, and work inside it every day",
      scale: "My own products, client work and a large enterprise delivery organisation; on one product, 600+ battery " +
        "scripts across 40+ subjects and 150+ end to end specs",
      stack: ["Claude Code on Max", "Gemini Enterprise", "Claude, GPT and Gemini APIs", "MCP servers", "Subagents", "Playwright", "Shell batteries", "Artifacts"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "ai-plan",
          label: "Plan artifact, the system of record",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "ai-phases", label: "Phases", detail: "Each with the gate that closes it" },
            { id: "ai-tasks", label: "Tasks", detail: "Owner, acceptance, status" },
            { id: "ai-decisions", label: "Decision register", detail: "Numbered, searched first" },
          ],
        },
        {
          id: "ai-contract",
          label: "Contract the agent works under",
          place: { col: 1, row: 2 },
          nodes: [
            { id: "ai-policy", label: "Policy", detail: "What AI may touch" },
            { id: "ai-rules", label: "Rules and skills", detail: "Per repository" },
            { id: "ai-handoffs", label: "Handoffs and memory" },
          ],
        },
        {
          id: "ai-run",
          label: "Agent run",
          place: { col: 2, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ai-agent", label: "Main agent", detail: "Large model" },
            { id: "ai-subagents", label: "Subagents", detail: "Read only, never build or commit" },
            { id: "ai-mcp", label: "Scoped tools, MCP", detail: "Staging and production kept apart" },
          ],
        },
        {
          id: "ai-proof",
          label: "Batteries on the deployed build",
          place: { col: 3, row: 1, rowSpan: 2 },
          nodes: [
            { id: "ai-security", label: "Security", detail: "Negative cases: 403 and 404 where they belong" },
            { id: "ai-function", label: "Functionality", detail: "HTTP verified" },
            { id: "ai-flows", label: "Product flows", detail: "Web app to back office, and back" },
            { id: "ai-providers", label: "Provider agnostic", detail: "One contract, every provider" },
            { id: "ai-money", label: "Money path", detail: "Ledger rows verified in the database" },
            { id: "ai-e2e", label: "End to end", detail: "Playwright, screenshots before and after" },
          ],
        },
        {
          id: "ai-gates",
          label: "Gates",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "ai-ledgers", label: "Runs and endpoint ledgers", detail: "Every run, with its commit" },
            { id: "ai-prbody", label: "Pull request body", detail: "Verified versus assumed" },
            { id: "ai-design", label: "Design review agent" },
            { id: "ai-human", label: "Human review", detail: "Every change" },
          ],
        },
        {
          id: "ai-landing",
          place: { col: 4, row: 2 },
          nodes: [{ id: "ai-merge", label: "Merge and republish the plan" }],
        },
      ],
      edges: [
        { from: "ai-phases", to: "ai-tasks" },
        { from: "ai-tasks", to: "ai-agent" },
        { from: "ai-contract", to: "ai-run" },
        { from: "ai-agent", to: "ai-subagents" },
        { from: "ai-agent", to: "ai-mcp" },
        { from: "ai-run", to: "ai-proof" },
        { from: "ai-proof", to: "ai-ledgers" },
        { from: "ai-ledgers", to: "ai-prbody" },
        { from: "ai-prbody", to: "ai-design" },
        { from: "ai-design", to: "ai-human" },
        { from: "ai-human", to: "ai-merge" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "The plan artifact",
          regions: [
            { kind: "bar", label: "Where things stand", area: "header" },
            { kind: "steps", label: "Phases, each with its gate", area: "left" },
            { kind: "list", label: "Tasks: owner, acceptance, status, the decision behind it", area: "main" },
            { kind: "card", label: "Open questions, with options and a recommendation", area: "right" },
            { kind: "list", label: "Changelog of settled sections", area: "footer" },
          ],
        },
        {
          title: "The runs ledger",
          regions: [
            { kind: "bar", label: "Battery, commit, time" },
            { kind: "list", label: "Each run: pass, fail, skip, pending", size: 2.4 },
            { kind: "bar", label: "Stale when its source changes" },
          ],
        },
      ],
      decision: "The plan page is the record: every row is re-measured on each pass, a row that cannot be checked stays " +
        "unverified, and status is earned by a battery on the deployed build.",
      outcome: "Nothing is re-entered into a tracker, decisions survive long agent sessions, and a change merges only when the batteries and a person agree.",
    },
    journeys: [
      {
        title: "A phase, from decision to merge",
        steps: [
          "The refund window per jurisdiction is decided and recorded as a numbered decision",
          "The agent adds a jurisdiction snapshot at checkout, proven by a probe on staging",
          "The refund endpoint refuses late requests, proven by a battery: 403 outside the window, 200 inside",
          "Ledger rows are checked in the database: debit and credit balance under one correlation id",
          "The back office screen is built and the design review agent approves it",
          "All batteries are green on the deployed build, and a person merges",
        ],
      },
      {
        title: "A battery run",
        steps: [
          "Runs against the deployed build, never against seeded state",
          "Checks the negative cases: another user's data is 403, a foreign id is 404",
          "Moves money only behind an explicit flag, so a plain run is harmless",
          "Writes one line to the runs ledger with its commit",
          "A change to the code it covers marks its last green run as stale",
        ],
      },
    ],
  },
  {
    id: "rag-pipeline",
    tab: "RAG",
    zone: "ai",
    title: "Retrieval augmented answers: hybrid search, rerank and cite",
    caption: "Sources are cut into chunks and indexed twice, by their words and by their meaning. A question is searched both " +
      "ways, the lists are fused and reranked, and the model answers only from what was found, with citations. Questions " +
      "that need several facts go to an agent that picks its sources, or to a knowledge graph.",
    summary: {
      role: "Designed and built the retrieval and answer pipelines",
      scale: "Assistants and search over documents, product catalogues and site content",
      stack: ["BM25 keyword index", "Vector store", "Embeddings", "Reciprocal rank fusion", "Cross-encoder reranker", "Knowledge graph", "Tool using agents", "LLM APIs"],
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "rag-sources",
          label: "Sources",
          place: { col: 1, row: 1 },
          nodes: [
            { id: "rag-docs", label: "Documents", detail: "Manuals, policies, help pages" },
            { id: "rag-catalogue", label: "Catalogue and content", detail: "Products and pages from a CMS or a shop" },
            { id: "rag-changes", label: "Changes", detail: "Updates re-indexed as they land" },
          ],
        },
        {
          id: "rag-ingest",
          label: "Ingestion",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "rag-chunk", label: "Chunking", detail: "By headings and tables, small chunks inside their section" },
            { id: "rag-meta", label: "Metadata", detail: "Market, language, date, who may see it" },
            { id: "rag-embed", label: "Embeddings" },
            { id: "rag-entities", label: "Entities and links", detail: "Pulled from each chunk by a model" },
          ],
        },
        {
          id: "rag-indexes",
          label: "Indexes",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "rag-keyword", label: "Keyword index", detail: "BM25: exact names, codes, numbers", kind: "store" },
            { id: "rag-vectors", label: "Vector index", detail: "Meaning: paraphrase and synonyms", kind: "store" },
            { id: "rag-graph", label: "Knowledge graph", detail: "Entities and how they relate", kind: "store" },
          ],
        },
        {
          id: "rag-question",
          label: "The question",
          place: { col: 1, row: 2 },
          nodes: [
            { id: "rag-ask", label: "A person asks", kind: "actor" },
            { id: "rag-rewrite", label: "Rewrite", detail: "Spelling, follow ups made whole, filters read out" },
            { id: "rag-route", label: "Route", detail: "One lookup, or several facts?", kind: "decision" },
          ],
        },
        {
          id: "rag-retrieve",
          label: "Retrieve",
          place: { col: 2, row: 2, colSpan: 2 },
          columns: 2,
          nodes: [
            { id: "rag-bm25", label: "Keyword search", detail: "Filtered by access and market first" },
            { id: "rag-knn", label: "Vector search", detail: "The question embedded alike, filtered the same way" },
            { id: "rag-fuse", label: "Fusion", detail: "Reciprocal rank fusion of both lists" },
            { id: "rag-rerank", label: "Reranker", detail: "A cross-encoder orders the top 50 down to the best few" },
            { id: "rag-agent", label: "Agent route", detail: "Picks tools and sources, walks the graph, loops until it has enough", span: 2 },
          ],
        },
        {
          id: "rag-answer",
          label: "Answer",
          place: { col: 4, row: 1 },
          nodes: [
            { id: "rag-prompt", label: "Grounded prompt", detail: "Only the passages found" },
            { id: "rag-model", label: "Model" },
            { id: "rag-cited", label: "Answer with citations", detail: "Or says nothing was found" },
          ],
        },
        {
          id: "rag-prove",
          label: "Prove it",
          place: { col: 4, row: 2 },
          nodes: [
            { id: "rag-evals", label: "Eval set", detail: "Recall at k, faithfulness, accuracy" },
            { id: "rag-feedback", label: "Feedback", detail: "Thumbs and misses become new evals" },
          ],
        },
      ],
      edges: [
        { from: "rag-sources", to: "rag-chunk" },
        { from: "rag-chunk", to: "rag-meta" },
        { from: "rag-meta", to: "rag-embed" },
        { from: "rag-meta", to: "rag-keyword" },
        { from: "rag-embed", to: "rag-vectors" },
        { from: "rag-chunk", to: "rag-entities" },
        { from: "rag-entities", to: "rag-graph" },
        { from: "rag-ask", to: "rag-rewrite" },
        { from: "rag-rewrite", to: "rag-route" },
        { from: "rag-route", to: "rag-bm25", label: "lookup" },
        { from: "rag-route", to: "rag-knn" },
        { from: "rag-route", to: "rag-agent", label: "several facts" },
        { from: "rag-keyword", to: "rag-bm25", style: "dashed" },
        { from: "rag-vectors", to: "rag-knn", style: "dashed" },
        { from: "rag-graph", to: "rag-agent", style: "dashed" },
        { from: "rag-agent", to: "rag-fuse", style: "dashed" },
        { from: "rag-bm25", to: "rag-fuse" },
        { from: "rag-knn", to: "rag-fuse" },
        { from: "rag-fuse", to: "rag-rerank" },
        { from: "rag-rerank", to: "rag-prompt" },
        { from: "rag-agent", to: "rag-prompt" },
        { from: "rag-prompt", to: "rag-model" },
        { from: "rag-model", to: "rag-cited" },
        { from: "rag-cited", to: "rag-prove" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "An answer with its sources",
          regions: [
            { kind: "bar", label: "The question, as asked" },
            { kind: "card", label: "The answer, every claim footnoted", size: 2 },
            { kind: "list", label: "Sources: the passages it used, each linked", size: 1.4 },
            { kind: "actions", label: "Helpful, not helpful" },
          ],
        },
        {
          title: "A catalogue search that understands",
          regions: [
            { kind: "bar", label: "Waterproof jacket for kids, under 50" },
            { kind: "list", label: "Exact codes first, then by meaning, only this market's stock", size: 2.2 },
            { kind: "card", label: "Why these: the words and the meaning that matched" },
          ],
        },
      ],
      decision: "Search twice and rerank: words catch the exact names, codes and numbers that embeddings blur, meaning catches " +
        "the paraphrase, and a reranker orders the fused list against the question. Anything that needs several facts goes " +
        "to an agent or the graph.",
      outcome: "Answers stay grounded in the sources and cite them, exact names and codes are kept rather than lost to a " +
        "vague neighbour, and the assistant says so when nothing was found.",
    },
    journeys: [
      {
        title: "A question answered from the documents",
        steps: [
          "Someone asks how long they have to return an item",
          "The question is rewritten whole and searched by words and by meaning, filtered to their market",
          "Both lists are fused and the reranker keeps the best few passages",
          "The model answers from those passages only, citing each",
          "A thumbs down sends the miss to the eval set",
        ],
      },
      {
        title: "A question that needs several facts",
        steps: [
          "Someone asks which supplier's parts are in the products recalled last month",
          "The router sends it to the agent route",
          "The agent walks the graph from the recall to the products to their parts and suppliers",
          "It checks each hop against the documents, then answers with every source",
        ],
      },
    ],
  },
  {
    id: "rag-choosing",
    tab: "Picking RAG",
    zone: "ai",
    title: "Picking a retrieval approach, from long context to graphs and agents",
    caption: "Ask the data a few questions and start with the simplest answer: long context when it fits, then add words, a " +
      "reranker, parent chunks, a graph or an agent only where the evaluation shows a gap.",
    summary: {
      role: "How I choose for each product, and why this site does not use RAG",
      scale: "The same questions for documents, catalogues, content and the Ask Red agent on this site",
    },
    architecture: {
      columns: 4,
      groups: [
        {
          id: "pick-ask",
          label: "Ask of the data",
          place: { col: 1, row: 1, rowSpan: 2 },
          nodes: [
            { id: "pick-fits", label: "Small enough to send with every question?", kind: "decision" },
            { id: "pick-exact", label: "Exact codes, names or numbers?", kind: "decision" },
            { id: "pick-sections", label: "Long documents in sections?", kind: "decision" },
            { id: "pick-hops", label: "Questions across several facts?", kind: "decision" },
            { id: "pick-live", label: "Needs live data or actions?", kind: "decision" },
          ],
        },
        {
          id: "pick-start",
          label: "Start",
          place: { col: 2, row: 1 },
          nodes: [
            { id: "pick-long", label: "Long context", detail: "No index at all; a cached prefix keeps it cheap. Ask Red works this way" },
            { id: "pick-vector", label: "Vector RAG", detail: "Meaning only, for prose and paraphrase" },
          ],
        },
        {
          id: "pick-sharpen",
          label: "Sharpen",
          place: { col: 3, row: 1 },
          nodes: [
            { id: "pick-hybrid", label: "Hybrid", detail: "Words and meaning, fused" },
            { id: "pick-rerank", label: "Reranker", detail: "When the first few must be right" },
            { id: "pick-parent", label: "Parent and child chunks", detail: "Search small, answer with the whole section" },
          ],
        },
        {
          id: "pick-reason",
          label: "Reason",
          place: { col: 2, row: 2, colSpan: 2 },
          columns: 2,
          nodes: [
            { id: "pick-graph", label: "Graph RAG", detail: "Entities and links walked, for who relates to what" },
            { id: "pick-agent", label: "Agentic RAG", detail: "Picks sources and tools per question, and loops" },
          ],
        },
        {
          id: "pick-prove",
          label: "Then measure",
          place: { col: 4, row: 1, rowSpan: 2 },
          nodes: [
            { id: "pick-evals", label: "An eval set of real questions", detail: "Recall at k, faithfulness, accuracy" },
            { id: "pick-filters", label: "Access and market filters", detail: "Before ranking, never after" },
            { id: "pick-budget", label: "Latency and cost budget" },
            { id: "pick-unknown", label: "Says when nothing was found" },
          ],
        },
      ],
      edges: [
        { from: "pick-fits", to: "pick-long", label: "yes" },
        { from: "pick-fits", to: "pick-vector", label: "no" },
        { from: "pick-exact", to: "pick-hybrid", label: "yes" },
        { from: "pick-vector", to: "pick-hybrid" },
        { from: "pick-hybrid", to: "pick-rerank" },
        { from: "pick-sections", to: "pick-parent", label: "yes" },
        { from: "pick-hops", to: "pick-graph", label: "yes" },
        { from: "pick-live", to: "pick-agent", label: "yes" },
        { from: "pick-long", to: "pick-evals" },
        { from: "pick-sharpen", to: "pick-prove" },
        { from: "pick-reason", to: "pick-prove" },
      ],
    },
    wireframe: {
      device: "desktop",
      screens: [
        {
          title: "Choosing, one question at a time",
          regions: [
            { kind: "steps", label: "Small enough, exact terms, sections, several facts, live data", size: 1.4 },
            { kind: "card", label: "The simplest approach that answers these questions", size: 1.6 },
            { kind: "list", label: "What it costs: tokens, latency, an index to keep fresh" },
          ],
        },
        {
          title: "The evaluation that decides",
          regions: [
            { kind: "stat", label: "Recall at 5, faithfulness, accuracy" },
            { kind: "list", label: "The questions it missed, and why", size: 2 },
            { kind: "actions", label: "Add a reranker, chunk by section, or keep it simple" },
          ],
        },
      ],
      decision: "Nothing is added on faith: each step up (an index, hybrid search, a reranker, parent chunks, a graph, an agent) " +
        "has to win on an eval set of the product's own questions.",
      outcome: "Each product gets the retrieval its data needs, and pays for no machinery it does not use. This site fits in " +
        "one cached prompt, so Ask Red reads all of it rather than a retrieved slice.",
    },
    journeys: [
      {
        title: "A help centre of a few hundred pages",
        steps: [
          "Too much to send with every question, in cost and in time, so it is indexed",
          "Product names and error codes matter, so search is hybrid",
          "Answers must be right first time, so a reranker orders the top results",
          "The eval set shows the gain before it ships",
        ],
      },
      {
        title: "Contracts and manuals",
        steps: [
          "Long documents in numbered sections",
          "Small chunks are searched, and the whole section they sit in is what the model reads",
          "Every answer cites the clause it came from",
        ],
      },
      {
        title: "Who supplied what, to whom",
        steps: [
          "The answer spans several records",
          "A knowledge graph links suppliers, parts and products",
          "The graph is walked, and each hop is checked against the documents",
        ],
      },
      {
        title: "Today's stock and prices",
        steps: [
          "The facts change by the minute, so nothing stale is indexed",
          "An agent calls the catalogue and stock tools for each question",
          "It answers with what the tools returned, and when",
        ],
      },
      {
        title: "This portfolio",
        steps: [
          "The whole site fits in one prompt",
          "So there is no index: Ask Red reads all of it, and the prompt is cached",
          "Nothing is lost to a retrieval miss",
        ],
      },
    ],
  },
];

export default blueprints;
