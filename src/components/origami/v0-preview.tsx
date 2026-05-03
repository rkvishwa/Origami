import { ExternalLink, LayoutTemplate, Loader2, Sparkles } from "lucide-react";

import type { MiniAppPreview, V0McpSession } from "@/lib/types";

type V0PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; preview: MiniAppPreview }
  | { status: "error"; error: string };

type V0McpState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; session: V0McpSession }
  | { status: "error"; error: string };

type V0PreviewProps = {
  hasV0Key: boolean;
  sourceLabel: string;
  previewState: V0PreviewState;
  mcpState: V0McpState;
  onGenerate: () => void;
  onContinueInV0: () => void;
};

export function V0PreviewPanel({
  hasV0Key,
  sourceLabel,
  previewState,
  mcpState,
  onGenerate,
  onContinueInV0,
}: V0PreviewProps) {
  if (!hasV0Key) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-white/52">
        Add `V0_API_KEY` to unlock the v0 MVP pane. Origami will then turn the active source into a structured mini-app brief and offer a Continue in v0 MCP handoff.
      </div>
    );
  }

  if (previewState.status === "idle") {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              v0 MVP
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white/90">
              Draft a mini-app for {sourceLabel}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
              This uses the official v0 model to generate a product brief, screen set, and launch checklist without executing generated code inside Origami.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16"
            onClick={onGenerate}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            Generate brief
          </button>
        </div>
      </div>
    );
  }

  if (previewState.status === "loading") {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 className="h-6 w-6 animate-spin text-lime-300" />
          <p className="text-sm">Generating the v0 MVP brief…</p>
        </div>
      </div>
    );
  }

  if (previewState.status === "error") {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-6 text-sm text-red-50">
        {previewState.error}
      </div>
    );
  }

  const preview = previewState.preview;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#111] p-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            v0 MVP
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white/92">{preview.appTitle}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{preview.pitch}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[preview.targetUser, preview.appType, preview.designDirection].map((item) => (
              <span
                className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1.5 text-xs text-white/72"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
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
            className="inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mcpState.status === "loading"}
            onClick={onContinueInV0}
            type="button"
          >
            {mcpState.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Continue in v0
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {preview.screenCards.map((screen) => (
              <div
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                key={screen.name}
              >
                <div className="text-sm font-semibold text-white/88">{screen.name}</div>
                <p className="mt-2 text-sm leading-6 text-white/60">{screen.purpose}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {screen.keyElements.map((element) => (
                    <span
                      className="rounded-full border border-white/10 bg-[#0A0A0A] px-2.5 py-1 text-[11px] text-white/68"
                      key={element}
                    >
                      {element}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Primary flow
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {preview.primaryUserFlow.map((step, index) => (
                <div
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/66"
                  key={`${index}-${step}`}
                >
                  <span className="mr-2 text-white/42">{index + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Component palette
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {preview.componentPalette.map((component) => (
                <span
                  className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1.5 text-xs text-white/72"
                  key={component}
                >
                  {component}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Key entities
            </div>
            <div className="mt-4 space-y-3">
              {preview.keyEntities.map((entity) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3"
                  key={entity.name}
                >
                  <div className="text-sm font-medium text-white/86">{entity.name}</div>
                  <div className="mt-1 text-xs leading-5 text-white/52">{entity.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Launch checklist
            </div>
            <div className="mt-4 space-y-3">
              {preview.launchChecklist.map((item) => (
                <div
                  className="rounded-xl border border-lime-300/20 bg-lime-300/8 px-4 py-3 text-sm leading-6 text-lime-50/90"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Constraints and assumptions
            </div>
            <div className="mt-4 space-y-3">
              {preview.constraints.map((constraint) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-sm leading-6 text-white/62"
                  key={constraint}
                >
                  {constraint}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mcpState.status === "ready" ? (
        <div className="rounded-xl border border-lime-300/20 bg-lime-300/10 px-5 py-4 text-sm text-lime-50">
          v0 session created. Open it here:{" "}
          <a
            className="font-medium underline underline-offset-4"
            href={mcpState.session.chatUrl}
            rel="noreferrer"
            target="_blank"
          >
            {mcpState.session.chatUrl}
          </a>
        </div>
      ) : null}

      {mcpState.status === "error" ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-50">
          {mcpState.error}
        </div>
      ) : null}
    </div>
  );
}
