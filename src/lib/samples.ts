import type { RepoSourceDocument, SourceDocument } from "@/lib/types";

export type SampleSource = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  source: SourceDocument;
};

function buildWorkflowRepoSample(): RepoSourceDocument {
  return {
    kind: "repo",
    label: "example/workflow-platform",
    sourceUrl: "https://github.com/example/workflow-platform",
    fetchedAt: new Date("2026-05-03T09:00:00.000Z").toISOString(),
    repo: {
      owner: "example",
      repo: "workflow-platform",
      branch: "main",
      sourceUrl: "https://github.com/example/workflow-platform",
    },
    overviewFiles: [
      "README.md",
      "CONTRIBUTING.md",
      "docs/architecture.mdx",
      "package.json",
    ],
    tabs: [
      {
        id: "README.md",
        path: "README.md",
        kind: "markdown",
        title: "README",
        priority: 100,
        fetched: true,
        rawUrl: "https://raw.githubusercontent.com/example/workflow-platform/main/README.md",
        size: 1290,
        includedInOverview: true,
      },
      {
        id: "CONTRIBUTING.md",
        path: "CONTRIBUTING.md",
        kind: "markdown",
        title: "CONTRIBUTING",
        priority: 97,
        fetched: true,
        rawUrl:
          "https://raw.githubusercontent.com/example/workflow-platform/main/CONTRIBUTING.md",
        size: 940,
        includedInOverview: true,
      },
      {
        id: "docs/architecture.mdx",
        path: "docs/architecture.mdx",
        kind: "markdown",
        title: "Architecture",
        priority: 86,
        fetched: true,
        rawUrl:
          "https://raw.githubusercontent.com/example/workflow-platform/main/docs/architecture.mdx",
        size: 1080,
        includedInOverview: true,
      },
      {
        id: "package.json",
        path: "package.json",
        kind: "manifest",
        manifestType: "package-json",
        title: "Root package.json",
        priority: 84,
        fetched: true,
        rawUrl: "https://raw.githubusercontent.com/example/workflow-platform/main/package.json",
        size: 670,
        includedInOverview: true,
      },
    ],
    selectedTabId: "overview",
    contentCache: {
      "README.md": `# Workflow Platform

Workflow Platform lets teams design automation pipelines with a visual editor, run them on a worker cluster, and inspect results in a monitoring console.

## Core pieces

- Next.js web app for the dashboard and workflow editor
- API gateway for auth, run creation, and webhook ingestion
- PostgreSQL for users, projects, workflow definitions, and run metadata
- Redis queue for dispatching jobs to workers
- Worker service that executes workflow steps and writes logs
- Object storage for large artifacts and exported results

## User flow

1. A user signs in to the dashboard.
2. They create a workflow in the editor.
3. The dashboard sends the definition to the API gateway.
4. The gateway stores metadata in PostgreSQL and pushes execution jobs into Redis.
5. Workers pull jobs, execute steps, and write logs plus artifact references.
6. The dashboard reads run status from PostgreSQL and artifact links from object storage.`,
      "CONTRIBUTING.md": `# Contributing

Use pnpm for all workspace commands.
Run \`pnpm install\` at the root, then \`pnpm dev\` to launch the dashboard locally.

Changes to workflow execution should include updates to the worker service and the shared run schema.
Changes to the editor should include screenshots and a short QA checklist.
All pull requests should explain whether they touch the API gateway, worker queue, or storage layout.`,
      "docs/architecture.mdx": `# Architecture

The dashboard and editor live in a Next.js app.
The API gateway handles auth, workflow persistence, run creation, and webhook ingestion.
Redis is used as the queue between the gateway and the worker fleet.
Workers execute workflow steps and write run logs plus artifact references.
PostgreSQL stores users, projects, workflow definitions, and run metadata.
Object storage holds exported results and large artifacts.`,
      "package.json": `{
  "name": "workflow-platform",
  "private": true,
  "packageManager": "pnpm@10.2.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "ai": "^6.0.0"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0"
  }
}`,
    },
    totalMatchedFiles: 4,
    truncated: false,
  };
}

