import { ArrowRight, FileStack, ListChecks, Network } from "lucide-react";

import { ArchitectureGraph } from "@/components/origami/architecture-graph";
import type { DocumentInsightOutput } from "@/lib/types";

type DocumentInsightProps = {
  insight: DocumentInsightOutput;
  onOpenRepoPath?: (path: string) => void;
};

export function DocumentInsight({ insight, onOpenRepoPath }: DocumentInsightProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_300px]">
        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                Document breakdown
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white/92">{insight.title}</h3>
            </div>
            <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-lime-100">
              {insight.sourceType}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-white/64">{insight.summary}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {insight.takeawayBullets.map((bullet) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-white/70"
                key={bullet}
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
            <ListChecks className="h-3.5 w-3.5" />
            Recommended actions
          </div>
          <div className="mt-4 space-y-3">
            {insight.recommendedActions.map((action) => (
              <div
                className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-sm leading-6 text-white/66"
                key={action}
              >
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
            <FileStack className="h-3.5 w-3.5" />
            Related files
          </div>

          <div className="mt-4 space-y-3">
            {insight.relatedFiles.length ? (
              insight.relatedFiles.map((relatedFile) => (
                <button
                  className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-left transition hover:border-lime-300/30 hover:bg-lime-300/8"
                  key={relatedFile.path}
                  onClick={() => onOpenRepoPath?.(relatedFile.path)}
                  type="button"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white/86">
                      {relatedFile.path}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-white/50">
                      {relatedFile.reason}
                    </div>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-4 py-5 text-sm text-white/48">
                No strongly related files were identified for this document.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
            <Network className="h-3.5 w-3.5" />
            Focus graph
          </div>
          <div className="mt-4">
            {insight.focusGraph ? (
              <ArchitectureGraph
                compact
                graph={insight.focusGraph}
                onOpenRepoPath={onOpenRepoPath}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-white/50">
                This document reads better as a summary than a graph, so Origami kept the breakdown focused on takeaways and next actions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
