"use client";

import { useEffect, useState, type DragEvent } from "react";
import { Clock3, FileText, ScanText } from "lucide-react";

import { ExpandableCard } from "./expandable-card";
import type { SourceStats } from "@/lib/types";
import { cn } from "@/lib/utils";

type SourcePanelProps = {
  title: string;
  subtitle?: string;
  kindLabel: string;
  sourceText: string;
  sourceStats: SourceStats;
  fetchedAt?: string;
  isEditable: boolean;
  isDraggingFile?: boolean;
  pdfPreviewUrl?: string | null;
  onSourceChange: (value: string) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
};

function formatTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "Live session";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Live session";
  }

  return date.toLocaleString();
}

export function SourcePanel({
  title,
  subtitle,
  kindLabel,
  sourceText,
  sourceStats,
  fetchedAt,
  isEditable,
  isDraggingFile = false,
  pdfPreviewUrl,
  onSourceChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: SourcePanelProps) {
  const [mode, setMode] = useState<"preview" | "text">(
    pdfPreviewUrl ? "preview" : "text",
  );

  useEffect(() => {
    setMode(pdfPreviewUrl ? "preview" : "text");
  }, [pdfPreviewUrl, title]);

  return (
    <section
      className={cn(
        "flex h-[800px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]",
        isDraggingFile ? "border-lime-300/40 shadow-[0_0_0_1px_rgba(204,255,0,0.3)]" : "",
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Source
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white/92">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/56">
              {subtitle || "Active source loaded into the workspace."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-lime-100">
              {kindLabel}
            </span>
            {pdfPreviewUrl ? (
              <>
                <button
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] transition",
                    mode === "preview"
                      ? "border-lime-300/20 bg-lime-300/10 text-lime-100"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white",
                  )}
                  onClick={() => setMode("preview")}
                  type="button"
                >
                  Preview
                </button>
                <button
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] transition",
                    mode === "text"
                      ? "border-lime-300/20 bg-lime-300/10 text-lime-100"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white",
                  )}
                  onClick={() => setMode("text")}
                  type="button"
                >
                  Extracted text
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-5 sm:gap-6 rounded-lg border border-white/5 bg-white/[0.02] px-5 py-3.5">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Lines</div>
            <div className="text-base font-medium text-white/90">{sourceStats.lines}</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Words</div>
            <div className="text-base font-medium text-white/90">{sourceStats.words}</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Characters</div>
            <div className="text-base font-medium text-white/90">{sourceStats.characters}</div>
          </div>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <div className="flex flex-col gap-1 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-white/40">
              <Clock3 className="h-3 w-3" />
              Updated
            </div>
            <div className="text-sm font-medium text-white/80">
              {formatTimestamp(fetchedAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        {pdfPreviewUrl && mode === "preview" ? (
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[#111]">
            <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/40">
              <ScanText className="h-4 w-4" />
              Embedded PDF preview
            </div>
            <iframe
              className="h-full w-full"
              src={pdfPreviewUrl}
              title={`${title} preview`}
              allowFullScreen
            />
          </div>
        ) : isEditable ? (
          <textarea
            className="h-full min-h-[420px] w-full rounded-xl border border-white/8 bg-[#111] px-4 py-4 font-mono text-sm leading-6 text-white/80 outline-none transition focus:border-lime-300/35"
            onChange={(event) => onSourceChange(event.target.value)}
            placeholder="Paste source text here to let Origami fold it into an interactive app."
            value={sourceText}
          />
        ) : (
          <ExpandableCard title="Raw source">
            <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/40">
              <FileText className="h-4 w-4" />
              Raw source
            </div>
            <pre className="whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-6 text-white/78">
              {sourceText || "No source text available."}
            </pre>
          </ExpandableCard>
        )}
      </div>
    </section>
  );
}
