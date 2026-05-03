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
    <div className="space-y-6">
      <div className="grid gap-6 ">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-white/40">
                PDF breakdown
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white/92">{insight.title}</h3>
              <p className="mt-3 text-base leading-7 text-white/62">{insight.summary}</p>
            </div>
            <div className="rounded-3xl border border-lime-300/20 bg-lime-300/10 px-6 py-4 flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-[0.24em] text-lime-100/70">
                Pages
              </div>
              <div className="mt-2 text-4xl font-semibold text-lime-50">
                {source.pageCount}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {insight.keyTakeaways.map((takeaway) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.03] p-5 text-base leading-7 text-white/70"
                key={takeaway}
              >
                {takeaway}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center">
            <FileText className="h-6 w-6 text-white/50 mb-3" />
            <div className="text-xs uppercase tracking-[0.25em] text-white/40">
              Document type
            </div>
            <div className="mt-2 text-lg font-medium text-white/84">
              {insight.documentType}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center">
            <Sigma className="h-6 w-6 text-white/50 mb-3" />
            <div className="text-xs uppercase tracking-[0.25em] text-white/40">
              Parse status
            </div>
            <div className="mt-2 text-lg font-medium text-white/84">
              {source.parseStatus}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center">
            <FileBarChart2 className="h-6 w-6 text-white/50 mb-3" />
            <div className="text-xs uppercase tracking-[0.25em] text-white/40">
              Extracted sections
            </div>
            <div className="mt-2 text-lg font-medium text-white/84">
              {source.sections.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 ">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-white/40">
            Notable metrics
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insight.notableMetrics.length ? (
              insight.notableMetrics.map((metric) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] p-5"
                  key={`${metric.label}-${metric.value}`}
                >
                  <div className="text-sm text-white/46">{metric.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-white/90">
                    {metric.value}
                  </div>
                  <div className="mt-3 text-sm leading-6 text-white/52">{metric.context}</div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-6 text-base text-white/48 col-span-full">
                No standout metrics were confidently extracted from this PDF.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-white/40">
            Section breakdown
          </div>
          <div className="mt-6 grid gap-4">
            {insight.sectionBreakdown.map((section) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.03] p-5"
                key={`${section.heading}-${section.pageRange}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-base font-semibold text-white/86">{section.heading}</div>
                  <span className="rounded-full border border-white/10 bg-[#0A0A0A] px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                    {section.pageRange}
                  </span>
                </div>
                <p className="mt-3 text-base leading-7 text-white/62">{section.summary}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {insight.recommendedActions.map((action) => (
              <div
                className="rounded-xl border border-white/8 bg-lime-300/8 p-5 text-base leading-7 text-lime-50/90"
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
