import { FileText, FolderGit2, Info, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RepoSourceDocument } from "@/lib/types";

type SidebarProps = {
  source: RepoSourceDocument | null;
  selectedTabId: string | null;
  onSelectTab: (id: string) => void;
  className?: string;
};

export function Sidebar({ source, selectedTabId, onSelectTab, className }: SidebarProps) {
  if (!source || source.kind !== "repo") {
    return (
      <div className={cn("glass-panel flex flex-col rounded-r-3xl border-l-0 w-64 p-4", className)}>
        <div className="flex items-center gap-2 px-2 py-2 mb-4">
          <FileText className="h-5 w-5 text-lime-400" />
          <h2 className="font-semibold text-white/90">Source</h2>
        </div>
        <div className="rounded-xl bg-lime-400/10 px-4 py-2 text-sm text-lime-50 ring-1 ring-lime-300/30">
          Document View
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-panel flex flex-col rounded-r-3xl border-l-0 w-72 overflow-y-auto p-4", className)}>
      <div className="flex items-center gap-2 px-2 py-2 mb-6">
        <FolderGit2 className="h-5 w-5 text-lime-400" />
        <div className="overflow-hidden">
          <h2 className="font-semibold text-white/90 truncate">{source.repo.repo}</h2>
          <p className="text-xs text-white/50 truncate">{source.repo.owner}</p>
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <div className="px-2 text-xs font-medium uppercase tracking-wider text-white/40 mb-2">Main</div>
        <button
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all text-left",
            selectedTabId === "overview"
              ? "bg-lime-400/15 text-lime-50 ring-1 ring-lime-300/30"
              : "text-white/65 hover:bg-white/10 hover:text-white/90"
          )}
          onClick={() => onSelectTab("overview")}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </button>
      </div>

      <div className="space-y-1">
        <div className="px-2 text-xs font-medium uppercase tracking-wider text-white/40 mb-2">Files</div>
        {source.tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all text-left",
              selectedTabId === tab.id
                ? "bg-lime-400/15 text-lime-50 ring-1 ring-lime-300/30"
                : "text-white/65 hover:bg-white/10 hover:text-white/90"
            )}
            onClick={() => onSelectTab(tab.id)}
          >
            {tab.kind === "markdown" ? (
              <FileText className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <Info className="h-4 w-4 shrink-0 opacity-70" />
            )}
            <span className="truncate">{tab.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
