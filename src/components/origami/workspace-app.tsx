"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Loader2 } from "lucide-react";

import { OrigamiCanvas } from "@/components/origami/canvas";
import { DocumentInsight } from "@/components/origami/document-insight";
import { PackageDashboard } from "@/components/origami/package-dashboard";
import { PdfBreakdown } from "@/components/origami/pdf-breakdown";
import { RepoOverview } from "@/components/origami/repo-overview";
import { SourcePanel } from "@/components/origami/source-panel";
import { V0PreviewPanel } from "@/components/origami/v0-preview";
import { DashboardNavbar } from "@/components/origami/workspace-header";
import { ExpandableCard } from "@/components/origami/expandable-card";
import { buildPdfFallbackInsight } from "@/lib/pdf";
import { summarizePackageManifest } from "@/lib/repo-insights";
import { sampleSources } from "@/lib/samples";
import {
  buildRepoOverviewText,
  createOrigamiMessagePayload,
  createSourceBrief,
  getSelectedRepoTab,
  getSourceStats,
} from "@/lib/source";
import type {
  ArchitectureGraphOutput,
  BaseTextSourceDocument,
  MiniAppPreview,
  PdfInsightOutput,
  RepoFileDescriptor,
  RepoSourceDocument,
  RepoTabAnalysisState,
  SourceDocument,
  V0McpSession,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type V0PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; preview: MiniAppPreview }
  | { status: "error"; error: string };

type V0McpState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; session: V0McpSession }
  | { status: "error"; error: string };

type WorkspaceAppProps = {
  hasV0Key: boolean;
};

const DEFAULT_SAMPLE = sampleSources[1];

function buildRepoAnalysisKey(source: RepoSourceDocument, path: string) {
  return `${source.sourceUrl}::${source.repo.branch}::${path}`;
}

function buildStandaloneAnalysisKey(source: BaseTextSourceDocument) {
  return `${source.kind}::${source.label}::${source.fetchedAt ?? "local"}`;
}

