import { Boxes, FileJson2, Package2, TerminalSquare } from "lucide-react";

import type { PackageManifestInsight } from "@/lib/types";

type PackageDashboardProps = {
  insight: PackageManifestInsight | null;
};

export function PackageDashboard({ insight }: PackageDashboardProps) {
  if (!insight) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-white/48">
        This manifest could not be parsed into a deterministic dashboard, but the raw source is still available in the Source pane.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_300px]">
        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                Manifest dashboard
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white/92">{insight.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{insight.path}</p>
            </div>
            <div className="rounded-3xl border border-lime-300/20 bg-lime-300/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-lime-100/70">
                Package
              </div>
              <div className="mt-1 text-sm font-semibold text-lime-50">
                {insight.packageName ?? "Unnamed package"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <TerminalSquare className="h-4 w-4" />
                Scripts
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {insight.scriptCount}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Package2 className="h-4 w-4" />
                Dependencies
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {insight.dependencyCount}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <FileJson2 className="h-4 w-4" />
                Dev deps
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {insight.devDependencyCount}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Boxes className="h-4 w-4" />
                Workspaces
              </div>
              <div className="mt-3 text-2xl font-semibold text-white/90">
                {insight.workspaceCount}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Runtime signals
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ...insight.detectedFrameworks,
              ...insight.runtimeSignals,
              insight.version ? `version ${insight.version}` : null,
              insight.private ? "private package" : "public package",
            ]
              .filter(Boolean)
              .map((signal) => (
                <span
                  className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1.5 text-xs text-white/72"
                  key={signal}
                >
                  {signal}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Key scripts
          </div>
          <div className="mt-4 space-y-3">
            {insight.scripts.length ? (
              insight.scripts.map((script) => (
                <div
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  key={script.name}
                >
                  <div className="text-sm font-medium text-white/85">{script.name}</div>
                  <code className="mt-2 block text-xs leading-6 text-lime-100/72">
                    {script.command}
                  </code>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-4 py-5 text-sm text-white/48">
                No scripts were defined in this manifest.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            High-signal dependencies
          </div>
          <div className="mt-4 space-y-3">
            {insight.keyDependencies.length ? (
              insight.keyDependencies.map((dependency) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3"
                  key={dependency.name}
                >
                  <div className="text-sm font-medium text-white/85">{dependency.name}</div>
                  <div className="mt-1 text-xs text-white/50">{dependency.version}</div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-4 py-5 text-sm text-white/48">
                No priority dependencies were detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
