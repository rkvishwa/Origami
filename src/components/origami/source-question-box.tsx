"use client";

import { useEffect, useRef } from "react";
import { Loader2, MessageSquareText, Sparkles } from "lucide-react";

import { SourceFlowMap } from "@/components/origami/source-flow-map";
import type { SourceFlowState } from "@/lib/types";

type SourceQuestionTurn = {
  id: string;
  question: string;
  answer: string;
};

type SourceQuestionBoxProps = {
  sourceLabel: string;
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  status: "idle" | "loading" | "error";
  error?: string | null;
  history: SourceQuestionTurn[];
  sourceContextKey: string | null;
  sourceFlowRenderKey: number;
  sourceFlowState: SourceFlowState;
  onRefreshSourceFlow: () => void;
};

export function SourceQuestionBox({
  sourceLabel,
  question,
  onQuestionChange,
  onSubmit,
  status,
  error,
  history,
  sourceContextKey,
  sourceFlowRenderKey,
  sourceFlowState,
  onRefreshSourceFlow,
}: SourceQuestionBoxProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading" && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status, history.length]);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-lime-500/30 bg-[#111] p-4 shadow-[0_0_20px_rgba(163,230,53,0.05)] transition-all animate-border-glow focus-within:animate-none focus-within:border-lime-500/50 focus-within:shadow-[0_0_25px_rgba(163,230,53,0.08)]">
          <textarea
            className="min-h-[96px] w-full resize-none bg-transparent text-sm leading-6 text-white/82 outline-none placeholder:text-white/28"
            onChange={(event) => onQuestionChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Ask about architecture, document meaning, extracted facts, implementation details, or next steps…"
            value={question}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/38">
              Press `Cmd/Ctrl + Enter` to ask.
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-medium text-lime-50 transition hover:bg-lime-300/16 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === "loading" || !question.trim()}
              onClick={onSubmit}
              type="button"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Ask Origami
                </>
              )}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
            {error}
          </div>
        ) : null}

        {history.length ? (
          <div className="space-y-3">
            {history.map((turn) => (
              <div
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                key={turn.id}
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/38">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Question
                </div>
                <p className="mt-2 text-sm leading-6 text-white/84">{turn.question}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-lime-200/52">
                  <Sparkles className="h-3.5 w-3.5" />
                  Answer
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/64">
                  {turn.answer}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {status === "loading" && (
          <div ref={scrollRef} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-white/50 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-lime-500" />
            Origami is processing your request...
          </div>
        )}

        <SourceFlowMap
          contextKey={sourceContextKey}
          onRefresh={onRefreshSourceFlow}
          renderKey={sourceFlowRenderKey}
          state={sourceFlowState}
        />
      </div>
    </section>
  );
}