function findLatestToolPart(messages: UIMessage[]) {
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

function PanelFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#A1A1AA]">{title}</div>
        <p className="mt-2 text-sm leading-6 text-[#71717A]">{subtitle}</p>
      </div>
      <div className="p-4">
        <ExpandableCard title={title} maxHeight={360} className="border-none bg-transparent">
          {children}
        </ExpandableCard>
      </div>
    </section>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-3 text-white/60">
        <Loader2 className="h-5 w-5 animate-spin text-lime-300" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

export function WorkspaceApp({ hasV0Key }: WorkspaceAppProps) {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const activeRepoOverviewRequestKey = useRef<string | null>(null);
  const [source, setSource] = useState<SourceDocument | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [surfaceMessage, setSurfaceMessage] = useState<string | null>(null);
  const [surfaceError, setSurfaceError] = useState<string | null>(null);
  const [isIntakeBusy, setIsIntakeBusy] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfInsight, setPdfInsight] = useState<PdfInsightOutput | null>(null);
  const [standaloneInsightState, setStandaloneInsightState] = useState<RepoTabAnalysisState>({
    status: "idle",
  });
  const [repoTabAnalyses, setRepoTabAnalyses] = useState<Record<string, RepoTabAnalysisState>>(
    {},
  );
  const [v0PreviewState, setV0PreviewState] = useState<V0PreviewState>({
    status: "idle",
  });
  const [v0McpState, setV0McpState] = useState<V0McpState>({ status: "idle" });
  const [repoOverviewGraphs, setRepoOverviewGraphs] = useState<
    Record<string, ArchitectureGraphOutput>
  >({});

  const { error, messages, sendMessage, setMessages, status, stop } = useChat({
    onError: (nextError) => {
      setSurfaceError(nextError.message);
    },
  });

  // This initialization flow is intentionally one-shot for the first URL state.
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // This initialization flow is intentionally one-shot for the first URL state.
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    const repoUrl = searchParams.get("repo");
    const sampleId = searchParams.get("sample");
    const uploadSource = searchParams.get("source");

    if (repoUrl) {
      setGithubUrl(repoUrl);
      void loadRepo(repoUrl);
      return;
    }

    if (sampleId) {
      const sample = sampleSources.find((item) => item.id === sampleId) ?? DEFAULT_SAMPLE;
      loadSample(sample.id);
      return;
    }

    if (uploadSource === "upload" && typeof window !== "undefined") {
      const name = window.sessionStorage.getItem("origami_upload_name") || "Uploaded file";
      const text = window.sessionStorage.getItem("origami_upload_text") || "";
      const nextSource: BaseTextSourceDocument = {
        kind: "file",
        label: name,
        text,
        fetchedAt: new Date().toISOString(),
      };
      replaceSource(nextSource, "Loaded uploaded file.");
      return;
    }

    if (uploadSource === "pdf-upload" && typeof window !== "undefined") {
      const rawPayload = window.sessionStorage.getItem("origami_pdf_payload");
      if (rawPayload) {
        try {
          const payload = JSON.parse(rawPayload);
          setPdfInsight(payload.insight as PdfInsightOutput);
          replaceSource(payload.source as SourceDocument, `Loaded ${payload.source?.fileName ?? "PDF"}.`);
        } catch {
          // fall through to default sample if malformed
        }
      }
      return;
    }

    loadSample(DEFAULT_SAMPLE.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Breakdown analysis is triggered from source selection changes; the helpers are stable enough for this orchestration.
  useEffect(() => {
    if (!source) {
      return;
    }

    if (source.kind === "text" || source.kind === "file") {
      if (standaloneInsightState.status === "idle") {
        void loadStandaloneInsight(source);
      }
      return;
    }

    if (source.kind === "repo") {
      const selectedTab = getSelectedRepoTab(source);

      if (selectedTab?.kind === "markdown") {
        void loadRepoTabAnalysis(source, selectedTab);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, standaloneInsightState.status]);

  useEffect(() => {
    if (!source || source.kind !== "repo" || source.selectedTabId !== "overview") {
      return;
    }

    const overviewKey = `${source.sourceUrl}::${source.repo.branch}`;
    if (
      repoOverviewGraphs[overviewKey] ||
      activeRepoOverviewRequestKey.current === overviewKey ||
      status === "streaming" ||
      status === "submitted"
    ) {
      return;
    }

    activeRepoOverviewRequestKey.current = overviewKey;
    setMessages([]);
    void sendMessage({ text: createOrigamiMessagePayload(source) });
  }, [messages.length, repoOverviewGraphs, sendMessage, setMessages, source, status]);

  useEffect(() => {
    const toolPart = findLatestToolPart(messages);

    if (
      toolPart?.type === "tool-buildArchitectureGraph" &&
      activeRepoOverviewRequestKey.current
    ) {
      setRepoOverviewGraphs((current) => ({
        ...current,
        [activeRepoOverviewRequestKey.current as string]:
          toolPart.output as ArchitectureGraphOutput,
      }));
      activeRepoOverviewRequestKey.current = null;
    }
  }, [messages]);

  async function loadRepo(url: string) {
    setIsIntakeBusy(true);
    setSurfaceError(null);
    setSurfaceMessage("Scanning repository documents...");

    try {
      const response = await fetch("/api/github-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not scan the repository.");
      }

      replaceSource(payload as RepoSourceDocument, `Scanned ${payload.label}.`);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Failed to load repository.";
      setSurfaceError(message);
    } finally {
      setIsIntakeBusy(false);
    }
  }

  function replaceSource(nextSource: SourceDocument, message?: string) {
    setSource(nextSource);
    setMessages([]);
    setV0PreviewState({ status: "idle" });
    setV0McpState({ status: "idle" });
    setSurfaceError(null);
    setSurfaceMessage(message ?? null);
    activeRepoOverviewRequestKey.current = null;
    setStandaloneInsightState({ status: "idle" });

    if (nextSource.kind !== "pdf") {
      setPdfInsight(null);
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      setPdfPreviewUrl(null);
    }

  }

  function loadSample(sampleId: string) {
    const sample = sampleSources.find((item) => item.id === sampleId) ?? DEFAULT_SAMPLE;
    replaceSource(sample.source, `Loaded sample: ${sample.title}`);
    setGithubUrl("");

    if (sample.source.kind === "pdf") {
      setPdfInsight(buildPdfFallbackInsight(sample.source));
    }

    if (sample.source.kind === "text" || sample.source.kind === "file") {
      setPastedText(sample.source.text);
    }
  }

  async function loadStandaloneInsight(nextSource: BaseTextSourceDocument) {
    const cacheKey = buildStandaloneAnalysisKey(nextSource);

    if (standaloneInsightState.status === "loading") {
      return;
    }

    setStandaloneInsightState({ status: "loading" });

    try {
      const response = await fetch("/api/document-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextSource.label,
          content: nextSource.text,
          sourceKind: nextSource.kind,
          path: cacheKey,
          relatedPaths: [],
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not analyze the selected source.");
      }

      setStandaloneInsightState({ status: "ready", insight: payload });
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not analyze the selected source.";
      setStandaloneInsightState({ status: "error", error: message });
    }
  }

  async function loadRepoTabAnalysis(nextSource: RepoSourceDocument, tab: RepoFileDescriptor) {
    if (tab.kind !== "markdown") {
      return;
    }

    const cacheKey = buildRepoAnalysisKey(nextSource, tab.path);
    const currentState = repoTabAnalyses[cacheKey];

    if (currentState?.status === "loading" || currentState?.status === "ready") {
      return;
    }

    const content = nextSource.contentCache[tab.path];
    if (!content?.trim()) {
      setRepoTabAnalyses((current) => ({
        ...current,
        [cacheKey]: { status: "error", error: "No content available for this file." },
      }));
      return;
    }

    setRepoTabAnalyses((current) => ({
      ...current,
      [cacheKey]: { status: "loading" },
    }));

    try {
      const response = await fetch("/api/document-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoLabel: nextSource.label,
          branch: nextSource.repo.branch,
          path: tab.path,
          title: tab.title,
          content,
          sourceKind: "repo",
          relatedPaths: nextSource.tabs
            .filter((candidate) => candidate.path !== tab.path)
            .slice(0, 10)
            .map((candidate) => candidate.path),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not analyze the selected file.");
      }

      setRepoTabAnalyses((current) => ({
        ...current,
        [cacheKey]: { status: "ready", insight: payload },
      }));
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not analyze the selected file.";
      setRepoTabAnalyses((current) => ({
        ...current,
        [cacheKey]: { status: "error", error: message },
      }));
    }
  }

  async function handleAnalyzeInteractive() {
    if (!source) {
      return;
    }

    setSurfaceError(null);
    setMessages([]);

    if (source.kind === "repo" && source.selectedTabId === "overview") {
      activeRepoOverviewRequestKey.current = `${source.sourceUrl}::${source.repo.branch}`;
    } else {
      activeRepoOverviewRequestKey.current = null;
    }

    await sendMessage({ text: createOrigamiMessagePayload(source) });
  }

  function handleUsePastedText() {
    if (!pastedText.trim()) {
      setSurfaceError("Paste some source text first.");
      return;
    }

    replaceSource(
      {
        kind: "text",
        label: "Pasted source",
        text: pastedText,
        fetchedAt: new Date().toISOString(),
      },
      "Loaded pasted source text.",
    );
  }

  async function handleFileUpload(file: File) {
    setIsIntakeBusy(true);
    setSurfaceError(null);

    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/pdf-extract", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to extract PDF text.");
        }

        if (pdfPreviewUrl) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }

        setPdfPreviewUrl(URL.createObjectURL(file));
        setPdfInsight(payload.insight as PdfInsightOutput);
        replaceSource(payload.source as SourceDocument, `Loaded ${file.name}.`);
        return;
      }

      const text = await file.text();
      const nextSource: BaseTextSourceDocument = {
        kind: "file",
        label: file.name,
        text,
        fetchedAt: new Date().toISOString(),
      };

      setPastedText(text);
      replaceSource(nextSource, `Loaded ${file.name}.`);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Failed to load the selected file.";
      setSurfaceError(message);
    } finally {
      setIsIntakeBusy(false);
    }
  }

  async function handleGenerateV0Preview() {
    if (!source) {
      return;
    }

    setV0PreviewState({ status: "loading" });
    setV0McpState({ status: "idle" });

    try {
      const response = await fetch("/api/v0-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKind: source.kind,
          sourceLabel: source.label,
          brief: createSourceBrief(source),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not generate the v0 MVP brief.");
      }

      setV0PreviewState({ status: "ready", preview: payload as MiniAppPreview });
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not generate the v0 MVP brief.";
      setV0PreviewState({ status: "error", error: message });
    }
  }

  async function handleContinueInV0() {
    if (!source) {
      return;
    }

    setV0McpState({ status: "loading" });

    try {
      const response = await fetch("/api/v0-mcp/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKind: source.kind,
          sourceLabel: source.label,
          brief: createSourceBrief(source),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create the v0 MCP session.");
      }

      setV0McpState({ status: "ready", session: payload as V0McpSession });
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not create the v0 MCP session.";
      setV0McpState({ status: "error", error: message });
    }
  }

  function openRepoTab(pathOrOverview: string) {
    if (!source || source.kind !== "repo") {
      return;
    }

    const nextSource = {
      ...source,
      selectedTabId:
        pathOrOverview === "overview"
          ? "overview"
          : source.tabs.find((tab) => tab.path === pathOrOverview)?.id ?? pathOrOverview,
    } as RepoSourceDocument;

    replaceSource(nextSource);

    const nextTab =
      pathOrOverview === "overview"
        ? null
        : nextSource.tabs.find((tab) => tab.path === pathOrOverview) ??
          nextSource.tabs.find((tab) => tab.id === pathOrOverview) ??
          null;

    if (nextTab?.kind === "markdown") {
      void loadRepoTabAnalysis(nextSource, nextTab);
    }
  }

  if (!source) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/60">
        Initializing Origami workspace…
      </div>
    );
  }

  const activeSource = source;

  const selectedRepoTab =
    activeSource.kind === "repo" ? getSelectedRepoTab(activeSource) : null;
  const selectedRepoTabText =
    activeSource.kind === "repo" && selectedRepoTab
      ? activeSource.contentCache[selectedRepoTab.path] ?? ""
      : "";
  const selectedPackageInsight =
    activeSource.kind === "repo" &&
    selectedRepoTab?.kind === "manifest" &&
    selectedRepoTabText.trim()
      ? summarizePackageManifest(selectedRepoTab.path, selectedRepoTabText)
      : null;
  const selectedRepoAnalysisKey =
    activeSource.kind === "repo" && selectedRepoTab?.kind === "markdown"
      ? buildRepoAnalysisKey(activeSource, selectedRepoTab.path)
      : null;
  const selectedRepoTabAnalysis = selectedRepoAnalysisKey
    ? repoTabAnalyses[selectedRepoAnalysisKey]
    : undefined;
  const repoOverviewKey =
    activeSource.kind === "repo"
      ? `${activeSource.sourceUrl}::${activeSource.repo.branch}`
      : null;
  const overviewGraph =
    repoOverviewKey && activeSource.kind === "repo"
      ? repoOverviewGraphs[repoOverviewKey]
      : undefined;

  const selectedSourceView =
    activeSource.kind === "repo"
      ? activeSource.selectedTabId === "overview"
        ? {
            title: `${activeSource.repo.owner}/${activeSource.repo.repo}`,
            kindLabel: "overview",
            subtitle: `${activeSource.tabs.length} included docs and manifests`,
            text: buildRepoOverviewText(activeSource),
            isEditable: false,
            pdfPreviewUrl: null,
          }
        : {
            title: selectedRepoTab?.title ?? activeSource.label,
            kindLabel: selectedRepoTab?.kind ?? "repo",
            subtitle: selectedRepoTab?.path ?? activeSource.label,
            text: selectedRepoTabText || "[Content unavailable]",
            isEditable: false,
            pdfPreviewUrl: null,
          }
      : activeSource.kind === "pdf"
        ? {
            title: activeSource.fileName,
            kindLabel: activeSource.kind,
            subtitle: `${activeSource.pageCount} pages • extracted text ready`,
            text: activeSource.text,
            isEditable: false,
            pdfPreviewUrl,
          }
        : {
            title: activeSource.label,
            kindLabel: activeSource.kind,
            subtitle: activeSource.sourceUrl || "Local source",
            text: activeSource.text,
            isEditable: true,
            pdfPreviewUrl: null,
          };
  const sourceStats = getSourceStats(selectedSourceView.text);

  function renderBreakdownContent() {
    if (activeSource.kind === "repo") {
      if (activeSource.selectedTabId === "overview") {
        return (
          <RepoOverview
            graph={overviewGraph}
            onOpenRepoPath={openRepoTab}
            source={activeSource}
          />
        );
      }

      if (selectedRepoTab?.kind === "manifest") {
        return <PackageDashboard insight={selectedPackageInsight} />;
      }

      if (selectedRepoTabAnalysis?.status === "loading") {
        return <LoadingCard label="Analyzing the selected repository file…" />;
      }

      if (selectedRepoTabAnalysis?.status === "error") {
        return (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-6 text-sm text-red-50">
            {selectedRepoTabAnalysis.error}
          </div>
        );
      }

      if (selectedRepoTabAnalysis?.status === "ready") {
        return (
          <DocumentInsight
            insight={selectedRepoTabAnalysis.insight}
            onOpenRepoPath={openRepoTab}
          />
        );
      }

      return (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-white/50">
          Select a markdown document to load its breakdown.
        </div>
      );
    }

    if (activeSource.kind === "pdf") {
      return <PdfBreakdown insight={pdfInsight} source={activeSource} />;
    }

    if (standaloneInsightState.status === "loading") {
      return <LoadingCard label="Analyzing the active document…" />;
    }

    if (standaloneInsightState.status === "error") {
      return (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-6 text-sm text-red-50">
          {standaloneInsightState.error}
        </div>
      );
    }

    if (standaloneInsightState.status === "ready") {
      return <DocumentInsight insight={standaloneInsightState.insight} />;
    }

    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-8 text-sm text-[#A1A1AA]">
        Origami will generate a breakdown for this source as soon as it is loaded.
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30">
      <input
        accept=".pdf,.txt,.md,.mdx,.json,.yaml,.yml,.csv,.ts,.tsx,.js,.jsx"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await handleFileUpload(file);
          }
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />

      {/* Left Sidebar (Repo Tabs) */}
      {activeSource.kind === "repo" && (
        <div className="w-64 border-r border-white/10 flex flex-col h-full bg-[#0A0A0A] overflow-y-auto shrink-0 hidden md:flex">
          <div className="p-4 border-b border-white/10 shrink-0">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/44 mb-1">
              Repository
            </div>
            <div className="text-sm font-medium text-white/90 truncate">
              {activeSource.repo.repo}
            </div>
          </div>
          <div className="p-2 flex flex-col gap-1">
            <button
              className={cn(
                "px-3 py-2 text-left rounded-xl transition text-sm",
                activeSource.selectedTabId === "overview"
                  ? "bg-lime-300/10 text-lime-50"
                  : "text-white/70 hover:bg-white/[0.04] hover:text-white"
              )}
              onClick={() => openRepoTab("overview")}
            >
              Overview Dashboard
            </button>
            {activeSource.tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "px-3 py-2 text-left rounded-xl transition flex flex-col gap-0.5",
                  activeSource.selectedTabId === tab.id
                    ? "bg-lime-300/10 text-lime-50"
                    : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                )}
                onClick={() => openRepoTab(tab.path)}
              >
                <div className="text-sm font-medium truncate w-full">{tab.title}</div>
                <div className="text-[10px] text-white/40 truncate w-full">{tab.path}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <DashboardNavbar
          title="The Universal Interactive Engine"
          subtitle="Generate interactive canvases from source"
          interactiveBusy={status === "submitted" || status === "streaming"}
          v0Busy={v0PreviewState.status === "loading"}
          mcpBusy={v0McpState.status === "loading"}
          hasV0Key={hasV0Key}
          onAnalyzeInteractive={() => void handleAnalyzeInteractive()}
          onStopInteractive={stop}
          onGenerateV0Preview={() => void handleGenerateV0Preview()}
          onContinueInV0={() => void handleContinueInV0()}
        />

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4">
          {(surfaceMessage || surfaceError) && (
            <div className="flex flex-col gap-2 shrink-0">
              {surfaceMessage && (
                <div className="rounded-xl border border-lime-300/15 bg-lime-300/10 px-4 py-3 text-sm text-lime-50/88">
                  {surfaceMessage}
                </div>
              )}
              {surfaceError && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
                  {surfaceError}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
            {/* Main Column: Massive Canvas */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <OrigamiCanvas
                chatError={error?.message}
                messages={messages}
                onOpenRepoPath={activeSource.kind === "repo" ? openRepoTab : undefined}
                sourceLabel={selectedSourceView.title}
                status={status}
              />
            </div>

            {/* Right Column: Context & Breakdown (Scrollable Sidebar) */}
            <div className="w-full xl:w-[420px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-1 pb-4">
              <SourcePanel
                fetchedAt={activeSource.fetchedAt}
                isDraggingFile={isDraggingFile}
                isEditable={selectedSourceView.isEditable}
                kindLabel={selectedSourceView.kindLabel}
                onDragEnter={() => setIsDraggingFile(true)}
                onDragLeave={() => setIsDraggingFile(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    void handleFileUpload(file);
                  }
                }}
                onSourceChange={(value) => {
                  if (activeSource.kind === "text" || activeSource.kind === "file") {
                    setSource({ ...activeSource, text: value });
                    setPastedText(value);
                    setStandaloneInsightState({ status: "idle" });
                  }
                }}
                pdfPreviewUrl={selectedSourceView.pdfPreviewUrl}
                sourceStats={sourceStats}
                sourceText={selectedSourceView.text}
                subtitle={selectedSourceView.subtitle}
                title={selectedSourceView.title}
              />

              <PanelFrame
                subtitle="Overview cards, file-level breakdowns, manifest dashboards, or PDF summaries."
                title="Breakdown"
              >
                {renderBreakdownContent()}
              </PanelFrame>

              <PanelFrame
                subtitle="Generate a deterministic mini-app brief with the official v0 model."
                title="v0 MVP"
              >
                <V0PreviewPanel
                  hasV0Key={hasV0Key}
                  mcpState={v0McpState}
                  onContinueInV0={() => void handleContinueInV0()}
                  onGenerate={() => void handleGenerateV0Preview()}
                  previewState={v0PreviewState}
                  sourceLabel={selectedSourceView.title}
                />
              </PanelFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
