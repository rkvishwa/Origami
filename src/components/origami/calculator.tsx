"use client";

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CalculatorOutput } from "@/lib/types";

type CalculatorProps = {
  calculator: CalculatorOutput;
};

function calculateOutput(calculator: CalculatorOutput, values: Record<string, number>) {
  const raw = calculator.parameters.reduce((total, parameter) => {
    const denominator = Math.max(parameter.max - parameter.min, parameter.step, 1);
    const normalized = (values[parameter.id] - parameter.min) / denominator;

    return total + normalized * parameter.multiplier;
  }, calculator.baseValue);

  return Number(raw.toFixed(calculator.decimals));
}

export function Calculator({ calculator }: CalculatorProps) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(
      calculator.parameters.map((parameter) => [parameter.id, parameter.defaultValue]),
    ),
  );

  const currentOutput = calculateOutput(calculator, values);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="rounded-xl border border-white/10 bg-[#111] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                Calculator
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white/92">
                {calculator.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                {calculator.summary}
              </p>
            </div>
            <div className="rounded-3xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-[0.24em] text-lime-100/70">
                {calculator.outputLabel}
              </div>
              <div className="mt-1 text-2xl font-semibold text-lime-50">
                {calculator.outputUnit}
                {currentOutput.toFixed(calculator.decimals)}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {calculator.parameters.map((parameter) => (
              <label
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
                key={parameter.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white/88">
                      {parameter.label}
                    </div>
                    {parameter.description ? (
                      <p className="mt-1 text-xs leading-5 text-white/48">
                        {parameter.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-full border border-white/10 bg-[#0A0A0A] px-3 py-1 text-sm text-lime-100">
                    {values[parameter.id]}
                    {parameter.unit}
                  </div>
                </div>
                <input
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[#ccff00]"
                  max={parameter.max}
                  min={parameter.min}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [parameter.id]: Number(event.target.value),
                    }))
                  }
                  step={parameter.step}
                  type="range"
                  value={values[parameter.id]}
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/38">
                  <span>
                    {parameter.min}
                    {parameter.unit}
                  </span>
                  <span>
                    {parameter.max}
                    {parameter.unit}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Formula notes
          </div>
          <div className="mt-3 text-sm font-medium text-white/82">
            {calculator.formulaLabel}
          </div>
          <div className="mt-4 space-y-3">
            {calculator.highlights.map((highlight) => (
              <div
                className="rounded-xl border border-white/8 bg-[#0A0A0A] px-4 py-3 text-sm leading-6 text-white/66"
                key={highlight}
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Outcome curve
            </div>
            <p className="mt-2 text-sm leading-6 text-white/58">
              This chart uses the primary variable selected by the model and keeps the other
              inputs at their default values for a fast visual read.
            </p>
          </div>
        </div>

        <div className="mt-5 h-[260px]">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={calculator.series}>
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.92)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "18px",
                  color: "#ffffff",
                }}
              />
              <Line
                dataKey="value"
                dot={{ fill: "#ccff00", stroke: "#ccff00" }}
                stroke="#ccff00"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
