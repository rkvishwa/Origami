"use client";

import Link from "next/link";
import { SiteNavbar } from "@/components/origami/site-navbar";
import {
  BookOpen,
  FolderGit2,
  FileText,
  Terminal,
  UploadCloud,
  Sparkles,
  Zap,
  Code2,
  ChevronRight,
} from "lucide-react";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "sources", label: "Source Types" },
  { id: "workspace", label: "Workspace" },
  { id: "interactive", label: "Interactive Canvas" },
  { id: "v0-mvp", label: "v0 MVP Generation" },
  { id: "api", label: "API Reference" },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-lime-300/20 bg-lime-300/10 px-2.5 py-0.5 text-xs font-medium text-lime-300">
      {children}
    </span>
  );
}


function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-xl border border-white/10 bg-[#0A0A0A] p-5 transition-all hover:border-white/20">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lime-300/30 bg-lime-300/10 text-sm font-bold text-lime-300">
        {step}
      </div>
      <div>
        <h4 className="mb-1.5 text-sm font-semibold text-white">{title}</h4>
        <div className="text-sm leading-relaxed text-white/60">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ id, icon: Icon, title, badge }: { id: string; icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-4 scroll-mt-24">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <Icon className="h-4 w-4 text-lime-300" />
      </div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {badge && <Badge>{badge}</Badge>}
    </div>
  );
}

