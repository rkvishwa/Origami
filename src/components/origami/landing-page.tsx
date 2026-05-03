"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FileText, FolderGit2,
  Sparkles, Zap, Globe, Code2, Heart, ChevronRight 
} from "lucide-react";

import { sampleSources } from "@/lib/samples";
import { SiteNavbar } from "@/components/origami/site-navbar";

const TECH_STACK = [
  { name: "v0", description: "Front end developed by v0 for rapid prototyping and high-fidelity design", category: "Frontend" },
  { name: "Vercel AI SDK", description: "Streaming AI responses, tool calling, and useChat hook", category: "AI" },
  { name: "OpenAI GPT-5.5", description: "State-of-the-art reasoning model powering all analysis and generation", category: "AI" },
  { name: "React Flow", description: "Interactive node-graph rendering for architecture diagrams", category: "Visualization" },
  { name: "Tailwind CSS", description: "Utility-first styling with a curated dark design system", category: "Styling" },
  { name: "TypeScript", description: "End-to-end type safety across the full stack", category: "Language" },
];

const TEAM_VALUES = [
  { icon: Zap, title: "Speed above all", description: "From source to interactive workspace in under 10 seconds. We obsess over latency at every step of the pipeline." },
  { icon: Globe, title: "Universal intake", description: "Any document format, any domain. If it contains information, Origami can fold it into something useful." },
  { icon: Code2, title: "Developer-first", description: "Built by developers, for developers. Every API is clean, every component is composable, every output is copyable." },
  { icon: Heart, title: "Open by default", description: "We believe AI tooling should be transparent. The source is readable, the outputs are auditable, the logic is explainable." },
];

const TIMELINE = [
  { date: "Q1 2025", title: "Concept", description: "Initial prototype exploring AI-powered document analysis with a basic chat interface." },
  { date: "Q2 2025", title: "Source engine", description: "Built the universal source intake system supporting PDF, text, and GitHub repos." },
  { date: "Q3 2025", title: "Interactive canvas", description: "Introduced the streaming architecture graph and interactive breakdown components." },
  { date: "Q4 2025", title: "v0 MVP generator", description: "Launched one-click single-page app generation from any source document." },
  { date: "Q1 2026", title: "Workspace v2", description: "Redesigned the workspace with tabbed sidebar, drawer UI, and Q&A functionality." },
];

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="group relative p-10 text-center transition-colors hover:bg-white/[0.02]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-300/0 to-transparent transition-all duration-500 group-hover:via-lime-300/50" />
      <p className="mb-2 text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:text-lime-300 group-hover:drop-shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all">
        {value}
      </p>
      <p className="text-sm font-medium tracking-wide text-[#71717A] uppercase group-hover:text-[#A1A1AA] transition-colors">{label}</p>
    </div>
  );
}

function FeatureTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-1.5 text-sm font-bold tracking-wide text-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.15)] uppercase">
      {children}
    </span>
  );
}

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30 overflow-hidden">
      <SiteNavbar />

      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-16 md:pt-24 relative z-10">
        {/* Ambient Light */}
        <div className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 w-[1000px] h-[500px] bg-lime-300/5 blur-[150px] rounded-full z-0" />

        {/* Hero Section */}
        <div className="mx-auto max-w-[800px] text-center mb-24 relative z-10">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-lime-300/10 blur-[120px]" />
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-lime-300/60 mb-6 pb-2 relative z-10 drop-shadow-lg">
            The Universal Interactive Engine
          </h1>
          <p className="text-lg md:text-xl text-[#A1A1AA] max-w-[600px] mx-auto leading-relaxed relative z-10 mb-8 font-medium">
            Upload a PDF, scan a repository, or paste raw text. Origami breaks it down, streams an interactive explanation, and generates a **v0-powered MVP route** in seconds.
          </p>
          
          <div className="flex justify-center gap-4 relative z-10">
            <Link
              href="/workspace"
              className="group relative inline-flex items-center gap-2 rounded-full bg-lime-300 px-8 py-4 text-base font-bold text-black transition-all hover:bg-lime-400 hover:scale-105 hover:shadow-[0_0_40px_rgba(163,230,53,0.4)] overflow-hidden"
            >
              <span className="relative z-10">Launch Workspace</span>
              <ChevronRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1s_ease-in-out_infinite]" />
            </Link>
          </div>
        </div>

        {/* Catalog Section */}
        <div className="mb-32 relative z-10">
          <div className="mb-12 flex flex-col items-center justify-center text-center gap-4 border-b border-white/5 pb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Explore Workspaces</h2>
            <p className="text-base text-[#A1A1AA] max-w-2xl">Discover interactive canvases generated automatically from source documents. Click to experience real-time AI transformations.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sampleSources.map((sample) => (
              <button
                key={sample.id}
                onClick={() => router.push(`/workspace?sample=${sample.id}`)}
                className="group relative flex cursor-pointer flex-col items-start rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition-all duration-500 hover:-translate-y-2 hover:border-lime-300/30 overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-300/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white/70 shadow-lg transition-colors group-hover:border-lime-300/40 group-hover:bg-lime-300/20 group-hover:text-lime-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="relative z-10 mb-3 text-xs font-bold uppercase tracking-[0.15em] text-lime-300/70 transition-colors group-hover:text-lime-300">
                  {sample.eyebrow}
                </div>
                <h3 className="relative z-10 mb-3 text-lg font-semibold text-white leading-snug group-hover:text-lime-50 transition-colors">
                  {sample.title}
                </h3>
                <p className="relative z-10 text-sm text-[#A1A1AA] leading-relaxed group-hover:text-[#D4D4D8] transition-colors">
                  {sample.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="relative mb-32 rounded-3xl border border-white/10 bg-[#050505] overflow-hidden shadow-2xl">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-white/5 relative z-10">
            <StatCard value="3" label="Source formats" />
            <StatCard value="10s" label="Avg workspace load" />
            <StatCard value="5+" label="Interactive components" />
            <StatCard value="∞" label="Documents to fold" />
          </div>
        </div>

        {/* ── Feature 1: GitHub Repo Scanner ── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.05),transparent_70%)] pointer-events-none" />

          <div className="grid gap-16 lg:grid-cols-2 items-center relative z-10">
            <div className="space-y-8">
              <FeatureTag>GitHub Integration</FeatureTag>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-sm">
                Scan any repo.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500">Understand it instantly.</span>
              </h2>
              <p className="text-lg leading-relaxed text-[#A1A1AA]">
                Paste a public GitHub URL and Origami crawls every README, CONTRIBUTING guide, and package manifest across the entire default branch. No cloning, no setup — just instant understanding.
              </p>
              <ul className="space-y-4">
                {[
                  "Automatic discovery of markdown & manifest files",
                  "Per-file AI analysis with cross-reference awareness",
                  "Architecture graph generated from real repo structure",
                  "Dependency dashboard from package.json / pyproject.toml",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 group">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-300/10 text-lime-300 border border-lime-300/20 group-hover:scale-110 transition-transform">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span className="text-[#D4D4D8]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-lime-300/20 via-transparent to-white/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A]/90 backdrop-blur-2xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {/* Mock Browser/Terminal Header */}
                <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-lime-300/20 bg-lime-300/5 px-4 py-4 mb-6 shadow-[inset_0_0_20px_rgba(163,230,53,0.05)]">
                  <FolderGit2 className="h-5 w-5 text-lime-400 shrink-0 animate-pulse" />
                  <span className="text-sm font-mono text-lime-100/90 truncate tracking-wide">github.com/vercel/next.js</span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "README.md", status: "analyzed", color: "bg-lime-400" },
                    { name: "package.json", status: "analyzed", color: "bg-lime-400" },
                    { name: "src/app/layout.tsx", status: "analyzed", color: "bg-lime-400" },
                    { name: "docs/routing.md", status: "pending", color: "bg-white/20" },
                  ].map((f) => (
                    <div key={f.name} className="flex items-center justify-between rounded-lg px-4 py-3 bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${f.color}`} />
                        <span className="text-sm font-mono text-[#A1A1AA]">{f.name}</span>
                      </div>
                      {f.status === "analyzed" && (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-lime-400/80 px-2 py-1 rounded-md bg-lime-400/10 border border-lime-400/20">
                          Ready
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature 2: Interactive Canvas ── */}
        <section className="py-24 relative overflow-hidden">
          <div className="grid gap-16 lg:grid-cols-2 items-center relative z-10">
            <div className="order-2 lg:order-1 relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tl from-blue-400/20 via-transparent to-lime-300/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A]/90 backdrop-blur-2xl p-8 shadow-2xl">
                <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">Canvas Capabilities</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Architecture Graph", color: "border-lime-300/30 bg-lime-300/5 text-lime-300 hover:bg-lime-300/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(163,230,53,0.15)]", delay: "delay-0" },
                    { label: "Package Dashboard", color: "border-purple-400/30 bg-purple-400/5 text-purple-300 hover:bg-purple-400/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(192,132,252,0.15)]", delay: "delay-75" },
                    { label: "Scenario Simulator", color: "border-blue-400/30 bg-blue-400/5 text-blue-300 hover:bg-blue-400/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]", delay: "delay-150" },
                    { label: "Data Flow Maps", color: "border-orange-400/30 bg-orange-400/5 text-orange-300 hover:bg-orange-400/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(251,146,60,0.15)]", delay: "delay-200" },
                  ].map((c) => (
                    <div key={c.label} className={`rounded-xl border p-5 text-sm font-semibold flex items-center justify-center text-center h-28 transition-all duration-300 cursor-pointer backdrop-blur-sm ${c.color} ${c.delay}`}>
                      {c.label}
                    </div>
                  ))}
                </div>
                
                <div className="rounded-xl border border-white/10 bg-black/80 px-6 py-5 text-sm text-[#A1A1AA] font-mono leading-relaxed relative overflow-hidden group-hover:border-white/20 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-lime-300 to-transparent" />
                  AI dynamically streams the best interactive component based on the exact source payload structure.
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <FeatureTag>Generative UI</FeatureTag>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-sm">
                Stream live, interactive<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-lime-300">AI components.</span>
              </h2>
              <p className="text-lg leading-relaxed text-[#A1A1AA]">
                The interactive canvas isn&apos;t just a static summary. Origami streams a real-time, AI-selected component — architecture graph, scenario simulator, or package dashboard — purpose-built for your exact source type.
              </p>
              <ul className="space-y-4">
                {[
                  "Force-directed architecture graph for repos",
                  "Real-time streaming with instant rendering",
                  "Full-screen expandable modals for deep dives",
                  "Automatically re-analyzes on source mutation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 group">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20 group-hover:scale-110 transition-transform">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span className="text-[#D4D4D8]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Feature 3: v0 MVP Generator ── */}
        <section className="py-24 relative overflow-hidden">
          <div className="grid gap-16 lg:grid-cols-2 items-center relative z-10">
            <div className="space-y-8">
              <FeatureTag>Powered by v0</FeatureTag>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-sm">
                From source to app.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-white">Ready to ship.</span>
              </h2>
              <p className="text-lg leading-relaxed text-[#A1A1AA]">
                The **v0 MVP Builder** reads your source, understands the domain, and produces a fully self-contained, responsive single-page web app — styled, interactive, and powered by the v0 API.
              </p>
              <ul className="space-y-4">
                {[
                  "Complete HTML/CSS/JS app with zero external config",
                  "Domain-aware design adapts to your specific content",
                  "Persisted in-browser with a shareable /mvp/[id] link",
                  "Copy entire source as a standalone file in one click",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 group">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-300/10 text-lime-300 border border-lime-300/20 group-hover:scale-110 transition-transform">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span className="text-[#D4D4D8]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-white/20 via-lime-300/10 to-transparent blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-700" />
              <div className="relative rounded-2xl border border-lime-300/30 bg-[#0A0A0A]/95 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(163,230,53,0.1)] overflow-hidden">
                <div className="absolute -top-12 -right-12 p-6 opacity-[0.03] transform rotate-12 scale-150 pointer-events-none">
                  <Sparkles className="h-64 w-64 text-lime-300" />
                </div>
                
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300/20 to-transparent border border-lime-300/30 shadow-[0_0_15px_rgba(163,230,53,0.2)]">
                    <Sparkles className="h-6 w-6 text-lime-300" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-lime-300 uppercase tracking-[0.2em] block mb-1">Pipeline Engine</span>
                    <span className="text-xs text-[#A1A1AA] font-mono">v0-api-v1.4.2</span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {[
                    { text: "Source payload extracted", active: true },
                    { text: "Domain context analyzed by AI", active: true },
                    { text: "POST → /api/v0-preview", active: true, highlight: true },
                    { text: "Building HTML/CSS/JS chunks...", active: false, pulsing: true },
                    { text: "MVP ready at /mvp/[id]", active: false },
                  ].map((step, i) => (
                    <div key={step.text} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                      step.highlight ? 'bg-lime-300/5 border-lime-300/30 shadow-[0_0_15px_rgba(163,230,53,0.1)]' : 
                      step.active ? 'bg-white/[0.03] border-white/10' : 
                      'bg-transparent border-white/5 opacity-50'
                    }`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.highlight ? 'bg-lime-300 text-black shadow-[0_0_10px_rgba(163,230,53,0.5)]' :
                        step.active ? 'bg-white/10 text-white' : 
                        step.pulsing ? 'bg-white/5 text-white/50 animate-pulse' :
                        'bg-white/5 text-white/50'
                      }`}>
                        {step.active && !step.highlight ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : i + 1}
                      </div>
                      <span className={`text-sm font-medium ${step.highlight ? 'text-lime-300 font-mono' : 'text-white/80'}`}>{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="py-24 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="mb-16 text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-[0.2em] text-[#A1A1AA] mb-4 shadow-sm">Core Philosophy</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">What drives Origami</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {TEAM_VALUES.map((v) => (
              <div key={v.title} className="group relative rounded-3xl border border-white/10 bg-[#050505] p-10 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-lime-300/30 hover:shadow-[0_10px_40px_-10px_rgba(163,230,53,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-3xl pointer-events-none" />
                
                <div className="relative z-10 mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60 transition-all duration-500 group-hover:border-lime-300/30 group-hover:bg-lime-300/10 group-hover:text-lime-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="relative z-10 mb-4 text-2xl font-bold text-white tracking-tight">{v.title}</h3>
                <p className="relative z-10 text-[16px] leading-relaxed text-[#A1A1AA]">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ── */}
        <section className="py-24 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="max-w-4xl mx-auto">
            <div className="mb-20 text-center">
              <span className="inline-block py-1.5 px-4 rounded-full bg-lime-300/10 border border-lime-300/20 text-xs font-bold uppercase tracking-[0.2em] text-lime-300 mb-4 shadow-[0_0_15px_rgba(163,230,53,0.1)]">Evolution</span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">How we got here</h2>
            </div>
            
            <div className="relative">
              {/* Glowing Line */}
              <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-4 bottom-4 w-1 bg-white/5 rounded-full" />
              <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-4 h-1/2 w-1 bg-gradient-to-b from-lime-400 via-lime-300 to-transparent rounded-full shadow-[0_0_15px_rgba(163,230,53,0.5)]" />

              <div className="flex flex-col gap-12 md:gap-24 relative z-10">
                {TIMELINE.map((item, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <div key={i} className={`flex flex-col md:flex-row gap-8 md:gap-0 relative group`}>
                      {/* Dot */}
                      <div className="absolute left-[1.6rem] md:left-1/2 -translate-x-1/2 top-2 h-5 w-5 rounded-full border-4 border-[#000] bg-white/20 group-hover:bg-lime-300 group-hover:scale-125 transition-all duration-300 shadow-[0_0_0_2px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(163,230,53,0.6)] z-20" />
                      
                      {/* Left Content (or date on mobile) */}
                      <div className={`md:w-1/2 ${isEven ? 'md:pr-16 md:text-right' : 'md:pl-16 md:order-2'} pl-20 md:pl-0`}>
                        <div className="md:hidden mb-2">
                           <span className="inline-block px-3 py-1 rounded-md bg-lime-300/10 text-xs font-mono font-bold text-lime-300">{item.date}</span>
                        </div>
                        <h3 className="mb-3 text-2xl font-bold text-white group-hover:text-lime-50 transition-colors">{item.title}</h3>
                        <p className="text-[16px] text-[#A1A1AA] leading-relaxed group-hover:text-[#D4D4D8] transition-colors">{item.description}</p>
                      </div>

                      {/* Right Content (Date on desktop) */}
                      <div className={`hidden md:flex md:w-1/2 items-start ${isEven ? 'md:pl-16' : 'md:pr-16 justify-end md:order-1'}`}>
                        <span className="inline-block px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono font-bold text-[#A1A1AA] group-hover:bg-lime-300/10 group-hover:border-lime-300/30 group-hover:text-lime-300 transition-all duration-300 shadow-sm">{item.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Tech Stack ── */}
        <section className="py-24 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">Built with the best</h2>
            <p className="text-[#A1A1AA] max-w-2xl mx-auto text-lg font-medium">A modern, edge-ready stack optimized for speed, reliability, and real-time generation.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="group relative rounded-2xl bg-[#0A0A0A] p-[1px] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                {/* Animated Border Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/0 to-white/10 group-hover:from-lime-300/50 group-hover:via-white/5 group-hover:to-lime-300/20 opacity-50 transition-colors duration-500" />
                
                <div className="relative h-full rounded-[15px] bg-[#0A0A0A] p-7 flex flex-col z-10">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold text-white transition-colors group-hover:text-lime-300">{tech.name}</h3>
                    <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] transition-colors group-hover:bg-lime-300/10 group-hover:border-lime-300/30 group-hover:text-lime-300 shadow-sm">{tech.category}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#71717A] mt-auto transition-colors group-hover:text-[#A1A1AA]">{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Brand ── */}
        <section className="py-24 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="mb-16 text-center">
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-[0.2em] text-[#A1A1AA] mb-4 shadow-sm">Design System</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">The Origami identity</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 max-w-5xl mx-auto">
            <div className="group relative rounded-3xl p-1 overflow-hidden transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
              <div className="relative h-full flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8 rounded-[23px] bg-[#0A0A0A] p-10">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl group-hover:border-white/30 transition-colors">
                  <Image src="/icon.png" alt="Origami icon" width={72} height={72} className="h-full w-full object-contain p-3 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div>
                  <p className="mb-3 text-2xl font-bold text-white tracking-tight">Origami</p>
                  <p className="text-[15px] text-[#A1A1AA] leading-relaxed">The word &quot;origami&quot; means folding paper — transforming something flat into something dimensional and meaningful. We do the same for your data.</p>
                </div>
              </div>
            </div>
            
            <div className="group relative rounded-3xl p-1 overflow-hidden transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-300/30 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative h-full flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8 rounded-[23px] bg-[#0A0A0A] p-10">
                <div className="h-24 w-24 shrink-0 rounded-2xl bg-lime-300 shadow-[0_0_30px_rgba(163,230,53,0.3)] group-hover:shadow-[0_0_50px_rgba(163,230,53,0.6)] group-hover:scale-105 transition-all duration-500" />
                <div>
                  <p className="mb-3 text-2xl font-mono font-bold text-white tracking-tight">#CCFF00</p>
                  <p className="text-[15px] text-[#A1A1AA] leading-relaxed">Lime 300 — chosen for its vibrancy, representing energy, clarity, and rapid digital growth against our pure dark mode canvas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="py-32 text-center relative">
          <div className="relative mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-[#050505] p-16 md:p-24 overflow-hidden shadow-2xl group">
            {/* Massive Glowing Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.1),transparent_50%)] pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-50" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300/20 to-lime-300/5 border border-lime-300/30 shadow-[0_0_40px_rgba(163,230,53,0.3)]">
                <Sparkles className="h-10 w-10 text-lime-300 animate-pulse" />
              </div>
              <h2 className="mb-6 text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-b from-lime-300 to-lime-500">fold?</span>
              </h2>
              <p className="mb-12 text-xl text-[#A1A1AA] max-w-[600px] mx-auto leading-relaxed">
                Upload a PDF, paste a GitHub link, or drop in raw text. Your interactive workspace is generated in seconds.
              </p>
              
              <Link href="/workspace" className="group/btn relative inline-flex items-center gap-3 rounded-full bg-lime-300 px-10 py-5 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-lime-400 overflow-hidden shadow-[0_0_40px_rgba(163,230,53,0.3)] hover:shadow-[0_0_60px_rgba(163,230,53,0.5)]">
                <span className="relative z-10">Launch Workspace</span>
                <ChevronRight className="relative z-10 h-6 w-6 transition-transform group-hover/btn:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_1s_ease-in-out_infinite]" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
