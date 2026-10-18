import { PortfolioData } from "@/types/portfolio";

// The DevOps universe: the hosts I run on and when I pick each, the stacks I set up from scratch, the CLI that moved them,
// and the questions screeners ask, each answer drawn from what the rest of the page shows. Costs are only ever relative.
export const devopsContent: Pick<PortfolioData, "devops"> = {
  devops: {
    hosts: {
      title: "Where it runs, and when",
      intro: "No host is right for everything. This is how I choose, and where each one stops paying.",
      labels: { reach: "When I reach for it", stops: "Where it stops paying", cost: "Cost" },
      items: [
        {
          id: "dedicated",
          name: "OVH and Hetzner",
          kind: "Dedicated servers",
          reach: "Steady, heavy load: game servers, real time and databases I tune myself, set up from scratch with Docker and my own CLI.",
          stops: "Sudden spikes and teams with nobody on call: adding a server takes hours, not seconds.",
          cost: "The most compute and bandwidth for the money once the load is steady.",
        },
        {
          id: "digitalocean",
          name: "DigitalOcean",
          kind: "Virtual servers per region",
          reach: "The web and small services beside the dedicated machines, a region at a time, quick to set up and to move.",
          stops: "Heavy compute and large databases, which belong on dedicated servers.",
          cost: "Cheap and predictable at small to medium scale.",
        },
        {
          id: "aws",
          name: "AWS",
          kind: "Cloud, set up in full",
          reach: "When managed services pay for themselves: PostgreSQL on RDS and Aurora, ElastiCache, queues and Step Functions, " +
            "Bedrock, and Cognito and IAM where identity and compliance matter.",
          stops: "Bandwidth and per request pricing at steady high volume: I set budgets and move hot paths off when they cost more than they save.",
          cost: "Dearer per unit than servers, cheaper than the people a managed service replaces.",
        },
        {
          id: "gcp",
          name: "GCP",
          kind: "Kubernetes on GKE",
          reach: "Many services and markets: Helm, Istio canary rollouts per market, autoscaling and many environments.",
          stops: "A small team: a cluster costs money and attention every day it runs.",
          cost: "Pays off with many services sharing one cluster, not with a few.",
        },
        {
          id: "vercel",
          name: "Vercel",
          kind: "Front ends at the edge",
          reach: "Web apps: a preview for every branch, rendering near the reader, a rollback in one step.",
          stops: "Long running work and heavy compute, which go to workers on Railway or to servers.",
          cost: "Cheap for front ends, dear for heavy compute and bandwidth at scale.",
        },
        {
          id: "railway",
          name: "Railway",
          kind: "Workers and services",
          reach: "Workers and background jobs deployed by build id with no downtime.",
          stops: "Large steady fleets, where servers cost less.",
          cost: "Pay for what runs, so cheap while small.",
        },
        {
          id: "cloudflare",
          name: "Cloudflare",
          kind: "In front of everything",
          reach: "DNS, caching, Workers at the edge and protection from attacks, in front of whichever host is behind.",
          stops: "Where state lives, which stays with the host behind it.",
          cost: "Little or nothing for what it saves the hosts behind it.",
        },
      ],
    },
    scratch: {
      title: "From scratch, many times",
      points: [
        "The social network and the game ran on servers I set up from scratch on OVH and DigitalOcean, with no AWS: servers per region, switched by hand before load balancers were common.",
        "Every service in Docker, the same containers on every server and in every environment: a bit more costly back then, but tuned, with no vendor lock-in and an easy move to another host.",
        "Databases, Redis and every other service in containers, started, backed up and moved with the same tools.",
        "My own build runners and shell scripts that build, migrate, deploy, check health and roll back, so I never paid for build minutes.",
      ],
    },
    cli: {
      title: "The CLI my startups ran on",
      points: [
        "A CLI of my own that most of my startups ran on: it set up servers, started the containers, databases and Redis among them, kept every environment the same across hosts, and moved a whole stack from one host to another.",
        "On the platform I build now it is an infrastructure package: one CLI where a new host is one adapter, designed through 84 recorded decisions covering provisioning, moving between hosts with a cost comparison, build runners and secrets.",
        "The same cut over for any host: add it, run both, switch, retire.",
      ],
    },
    screeners: {
      title: "What screeners ask",
      intro: "The questions I am asked most about infrastructure, answered from what this page shows.",
      answers: [
        {
          id: "aws",
          question: "Which AWS services have you run in production?",
          answer: [
            "Compute: EC2, ECS and EKS, Lambda, Auto Scaling and load balancers.",
            "Data: PostgreSQL on RDS and Aurora, DynamoDB, ElastiCache for Redis, S3 and CloudFront.",
            "Integration: API Gateway, SQS and SNS, Step Functions and EventBridge.",
            "AI and identity: Bedrock, Cognito, IAM, Secrets Manager and KMS. Set up in full and tuned for cost.",
          ],
        },
        {
          id: "deploy",
          question: "How do you deploy and roll back?",
          answer: [
            "CI/CD with audit logs, permission controls and rollback, and database migrations verified on staging and production first.",
            "On Kubernetes, canary rollouts per market through Istio, so one market moves at a time under monitoring and rolls back alone.",
            "Workers deployed by build id with no downtime, so rolling back is deploying the last good build again; on servers of my own, shell scripts that deploy, check health and roll back.",
          ],
        },
        {
          id: "postgres",
          question: "Where have you owned PostgreSQL?",
          answer: [
            "On the platform I build now: a job scheduler written over Postgres, with idempotency at three layers and no message broker or queue library.",
            "In Freight Delay Notifications, open source: Temporal workflows over PostgreSQL and Supabase, with PL/pgSQL.",
          ],
        },
        {
          id: "agent",
          question: "Which AI agent or workflow of yours runs in production?",
          answer: [
            "Freight Delay Notifications: Temporal workflows fetch traffic, check a delay threshold, have a model write the message and send it by email or SMS, with a fallback for every provider.",
            "Ask Red, on this site: answers streamed from the site's own content across several AI providers, behind limits, a cache and a daily budget.",
          ],
        },
      ],
    },
  },
};
