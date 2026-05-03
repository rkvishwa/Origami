"use client";

import { useState } from "react";
import { CheckCheck, ChevronsRight } from "lucide-react";

import type { ScenarioSimulatorOutput } from "@/lib/types";
import { cn } from "@/lib/utils";

type ScenarioSimulatorProps = {
  simulator: ScenarioSimulatorOutput;
};

const toneStyles = {
  positive: "border-lime-300/30 bg-lime-300/10 text-lime-50",
  neutral: "border-white/10 bg-white/[0.05] text-white/86",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-50",
} as const;

export function ScenarioSimulator({ simulator }: ScenarioSimulatorProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const score = simulator.steps.reduce((total, step) => {
    const selectedId = answers[step.id];
    const selectedOption = step.options.find((option) => option.id === selectedId);
    return total + (selectedOption?.scoreDelta ?? 0);
  }, 0);

  const resolvedEnding =
    [...simulator.endings]
      .sort((left, right) => right.minScore - left.minScore)
      .find((ending) => score >= ending.minScore) ?? simulator.endings[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_300px]">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-white/40">
            Scenario simulator
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white/92">{simulator.title}</h3>
          <p className="mt-3 text-base leading-7 text-white/62">{simulator.summary}</p>

          <div className="mt-8 space-y-6">
            {simulator.steps.map((step, index) => {
              const selectedOptionId = answers[step.id];

              return (
                <div
                  className="rounded-xl border border-white/8 bg-white/[0.03] p-6"
                  key={step.id}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0A0A0A] text-sm font-semibold text-lime-100">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-semibold text-white/88">{step.title}</h4>
                      <p className="mt-2 text-base leading-7 text-white/62">{step.question}</p>
                      {step.guidance ? (
                        <p className="mt-3 text-sm leading-6 text-white/45">{step.guidance}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {step.options.map((option) => (
                      <button
                        className={cn(
                          "rounded-xl border px-5 py-4 text-left transition",
                          toneStyles[option.tone],
                          selectedOptionId === option.id
                            ? "ring-2 ring-lime-300/40"
                            : "hover:border-lime-300/25 hover:bg-lime-300/10",
                        )}
                        key={option.id}
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [step.id]: option.id,
                          }))
                        }
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-5">
                          <div>
                            <div className="text-base font-medium">{option.label}</div>
                            <div className="mt-2 text-sm leading-6 opacity-80">
                              {option.impact}
                            </div>
                          </div>
                          {selectedOptionId === option.id ? (
                            <CheckCheck className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronsRight className="h-4 w-4 shrink-0 opacity-45" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-white/40">
            Outcome
          </div>
          <div className="mt-4 rounded-3xl border border-lime-300/20 bg-lime-300/10 px-6 py-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.24em] text-lime-100/70">
              Current score
            </div>
            <div className="mt-2 text-5xl font-semibold text-lime-50">
              {score}
              <span className="ml-2 text-xl text-lime-100/55">/ {simulator.maxScore}</span>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-white/8 bg-[#0A0A0A] p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">
              Recommended ending
            </div>
            <h4 className="mt-3 text-xl font-semibold text-white/90">
              {resolvedEnding?.label}
            </h4>
            <p className="mt-3 text-base leading-7 text-white/62">
              {resolvedEnding?.description}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {simulator.takeawayBullets.map((bullet) => (
              <div
                className="rounded-xl border border-white/8 bg-[#0A0A0A] p-5 text-base leading-7 text-white/64"
                key={bullet}
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
