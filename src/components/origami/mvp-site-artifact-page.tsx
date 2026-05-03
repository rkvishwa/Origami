"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Sparkles, Wand2 } from "lucide-react";

import { MvpSiteRenderer } from "@/components/origami/mvp-site-renderer";
import { persistMvpArtifact, readMvpArtifact } from "@/lib/mvp-site";
import type { MvpSiteArtifact } from "@/lib/types";

type MvpSiteArtifactPageProps = {
  artifactId: string;
};

type ArtifactLoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; artifact: MvpSiteArtifact };

export function MvpSiteArtifactPage({ artifactId }: MvpSiteArtifactPageProps) {
  const [artifactState, setArtifactState] = useState<ArtifactLoadState>({ status: "loading" });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [customizationPrompt, setCustomizationPrompt] = useState("");
  const [customizationState, setCustomizationState] = useState<{
    status: "idle" | "loading" | "error";
    error?: string;
  }>({ status: "idle" });

  useEffect(() => {
    const artifact = readMvpArtifact(artifactId);
    if (!artifact) {
      setArtifactState({ status: "missing" });
      return;
    }

    setArtifactState({ status: "ready", artifact });
  }, [artifactId]);

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }

  async function handleCustomize(artifact: MvpSiteArtifact) {
    const prompt = customizationPrompt.trim();

    if (!prompt) {
      return;
    }

    setCustomizationState({ status: "loading" });

    try {
      const response = await fetch("/api/v0-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactId: artifact.id,
          sourceKind: artifact.sourceKind,
          sourceLabel: artifact.sourceLabel,
          brief: artifact.sourceBrief,
          customizationPrompt: prompt,
          currentArtifact: {
            id: artifact.id,
            appTitle: artifact.appTitle,
            summary: artifact.summary,
            sourceBrief: artifact.sourceBrief,
            customizationHistory: artifact.customizationHistory,
            siteSpec: artifact.siteSpec,
          },
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not customize the generated MVP page.");
      }

      const nextArtifact = payload as MvpSiteArtifact;
      persistMvpArtifact(nextArtifact);
      setArtifactState({ status: "ready", artifact: nextArtifact });
      setCustomizationPrompt("");
      setCustomizationState({ status: "idle" });
    } catch (error) {
      setCustomizationState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Could not customize the generated MVP page.",
      });
    }
  }

  if (artifactState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white/68">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-lime-300" />
          <p className="text-sm">Loading the generated MVP route…</p>
        </div>
      </div>
    );
  }

  if (artifactState.status === "missing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="max-w-xl rounded border border-white/10 bg-[#0A0A0A] p-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/42">Missing artifact</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/92">
            This MVP page is not stored in this browser anymore
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/58">
            Origami stores generated MVP routes in local browser storage so they survive refreshes
            and same-browser tabs. Generate the page again from the workspace to restore it.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              className="inline-flex items-center gap-2 rounded border border-lime-300/25 bg-lime-300/10 px-5 py-3 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16"
              href="/workspace"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const artifact = artifactState.artifact;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 transition hover:border-white/20 hover:bg-white/[0.08]"
              href="/workspace"
            >
              <ArrowLeft className="h-4 w-4" />
              Workspace
            </Link>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">Generated MVP</div>
              <div className="text-sm font-semibold text-white/92">{artifact.appTitle}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16"
              onClick={() => void handleCopy(artifact.code)}
              type="button"
            >
              {copyState === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy code"}
            </button>
            <a
              className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 transition hover:border-white/20 hover:bg-white/[0.08]"
              href="#generated-code"
            >
              <ExternalLink className="h-4 w-4" />
              Jump to code
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <section className="mb-6 rounded border border-white/10 bg-[#0A0A0A] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">
                Customize design
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/92">
                Prompt changes into this MVP page
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
                Ask for layout, copy, color, hierarchy, emphasis, or section changes and Origami
                will regenerate the design while keeping it grounded in the same source.
              </p>
            </div>
            <div className="rounded border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-lime-100">
              v0 customization
            </div>
          </div>

          <div className="mt-6 rounded border border-lime-500/30 bg-white/[0.02] p-5 shadow-[0_0_20px_rgba(163,230,53,0.05)] transition-all animate-border-glow focus-within:animate-none focus-within:border-lime-500/60 focus-within:ring-1 focus-within:ring-lime-500/50 focus-within:shadow-[0_0_25px_rgba(163,230,53,0.1)]">
            <textarea
              className="min-h-[112px] w-full resize-none bg-transparent text-base leading-7 text-white/90 outline-none placeholder:text-white/30"
              onChange={(event) => setCustomizationPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void handleCustomize(artifact);
                }
              }}
              placeholder="Make the hero feel more premium, switch to a cleaner enterprise tone, emphasize the workflow section, simplify the CTA, add stronger proof blocks…"
              value={customizationPrompt}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Sparkles className="h-3.5 w-3.5" />
                Press <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 font-sans font-medium text-white/60">Cmd/Ctrl + Enter</kbd> to customize
              </div>
              <button
                className="inline-flex items-center gap-2 rounded bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-lime-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={customizationState.status === "loading" || !customizationPrompt.trim()}
                onClick={() => void handleCustomize(artifact)}
                type="button"
              >
                {customizationState.status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Update design
              </button>
            </div>
          </div>

          {customizationState.status === "error" ? (
            <div className="mt-4 rounded border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
              {customizationState.error}
            </div>
          ) : null}

          {artifact.customizationHistory.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {artifact.customizationHistory.slice(-4).reverse().map((entry, index) => (
                <span
                  className="rounded border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/68"
                  key={`${index}-${entry}`}
                >
                  {entry}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <div className="overflow-hidden rounded border border-white/10 bg-black shadow-[0_28px_100px_rgba(0,0,0,0.45)]">
            <MvpSiteRenderer
              appTitle={artifact.appTitle}
              siteSpec={artifact.siteSpec}
              summary={artifact.summary}
            />
          </div>

          <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto pr-1">
            <section className="rounded border border-white/10 bg-[#0A0A0A] p-5">
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">Summary</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white/92">
                {artifact.appTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">{artifact.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/38">Source</div>
                  <div className="mt-2 text-sm font-medium text-white/84">{artifact.sourceLabel}</div>
                </div>
                <div className="rounded border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/38">Highlights</div>
                  <div className="mt-2 text-sm font-medium text-white/84">
                    {artifact.siteSpec.contentHighlights.items.length} grounded content blocks
                  </div>
                </div>
                <div className="rounded border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/38">Edits</div>
                  <div className="mt-2 text-sm font-medium text-white/84">
                    {artifact.customizationHistory.length} customization prompts applied
                  </div>
                </div>
              </div>
            </section>

            <section
              className="rounded border border-white/10 bg-[#0A0A0A] p-5"
              id="generated-code"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/38">Code</div>
                  <h2 className="mt-2 text-lg font-semibold text-white/92">
                    Copyable React/Tailwind page
                  </h2>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 transition hover:border-white/20 hover:bg-white/[0.08]"
                  onClick={() => void handleCopy(artifact.code)}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <pre className="mt-5 max-h-[60vh] overflow-auto rounded border border-white/8 bg-black px-4 py-4 font-mono text-[12px] leading-6 text-lime-100/84">
                {artifact.code}
              </pre>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
