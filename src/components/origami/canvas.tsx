"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { ArchitectureGraph } from "@/components/origami/architecture-graph";
import { Calculator } from "@/components/origami/calculator";
import { DocumentInsight } from "@/components/origami/document-insight";
import { ScenarioSimulator } from "@/components/origami/scenario-simulator";
import type {
  ArchitectureGraphOutput,
  CalculatorOutput,
  DocumentInsightOutput,
  ScenarioSimulatorOutput,
} from "@/lib/types";

type OrigamiCanvasProps = {
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
  chatError?: string;
  sourceLabel: string;
  onOpenRepoPath?: (path: string) => void;
};

function getLatestAssistantMessage(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "assistant") {
      return messages[index];
    }
  }

  return null;
}

function getLatestToolPart(messages: UIMessage[]) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];

    if (message.role !== "assistant") {
      continue;
    }

    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex] as {
        type?: string;
        state?: string;
        output?: unknown;
      };

      if (part.type?.startsWith("tool-") && part.state === "output-available") {
        return part;
      }
    }
  }

  return null;
}

function getAssistantText(message: UIMessage | null) {
  if (!message) {
    return "";
  }

  return message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("\n\n")
    .trim();
}

export function OrigamiCanvas({
  messages,
  status,
  chatError,
  sourceLabel,
  onOpenRepoPath,
}: OrigamiCanvasProps) {
  const latestAssistantMessage = getLatestAssistantMessage(messages);
  const latestToolPart = getLatestToolPart(messages);
  const assistantText = getAssistantText(latestAssistantMessage);

  let content: ReactNode = (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0A0A0A]">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-lime-300/20 bg-lime-300/10 text-lime-100">
          <Wand2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white/90">
          Origami is ready to build the interactive layer
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Generate the interactive canvas for {sourceLabel} to stream a graph, calculator, simulator, or guided document dashboard.
        </p>
      </div>
    </div>
  );

  if (latestToolPart) {
    switch (latestToolPart.type) {
      case "tool-buildArchitectureGraph":
        content = (
          <ArchitectureGraph
            graph={latestToolPart.output as ArchitectureGraphOutput}
            onOpenRepoPath={onOpenRepoPath}
          />
        );
        break;
      case "tool-buildCalculator":
        content = <Calculator calculator={latestToolPart.output as CalculatorOutput} />;
        break;
      case "tool-buildScenarioSimulator":
        content = (
          <ScenarioSimulator
            simulator={latestToolPart.output as ScenarioSimulatorOutput}
          />
        );
        break;
      case "tool-buildDocumentInsight":
        content = (
          <DocumentInsight
            insight={latestToolPart.output as DocumentInsightOutput}
            onOpenRepoPath={onOpenRepoPath}
          />
        );
        break;
      default:
        content = (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-white/50">
            Origami returned a tool output that this UI does not render yet.
          </div>
        );
    }
  } else if (status === "submitted" || status === "streaming") {
    content = (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <Loader2 className="h-6 w-6 animate-spin text-lime-300" />
          <p className="text-sm">Origami is streaming the interactive canvas…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
            Interactive
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white/92">Generative canvas</h2>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Streamed through the AI SDK and grounded in the active source selection.
          </p>
        </div>
        <div className="rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-lime-100">
          {status === "streaming" || status === "submitted" ? "Streaming..." : "Ready"}
        </div>
      </div>

      {assistantText ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-6 py-5 text-base leading-7 text-white/70">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
            <Sparkles className="h-4 w-4" />
            Model notes
          </div>
          {assistantText}
        </div>
      ) : null}

      {latestToolPart && (status === "submitted" || status === "streaming") ? (
        <div className="rounded-xl border border-lime-300/15 bg-lime-300/8 px-6 py-5 text-base text-lime-50/80">
          Interactive output is ready. Origami is still streaming any final notes.
        </div>
      ) : null}

      {chatError ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-6 py-5 text-base text-red-50">
          {chatError}
        </div>
      ) : null}

      <div className="w-full pt-2 pb-10">
        {content}
      </div>
    </div>
  );
}
