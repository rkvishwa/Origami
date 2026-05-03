import { ArrowUpRight, LayoutTemplate, Loader2, Sparkles } from "lucide-react";

import type { MvpSiteArtifact } from "@/lib/types";

export type MvpSiteGenerationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; artifact: MvpSiteArtifact }
  | { status: "error"; error: string };

type MvpSitePanelProps = {
  sourceLabel: string;
  generationState: MvpSiteGenerationState;
  onGenerate: () => void;
  onOpenArtifact: () => void;
};

export function MvpSitePanel({
  sourceLabel,
  generationState,
  onGenerate,
  onOpenArtifact,
}: MvpSitePanelProps) {
  if (generationState.status === "idle") {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              v0 MVP
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white/90">
              Build a single-page MVP for {sourceLabel}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
              Origami will generate an in-app website route with grounded content and copyable
              React/Tailwind code.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16"
            onClick={onGenerate}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            Generate site
          </button>
        </div>
      </div>
    );
  }

  if (generationState.status === "loading") {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 className="h-6 w-6 animate-spin text-lime-300" />
          <p className="text-sm">Generating the in-app MVP site…</p>
        </div>
      </div>
    );
  }

  if (generationState.status === "error") {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-6 text-sm text-red-50">
        {generationState.error}
      </div>
    );
  }

  const artifact = generationState.artifact;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-[#111] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              v0 MVP
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white/92">{artifact.appTitle}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{artifact.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 transition hover:border-white/20 hover:bg-white/[0.08]"
              onClick={onGenerate}
              type="button"
            >
              <LayoutTemplate className="h-4 w-4" />
              Regenerate
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16"
              onClick={onOpenArtifact}
              type="button"
            >
              <ArrowUpRight className="h-4 w-4" />
              Open page
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Stats</div>
          <div className="mt-3 text-2xl font-semibold text-white/90">
            {artifact.siteSpec.stats.length}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/56">Source-aware headline metrics.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Features</div>
          <div className="mt-3 text-2xl font-semibold text-white/90">
            {artifact.siteSpec.featureCards.length}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Rough product capabilities or content pillars.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Code</div>
          <div className="mt-3 text-2xl font-semibold text-white/90">1 page</div>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Copyable React/Tailwind output is available in the preview route.
          </p>
        </div>
      </div>
    </div>
  );
}