export const sampleSources: SampleSource[] = [
  {
    id: "lease-calculator",
    eyebrow: "Calculator demo",
    title: "Commercial lease penalty rules",
    description: "Turns dense penalty logic into sliders and projected outcomes.",
    source: {
      kind: "text",
      label: "Lease default policy excerpt",
      text: `Lease default policy

If a tenant terminates early, the landlord charges:
- a base reletting fee of $1,200
- 35% of the remaining monthly rent obligation
- an additional vacancy risk premium of $450 if fewer than 4 months remain
- an additional cleaning and repairs allowance of $300 to $1,100 depending on unit condition

Monthly rent ranges from $1,200 to $3,800.
Remaining term can range from 1 to 18 months.
Condition severity can be modeled from 0 to 10, where 0 means no repairs and 10 means extensive turnover work.

The goal is to help a tenant estimate a likely early termination payment and understand which factors change the result the most.`,
    },
  },
  {
    id: "repo-graph",
    eyebrow: "Repo dashboard demo",
    title: "Workflow platform repository",
    description: "Shows Overview + file tabs + an interactive architecture canvas.",
    source: buildWorkflowRepoSample(),
  },
  {
    id: "manual-simulator",
    eyebrow: "Simulator demo",
    title: "Incident response playbook",
    description: "Turns if/then operational guidance into a guided decision path.",
    source: {
      kind: "text",
      label: "Incident response playbook",
      text: `Incident response quick guide

When an incident is reported, first classify whether customer data is affected.
If customer data is involved, escalate immediately to the security lead and legal contact.
If the incident is isolated to internal tooling, triage with the platform team first.

Next determine current impact:
- critical if production is down or data integrity is at risk
- elevated if major features are degraded
- moderate if a workaround exists

Containment comes before root cause. Revoke credentials, disable failing automations, or pause outbound jobs if they could spread impact.

External communication is only approved when severity is critical or customer-visible and after the incident lead confirms the scope.

The desired output is a simple guided simulator that helps an on-call operator choose the right next action quickly.`,
    },
  },
  {
    id: "pdf-brief",
    eyebrow: "PDF breakdown demo",
    title: "Quarterly climate resilience brief",
    description: "Shows PDF extraction, section cards, metrics, and a generated MVP site route.",
    source: {
      kind: "pdf",
      label: "climate-resilience-brief.pdf",
      fileName: "climate-resilience-brief.pdf",
      text: `Executive Summary

The city is preparing a three-year resilience program focused on heat mitigation, flood readiness, and emergency shelter capacity.
The brief proposes a capital budget of $12.4 million and a 24-month phased delivery schedule.

Heat Mitigation

Priority neighborhoods will receive 18 new cooling corridors, 240 shade trees, and reflective surface retrofits around schools and clinics.
The target is to reduce peak surface temperatures by 7% during summer months.

Flood Readiness

Stormwater drainage upgrades are recommended across four districts, with a contingency reserve of $1.8 million for seasonal overruns.
The brief recommends adding public flood map dashboards and block-level alert thresholds.

Shelter Operations

The plan expands emergency shelter capacity from 420 beds to 680 beds and proposes a staffing reserve model for extreme weather events.
The operating model assumes two activation tiers: elevated alert and critical alert.`,
      fetchedAt: new Date("2026-05-03T09:05:00.000Z").toISOString(),
      uploadedAt: new Date("2026-05-03T09:05:00.000Z").toISOString(),
      pageCount: 6,
      parseStatus: "ready",
      sections: [
        {
          id: "section-1",
          heading: "Executive Summary",
          summary: "Introduces a three-year resilience program with a $12.4 million budget and phased delivery plan.",
          pageStart: 1,
          pageEnd: 1,
          excerpt:
            "The city is preparing a three-year resilience program focused on heat mitigation, flood readiness, and emergency shelter capacity.",
        },
        {
          id: "section-2",
          heading: "Heat Mitigation",
          summary: "Outlines cooling corridors, tree planting, and reflective retrofits to reduce peak heat impact.",
          pageStart: 2,
          pageEnd: 3,
          excerpt:
            "Priority neighborhoods will receive 18 new cooling corridors, 240 shade trees, and reflective surface retrofits around schools and clinics.",
        },
        {
          id: "section-3",
          heading: "Flood Readiness",
          summary: "Covers drainage upgrades, contingency reserve planning, and public flood dashboards.",
          pageStart: 4,
          pageEnd: 5,
          excerpt:
            "Stormwater drainage upgrades are recommended across four districts, with a contingency reserve of $1.8 million for seasonal overruns.",
        },
      ],
    },
  },
];
