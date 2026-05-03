"use client";

import { Loader2, MessageSquareText, Sparkles } from "lucide-react";

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
};

export function SourceQuestionBox({
  sourceLabel,
  question,
  onQuestionChange,
  onSubmit,
  status,
  error,
  history,
}: SourceQuestionBoxProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Source chat
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white/92">
              Ask questions about {sourceLabel}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Ask about the uploaded PDF, repo, or text. Origami will answer from the active
              source context.
            </p>
          </div>
          <div className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-lime-100">
            grounded
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-white/8 bg-[#111] p-4">
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Ask Origami
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
      </div>
    </section>
  );
}