export function DocsPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30">
      <SiteNavbar />

      <div className="mx-auto max-w-[1200px] px-6 pb-32 pt-16">
        <div className="flex gap-12">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">On this page</p>
              <nav className="flex flex-col gap-1">
                {SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-lime-300" />
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-16">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                <BookOpen className="h-3 w-3 text-lime-300" />
                Documentation
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-4">
                How Origami Works
              </h1>
              <p className="text-lg text-white/50 max-w-[600px] leading-relaxed">
                Everything you need to understand how to fold your documents, repositories, and raw text into interactive AI-powered mini-apps.
              </p>
            </div>

            {/* Divider */}
            <div className="mb-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Getting Started */}
            <section className="mb-14">
              <SectionHeading id="getting-started" icon={Zap} title="Getting Started" badge="Start here" />
              <p className="mb-6 text-sm leading-relaxed text-white/60">
                Origami is a universal interactive document engine. Give it any source — a GitHub repository, a PDF, or plain text — and it builds you an interactive, AI-powered workspace in seconds.
              </p>
              <div className="flex flex-col gap-3">
                <StepCard step={1} title="Choose your source">
                  Select from three intake modes on the home page: <strong className="text-white">Import Repository</strong>, <strong className="text-white">Paste Source Text</strong>, or <strong className="text-white">Upload Documents</strong>.
                </StepCard>
                <StepCard step={2} title="Load the workspace">
                  Origami fetches and parses your source, then drops you into the workspace dashboard with a live source panel, breakdown, and interactive canvas.
                </StepCard>
                <StepCard step={3} title="Generate interactive artifacts">
                  Click <strong className="text-white">Generate Interactive</strong> to produce an AI-streamed architecture graph, or <strong className="text-white">v0 MVP</strong> to spin up a full single-page mini-app.
                </StepCard>
              </div>
            </section>

            {/* Sources */}
            <section className="mb-14">
              <SectionHeading id="sources" icon={FileText} title="Source Types" />
              <p className="mb-6 text-sm leading-relaxed text-white/60">
                Origami supports three source types, each with its own intake flow and breakdown experience.
              </p>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                {[
                  {
                    icon: FolderGit2,
                    title: "GitHub Repository",
                    description: "Paste any public GitHub URL. Origami fetches every markdown file, manifest, and README across the default branch.",
                    tip: "Best for architecture diagrams and dependency graphs",
                  },
                  {
                    icon: FileText,
                    title: "PDF Document",
                    description: "Upload a PDF and Origami extracts all text content page-by-page, then generates a structured insight breakdown.",
                    tip: "Best for research papers, reports, and policies",
                  },
                  {
                    icon: Terminal,
                    title: "Plain Text",
                    description: "Paste raw text directly or upload .txt, .md, .csv, .json, .ts, or .yaml files for instant AI analysis.",
                    tip: "Best for specs, logs, and configuration files",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5 transition-all hover:border-white/20">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <item.icon className="h-4 w-4 text-lime-300" />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mb-3 text-xs leading-relaxed text-white/50">{item.description}</p>
                    <p className="text-[11px] text-lime-300/70 italic">{item.tip}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">Supported file extensions</p>
                <div className="flex flex-wrap gap-2">
                  {[".pdf", ".txt", ".md", ".mdx", ".json", ".yaml", ".yml", ".csv", ".ts", ".tsx", ".js", ".jsx"].map((ext) => (
                    <span key={ext} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-white/60">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Workspace */}
            <section className="mb-14">
              <SectionHeading id="workspace" icon={UploadCloud} title="Workspace" />
              <p className="mb-6 text-sm leading-relaxed text-white/60">
                The workspace is a three-panel dashboard that lets you explore, question, and generate artifacts from your source.
              </p>

              <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
                <div className="border-b border-white/10 px-5 py-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">Panel layout</p>
                </div>
                <div className="p-5">
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-lg border border-lime-300/20 bg-lime-300/5 p-4">
                      <p className="mb-1 text-xs font-semibold text-lime-300">Interactive Canvas</p>
                      <p className="text-xs text-white/50">AI-streamed architecture graphs, calculators, and scenario simulators.</p>
                    </div>
                    <div className="w-40 shrink-0 flex flex-col gap-2">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="mb-0.5 text-[10px] font-semibold text-white/60">Source</p>
                        <p className="text-[10px] text-white/40">Raw content viewer</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="mb-0.5 text-[10px] font-semibold text-white/60">Breakdown</p>
                        <p className="text-[10px] text-white/40">AI insight cards</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="mb-0.5 text-[10px] font-semibold text-white/60">v0 MVP</p>
                        <p className="text-[10px] text-white/40">Generated site</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Source Panel", description: "View the raw extracted content from your source. For repos, switch between tabs for each file. For PDFs, see the extracted page text." },
                  { title: "Breakdown Panel", description: "AI-generated insight cards: summary, key entities, themes, action items, and architecture notes." },
                  { title: "Q&A Box", description: "Ask follow-up questions about any source directly inside the workspace. Answers are grounded in the source content." },
                  { title: "Repo Navigator", description: "For GitHub sources, navigate between README, CONTRIBUTING, and other docs via the tab bar." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-[#0A0A0A] p-4 transition-all hover:border-white/20">
                    <h3 className="mb-1.5 text-sm font-semibold text-white">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-white/50">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Interactive Canvas */}
            <section className="mb-14">
              <SectionHeading id="interactive" icon={Sparkles} title="Interactive Canvas" />
              <p className="mb-4 text-sm leading-relaxed text-white/60">
                The interactive canvas is the heart of Origami. Clicking <strong className="text-white">Generate Interactive</strong> sends your source to the AI, which selects and builds the most appropriate interactive component.
              </p>

              <div className="mb-6 flex flex-col gap-3">
                {[
                  { name: "Architecture Graph", desc: "For repos and technical docs — renders a force-directed node graph of system components and relationships.", tag: "repo / text" },
                  { name: "PDF Insight Cards", desc: "For PDFs — generates themed breakdown cards with entity recognition, themes, and cross-references.", tag: "pdf" },
                  { name: "Scenario Simulator", desc: "For policy or rule-based docs — simulates real-world scenarios to test outcomes against the source rules.", tag: "text" },
                  { name: "Package Dashboard", desc: "For manifest files (package.json, pyproject.toml) — renders a dependency and script dashboard.", tag: "manifest" },
                ].map((item) => (
                  <div key={item.name} className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#0A0A0A] px-5 py-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/40">{item.tag}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-white/50">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* v0 MVP */}
            <section className="mb-14">
              <SectionHeading id="v0-mvp" icon={Zap} title="v0 MVP Generation" badge="AI powered" />
              <p className="mb-4 text-sm leading-relaxed text-white/60">
                The <strong className="text-white">v0 MVP</strong> feature generates a fully self-contained single-page web app from your source in one click. The output is persisted and accessible via a shareable link.
              </p>

              <div className="rounded-xl border border-lime-300/20 bg-lime-300/5 p-5 mb-6">
                <p className="text-xs font-semibold text-lime-300 mb-1">What gets generated</p>
                <ul className="list-inside list-disc space-y-1 text-xs text-white/60">
                  <li>A responsive single-page HTML/CSS/JS app tailored to the source content</li>
                  <li>Styled using a consistent design system derived from the source domain</li>
                  <li>Persisted in browser storage and accessible at <code className="text-lime-300/80">/mvp/[id]</code></li>
                  <li>Copyable as a standalone HTML file with no external dependencies</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">Flow</p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-white/60">
                  {["Source loaded", "→", "Brief generated", "→", "POST /api/v0-preview", "→", "Artifact persisted", "→", "Redirect to /mvp/[id]"].map((step, i) => (
                    <span key={i} className={step === "→" ? "text-white/20" : "rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono"}>
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section className="mb-14">
              <SectionHeading id="api" icon={Code2} title="API Reference" />
              <p className="mb-6 text-sm leading-relaxed text-white/60">
                Origami exposes several internal API routes used by the workspace. These are Next.js Route Handlers under <code className="text-white/80 text-xs font-mono">/api</code>.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  {
                    method: "POST",
                    path: "/api/github-repo",
                    description: "Fetches and parses all markdown and manifest files from a public GitHub repository URL.",
                    body: '{ "url": "https://github.com/owner/repo" }',
                  },
                  {
                    method: "POST",
                    path: "/api/pdf-extract",
                    description: "Accepts a PDF file via multipart form and returns extracted text with insight metadata.",
                    body: "FormData with field: file (PDF)",
                  },
                  {
                    method: "POST",
                    path: "/api/document-insight",
                    description: "Runs AI analysis on a text document and returns structured insight cards.",
                    body: '{ "title", "content", "sourceKind", "path", "relatedPaths" }',
                  },
                  {
                    method: "POST",
                    path: "/api/v0-preview",
                    description: "Generates a full single-page MVP site artifact from a source brief.",
                    body: '{ "sourceKind", "sourceLabel", "brief" }',
                  },
                  {
                    method: "POST",
                    path: "/api/source-qa",
                    description: "Answers a user question grounded in the active source content.",
                    body: '{ "sourceKind", "sourceLabel", "brief", "question" }',
                  },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
                    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                      <span className="rounded-md bg-lime-300/15 px-2 py-0.5 text-[10px] font-bold text-lime-300 font-mono">{endpoint.method}</span>
                      <code className="text-sm text-white/80">{endpoint.path}</code>
                    </div>
                    <div className="px-4 py-3">
                      <p className="mb-2 text-xs leading-relaxed text-white/50">{endpoint.description}</p>
                      <p className="text-[11px] font-mono text-white/30">{endpoint.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-2xl border border-lime-300/20 bg-lime-300/5 p-8 text-center">
              <h3 className="mb-2 text-xl font-semibold text-white">Ready to try it?</h3>
              <p className="mb-6 text-sm text-white/50">Open the workspace and fold your first document in seconds.</p>
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-lime-200 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]"
              >
                Open Workspace
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
