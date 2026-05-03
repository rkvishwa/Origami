import { ArrowRight, FileStack, ListChecks, Network } from "lucide-react";

import { ArchitectureGraph } from "@/components/origami/architecture-graph";
import type { DocumentInsightOutput } from "@/lib/types";

type DocumentInsightProps = {
  insight: DocumentInsightOutput;
  onOpenRepoPath?: (path: string) => void;
};

export function DocumentInsight({ insight, onOpenRepoPath }: DocumentInsightProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_300px]">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-white/40">
                Document breakdown
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white/92">{insight.title}</h3>
            </div>
            <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.24em] text-lime-100">
              {insight.sourceType}
            </span>
          </div>

          <p className="mt-4 text-base leading-7 text-white/64">{insight.summary}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {insight.takeawayBullets.map((bullet) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.03] p-5 text-base leading-7 text-white/70"
                key={bullet}
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40">
            <ListChecks className="h-4 w-4" />
            Recommended actions
          </div>
          <div className="mt-6 space-y-4">
            {insight.recommendedActions.map((action) => (
              <div
                className="rounded-xl border border-white/8 bg-[#0A0A0A] p-5 text-base leading-7 text-white/66"
                key={action}
              >
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40">
            <FileStack className="h-4 w-4" />
            Related files
          </div>

          <div className="mt-6 space-y-4">
            {insight.relatedFiles.length ? (
              insight.relatedFiles.map((relatedFile) => (
                <button
                  className="flex w-full items-start justify-between gap-4 rounded-xl border border-white/8 bg-[#0A0A0A] p-5 text-left transition hover:border-lime-300/30 hover:bg-lime-300/8"
                  key={relatedFile.path}
                  onClick={() => onOpenRepoPath?.(relatedFile.path)}
                  type="button"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-white/86">
                      {relatedFile.path}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/50">
                      {relatedFile.reason}
                    </div>
                  </div>
                  <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-white/35" />
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-6 text-base text-white/48">
                No strongly related files were identified for this document.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40">
            <Network className="h-4 w-4" />
            Focus graph
          </div>
          <div className="mt-6">
            {insight.focusGraph ? (
              <ArchitectureGraph
                compact
                graph={insight.focusGraph}
                onOpenRepoPath={onOpenRepoPath}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-6 py-8 text-base text-white/50">
                This document reads better as a summary than a graph, so Origami kept the breakdown focused on takeaways and next actions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
