import { FolderKanban, GitBranch, Layers3, Radar } from "lucide-react";

import { ArchitectureGraph } from "@/components/origami/architecture-graph";
import { getRepoManifestInsights, getRepoSignalBadges } from "@/lib/repo-insights";
import type { ArchitectureGraphOutput, RepoSourceDocument } from "@/lib/types";

type RepoOverviewProps = {
  source: RepoSourceDocument;
  graph?: ArchitectureGraphOutput;
  onOpenRepoPath?: (path: string) => void;
};

export function RepoOverview({
  source,
  graph,
  onOpenRepoPath,
}: RepoOverviewProps) {
  const signalBadges = getRepoSignalBadges(source);
  const manifestInsights = getRepoManifestInsights(source);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_320px]">
        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                Repository overview
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white/92">
                {source.repo.owner}/{source.repo.repo}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {source.truncated
                  ? `Showing the highest-priority ${source.tabs.length} docs and manifests out of ${source.totalMatchedFiles} matches.`
                  : `Captured ${source.totalMatchedFiles} relevant docs and manifests for this dashboard.`}
              </p>
            </div>
            <div className="rounded-3xl border border-lime-300/20 bg-lime-300/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-lime-100/70">
                Branch
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-lime-50">
                <GitBranch className="h-4 w-4" />
                {source.repo.branch}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <FolderKanban className="h-4 w-4" />
                Included tabs
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {source.tabs.length}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Layers3 className="h-4 w-4" />
                Overview files
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {source.overviewFiles.length}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Radar className="h-4 w-4" />
                Signals
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {signalBadges.length}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {signalBadges.length ? (
              signalBadges.map((badge) => (
                <span
                  className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1.5 text-xs text-white/72"
                  key={badge}
                >
                  {badge}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1.5 text-xs text-white/52">
                No framework cues detected yet
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Coverage rail
          </div>
          <div className="mt-4 space-y-3">
            {source.tabs.map((tab) => (
              <button
                className="w-full rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-left transition hover:border-lime-300/30 hover:bg-lime-300/8"
                key={tab.id}
                onClick={() => onOpenRepoPath?.(tab.path)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white/85">
                      {tab.title}
                    </div>
                    <div className="mt-1 truncate text-xs text-white/45">{tab.path}</div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
                    {tab.kind}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111] p-5">
        {graph ? (
          <ArchitectureGraph graph={graph} onOpenRepoPath={onOpenRepoPath} />
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-10 text-sm text-white/50">
            The repo dashboard is ready. Run the Interactive pane to generate the clickable architecture graph for this overview.
          </div>
        )}
      </div>

      {manifestInsights.length ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Package and config insights
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {manifestInsights.slice(0, 3).map((insight) => (
              <div
                className="rounded-xl border border-white/8 bg-[#0A0A0A] p-4"
                key={insight.path}
              >
                <div className="text-sm font-semibold text-white/88">
                  {insight.packageName ?? insight.path}
                </div>
                <div className="mt-1 text-xs text-white/46">{insight.path}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ...insight.detectedFrameworks.slice(0, 3),
                    ...insight.runtimeSignals.slice(0, 2),
                  ].map((signal) => (
                    <span
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/66"
                      key={signal}
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
