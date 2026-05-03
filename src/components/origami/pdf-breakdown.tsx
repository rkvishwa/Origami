import { FileBarChart2, FileText, Sigma } from "lucide-react";

import type { PdfInsightOutput, PdfSourceDocument } from "@/lib/types";

type PdfBreakdownProps = {
  source: PdfSourceDocument;
  insight: PdfInsightOutput | null;
};

export function PdfBreakdown({ source, insight }: PdfBreakdownProps) {
  if (!insight) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-white/48">
        The PDF text was extracted, but the summary view is not ready yet.
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
                PDF breakdown
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white/92">{insight.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/62">{insight.summary}</p>
            </div>
            <div className="rounded-3xl border border-lime-300/20 bg-lime-300/10 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-lime-100/70">
                Pages
              </div>
              <div className="mt-1 text-2xl font-semibold text-lime-50">
                {source.pageCount}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {insight.keyTakeaways.map((takeaway) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-white/70"
                key={takeaway}
              >
                {takeaway}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Reading cues
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <FileText className="h-4 w-4" />
                Document type
              </div>
              <div className="mt-2 text-sm font-medium text-white/84">
                {insight.documentType}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Sigma className="h-4 w-4" />
                Parse status
              </div>
              <div className="mt-2 text-sm font-medium text-white/84">
                {source.parseStatus}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <FileBarChart2 className="h-4 w-4" />
                Extracted sections
              </div>
              <div className="mt-2 text-sm font-medium text-white/84">
                {source.sections.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Notable metrics
          </div>
          <div className="mt-4 space-y-3">
            {insight.notableMetrics.length ? (
              insight.notableMetrics.map((metric) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3"
                  key={`${metric.label}-${metric.value}`}
                >
                  <div className="text-xs text-white/46">{metric.label}</div>
                  <div className="mt-1 text-lg font-semibold text-white/90">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-white/52">{metric.context}</div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-4 py-5 text-sm text-white/48">
                No standout metrics were confidently extracted from this PDF.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Section breakdown
          </div>
          <div className="mt-4 grid gap-3">
            {insight.sectionBreakdown.map((section) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
                key={`${section.heading}-${section.pageRange}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white/86">{section.heading}</div>
                  <span className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
                    {section.pageRange}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">{section.summary}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {insight.recommendedActions.map((action) => (
              <div
                className="rounded-xl border border-white/8 bg-lime-300/8 px-4 py-3 text-sm leading-6 text-lime-50/90"
                key={action}
              >
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
