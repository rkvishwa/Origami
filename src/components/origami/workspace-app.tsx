"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowRight, FolderGit2, Terminal, UploadCloud } from "lucide-react";

import { OrigamiCanvas } from "@/components/origami/canvas";
import { DocumentInsight } from "@/components/origami/document-insight";
import {
  MvpSitePanel,
  type MvpSiteGenerationState,
} from "@/components/origami/mvp-site-panel";
import { PackageDashboard } from "@/components/origami/package-dashboard";
import { PdfBreakdown } from "@/components/origami/pdf-breakdown";
import { RepoOverview } from "@/components/origami/repo-overview";
import { SourceQuestionBox } from "@/components/origami/source-question-box";
import { SourcePanel } from "@/components/origami/source-panel";
import { DashboardNavbar } from "@/components/origami/workspace-header";
import { buildMvpArtifactHref, persistMvpArtifact } from "@/lib/mvp-site";
import { buildPdfFallbackInsight } from "@/lib/pdf";
import { summarizePackageManifest } from "@/lib/repo-insights";
import { sampleSources } from "@/lib/samples";
import { uploadStore } from "@/lib/upload-store";
import {
  buildRepoOverviewText,
  createSourceBrief,
  createOrigamiMessagePayload,
  createMvpSourceBrief,
  createSourceQaSnapshot,
  getSelectedRepoTab,
  getSourceStats,
} from "@/lib/source";
import type {
  ArchitectureGraphOutput,
  BaseTextSourceDocument,
  MvpSiteArtifact,
  PdfInsightOutput,
  RepoFileDescriptor,
  RepoSourceDocument,
  RepoTabAnalysisState,
  SourceDocument,
  SourceFlowOutput,
  SourceFlowState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_SAMPLE = sampleSources[1];

type SourceQuestionTurn = {
  id: string;
  question: string;
  answer: string;
};

function buildRepoAnalysisKey(source: RepoSourceDocument, path: string) {
  return `${source.sourceUrl}::${source.repo.branch}::${path}`;
}

function buildStandaloneAnalysisKey(source: BaseTextSourceDocument) {
  return `${source.kind}::${source.label}::${source.fetchedAt ?? "local"}`;
}

function createSourceContextToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

export function WorkspaceApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const activeRepoOverviewRequestKey = useRef<string | null>(null);
  const autoAnalyzedOverviewKeyRef = useRef<string | null>(null);
  const activeSourceFlowRequestKey = useRef<string | null>(null);
  const [source, setSource] = useState<SourceDocument | null>(null);
  const [sourceContextKey, setSourceContextKey] = useState<string | null>(null);
  const [surfaceError, setSurfaceError] = useState<string | null>(null);
  const [isIntakeBusy, setIsIntakeBusy] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfInsight, setPdfInsight] = useState<PdfInsightOutput | null>(null);
  const [sourceFlowState, setSourceFlowState] = useState<SourceFlowState>({
    status: "idle",
  });
  const [sourceFlowRenderKey, setSourceFlowRenderKey] = useState(0);
  const [standaloneInsightState, setStandaloneInsightState] = useState<RepoTabAnalysisState>({
    status: "idle",
  });
  const [repoTabAnalyses, setRepoTabAnalyses] = useState<Record<string, RepoTabAnalysisState>>(
    {},
  );
  const [mvpSiteState, setMvpSiteState] = useState<MvpSiteGenerationState>({
    status: "idle",
  });
  const [workspaceQuestion, setWorkspaceQuestion] = useState("");
  const [workspaceQuestionState, setWorkspaceQuestionState] = useState<{
    status: "idle" | "loading" | "error";
    error?: string | null;
  }>({ status: "idle", error: null });
  const [workspaceQuestionHistory, setWorkspaceQuestionHistory] = useState<
    SourceQuestionTurn[]
  >([]);
  const [rightSidebarTab, setRightSidebarTab] = useState<"source" | "breakdown" | "v0">("source");
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true);
  const [repoOverviewGraphs, setRepoOverviewGraphs] = useState<
    Record<string, ArchitectureGraphOutput>
  >({});

  const [githubUrl, setGithubUrl] = useState("");
  const [pastedText, setPastedText] = useState("");

  const handleScanRepo = () => {
    if (!githubUrl.trim()) return;
    const target = githubUrl.trim();
    localStorage.setItem("origami_last_route", `?repo=${encodeURIComponent(target)}`);
    window.history.replaceState({}, '', `/workspace?repo=${encodeURIComponent(target)}`);
    void loadRepo(target);
  };

  const handleUsePastedText = () => {
    if (!pastedText.trim()) return;
    localStorage.setItem("origami_last_route", `?source=pasted-store`);
    window.history.replaceState({}, '', `/workspace?source=pasted-store`);
    const nextSource: BaseTextSourceDocument = {
      kind: "file",
      label: "Pasted source text",
      text: pastedText,
      fetchedAt: new Date().toISOString(),
    };
    replaceSource(nextSource);
  };

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

    // Restore session state saved before navigating to MVP (handles upload/pasted sources
    // that cannot be recovered from URL params alone since uploadStore is cleared on first read).
    const savedSourceRaw = sessionStorage.getItem("origami_session_source");
      if (savedSourceRaw) {
      try {
        const parsedSource = JSON.parse(savedSourceRaw) as SourceDocument;
        sessionStorage.removeItem("origami_session_source");

        const savedPdfInsightRaw = sessionStorage.getItem("origami_session_pdfInsight");
        if (savedPdfInsightRaw) {
          setPdfInsight(JSON.parse(savedPdfInsightRaw) as PdfInsightOutput);
          sessionStorage.removeItem("origami_session_pdfInsight");
        }

        const savedInsightRaw = sessionStorage.getItem("origami_session_standaloneInsight");
        if (savedInsightRaw) {
          setStandaloneInsightState(JSON.parse(savedInsightRaw) as RepoTabAnalysisState);
          sessionStorage.removeItem("origami_session_standaloneInsight");
        }

        setSource(parsedSource);
        setSourceContextKey(createSourceContextToken());
        setSourceFlowState({ status: "loading" });
        return;
      } catch {
        // Corrupted session data — clear and fall through to URL-based restoration.
        sessionStorage.removeItem("origami_session_source");
        sessionStorage.removeItem("origami_session_pdfInsight");
        sessionStorage.removeItem("origami_session_standaloneInsight");
      }
    }

    const repoUrl = searchParams.get("repo");
    const sampleId = searchParams.get("sample");
    const uploadSource = searchParams.get("source");
    const queryUrl = searchParams.get("url");

    if (repoUrl || queryUrl) {
      const target = repoUrl || queryUrl;
      localStorage.setItem("origami_last_route", `?repo=${encodeURIComponent(target!)}`);
      void loadRepo(target!);
      return;
    }

    if (sampleId) {
      localStorage.setItem("origami_last_route", `?sample=${encodeURIComponent(sampleId)}`);
      const sample = sampleSources.find((item) => item.id === sampleId) ?? DEFAULT_SAMPLE;
      loadSample(sample.id);
      return;
    }

    if (uploadSource === "upload-store") {
      const file = uploadStore.file;
      uploadStore.file = null;
      if (file) {
        localStorage.setItem("origami_last_route", `?source=upload-store`);
        void handleFileUpload(file);
      }
      return;
    }

    if (uploadSource === "pasted-store") {
      const text = uploadStore.pastedText;
      uploadStore.pastedText = null;
      if (text) {
        localStorage.setItem("origami_last_route", `?source=pasted-store`);
        const nextSource: BaseTextSourceDocument = {
          kind: "file",
          label: "Pasted source text",
          text,
          fetchedAt: new Date().toISOString(),
        };
        replaceSource(nextSource);
      }
      return;
    }

    const lastRoute = localStorage.getItem("origami_last_route");
    if (lastRoute) {
      const search = new URLSearchParams(lastRoute);
      const lastRepo = search.get("repo");
      const lastSample = search.get("sample");
      
      if (lastRepo) {
        router.replace(`/workspace${lastRoute}`);
        void loadRepo(lastRepo);
        return;
      }
      if (lastSample) {
        router.replace(`/workspace${lastRoute}`);
        const sample = sampleSources.find((item) => item.id === lastSample) ?? DEFAULT_SAMPLE;
        loadSample(sample.id);
        return;
      }
    }


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
    if (repoOverviewGraphs[overviewKey]) {
      activeRepoOverviewRequestKey.current = null;
      autoAnalyzedOverviewKeyRef.current = overviewKey;
      return;
    }

    if (
      activeRepoOverviewRequestKey.current === overviewKey ||
      autoAnalyzedOverviewKeyRef.current === overviewKey ||
      status === "streaming" ||
      status === "submitted"
    ) {
      return;
    }

    activeRepoOverviewRequestKey.current = overviewKey;
    autoAnalyzedOverviewKeyRef.current = overviewKey;
    setMessages([]);
    void sendMessage({ text: createOrigamiMessagePayload(source) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoOverviewGraphs, source, status]);

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

  useEffect(() => {
    if (!source || !sourceContextKey) {
      return;
    }

    void loadSourceFlow(source, sourceContextKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceContextKey]);

  async function loadRepo(url: string) {
    setIsIntakeBusy(true);
    setSurfaceError(null);

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

      replaceSource(payload as RepoSourceDocument);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Failed to load repository.";
      setSurfaceError(message);
    } finally {
      setIsIntakeBusy(false);
    }
  }

  function replaceSource(nextSource: SourceDocument) {
    setSource(nextSource);
    setSourceContextKey(createSourceContextToken());
    setMessages([]);
    setMvpSiteState({ status: "idle" });
    setWorkspaceQuestion("");
    setWorkspaceQuestionHistory([]);
    setWorkspaceQuestionState({ status: "idle", error: null });
    setSurfaceError(null);
    setSourceFlowState({ status: "loading" });
    activeRepoOverviewRequestKey.current = null;
    activeSourceFlowRequestKey.current = null;
    autoAnalyzedOverviewKeyRef.current = null;
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
    replaceSource(sample.source);

    if (sample.source.kind === "pdf") {
      setPdfInsight(buildPdfFallbackInsight(sample.source));
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

  async function loadSourceFlow(
    nextSource: SourceDocument,
    contextKey: string,
    options?: {
      preserveExisting?: boolean;
    },
  ) {
    const previousFlow =
      sourceFlowState.status === "ready"
        ? sourceFlowState.flow
        : sourceFlowState.status === "loading" || sourceFlowState.status === "error"
          ? sourceFlowState.flow
          : undefined;

    activeSourceFlowRequestKey.current = contextKey;
    setSourceFlowState(
      options?.preserveExisting && previousFlow
        ? { status: "loading", flow: previousFlow }
        : { status: "loading" },
    );

    try {
      const response = await fetch("/api/source-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKind: nextSource.kind,
          sourceLabel: nextSource.label,
          brief: createSourceBrief(nextSource),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not generate the source flow map.");
      }

      if (activeSourceFlowRequestKey.current !== contextKey) {
        return;
      }

      setSourceFlowState({
        status: "ready",
        flow: payload as SourceFlowOutput,
      });
      setSourceFlowRenderKey((current) => current + 1);
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not generate the source flow map.";

      if (activeSourceFlowRequestKey.current !== contextKey) {
        return;
      }

      setSourceFlowState(
        previousFlow
          ? { status: "error", error: message, flow: previousFlow }
          : { status: "error", error: message },
      );
    }
  }

  function handleRefreshSourceFlow() {
    if (!source || !sourceContextKey) {
      return;
    }

    void loadSourceFlow(source, sourceContextKey, { preserveExisting: true });
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



  async function handleFileUpload(file: File) {
    localStorage.setItem("origami_last_route", `?source=upload-store`);
    window.history.replaceState({}, '', `/workspace?source=upload-store`);
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
        replaceSource(payload.source as SourceDocument);
        return;
      }

      const text = await file.text();
      const nextSource: BaseTextSourceDocument = {
        kind: "file",
        label: file.name,
        text,
        fetchedAt: new Date().toISOString(),
      };

      replaceSource(nextSource);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Failed to load the selected file.";
      setSurfaceError(message);
    } finally {
      setIsIntakeBusy(false);
    }
  }

  async function handleGenerateMvpSite() {
    if (!source) {
      return;
    }

    setMvpSiteState({ status: "loading" });

    try {
      const response = await fetch("/api/v0-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKind: source.kind,
          sourceLabel: source.label,
          brief: createMvpSourceBrief(source, { pdfInsight }),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not generate the in-app MVP site.");
      }

      const artifact = payload as MvpSiteArtifact;
      persistMvpArtifact(artifact);
      setMvpSiteState({ status: "ready", artifact });

      // Persist workspace state to sessionStorage so it survives the navigation to the
      // MVP page and can be fully restored when the user navigates back.
      try {
        sessionStorage.setItem("origami_session_source", JSON.stringify(source));
        if (pdfInsight) {
          sessionStorage.setItem("origami_session_pdfInsight", JSON.stringify(pdfInsight));
        }
        if (standaloneInsightState.status === "ready") {
          sessionStorage.setItem(
            "origami_session_standaloneInsight",
            JSON.stringify(standaloneInsightState),
          );
        }
      } catch {
        // sessionStorage may be unavailable or full — navigation still proceeds.
      }

      router.push(buildMvpArtifactHref(artifact.id));
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Could not generate the in-app MVP site.";
      setMvpSiteState({ status: "error", error: message });
    }
  }

  function handleNewWorkspace() {
    setSource(null);
    setSourceContextKey(null);
    setMessages([]);
    setMvpSiteState({ status: "idle" });
    setSurfaceError(null);
    setPdfInsight(null);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    setSourceFlowState({ status: "idle" });
    setSourceFlowRenderKey(0);
    setStandaloneInsightState({ status: "idle" });
    setRepoTabAnalyses({});
    setRepoOverviewGraphs({});
    setWorkspaceQuestion("");
    setWorkspaceQuestionHistory([]);
    setWorkspaceQuestionState({ status: "idle", error: null });
    setGithubUrl("");
    setPastedText("");
    activeRepoOverviewRequestKey.current = null;
    activeSourceFlowRequestKey.current = null;
    autoAnalyzedOverviewKeyRef.current = null;
    localStorage.removeItem("origami_last_route");
    sessionStorage.removeItem("origami_session_source");
    sessionStorage.removeItem("origami_session_pdfInsight");
    sessionStorage.removeItem("origami_session_standaloneInsight");
    window.history.replaceState({}, "", "/workspace");
  }

  async function handleAskWorkspaceQuestion() {
    if (!source || !workspaceQuestion.trim()) {
      return;
    }

    setWorkspaceQuestionState({ status: "loading", error: null });

    try {
      const response = await fetch("/api/source-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKind: source.kind,
          sourceLabel: source.label,
          brief: createSourceBrief(source),
          sourceSnapshot: createSourceQaSnapshot(source),
          question: workspaceQuestion.trim(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not answer the source question.");
      }

      setWorkspaceQuestionHistory((current) => [
        {
          id: crypto.randomUUID(),
          question: workspaceQuestion.trim(),
          answer: payload.answer as string,
        },
        ...current,
      ]);
      setWorkspaceQuestion("");
      setWorkspaceQuestionState({ status: "idle", error: null });
    } catch (error) {
      setWorkspaceQuestionState({
        status: "error",
        error:
          error instanceof Error ? error.message : "Could not answer the source question.",
      });
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
    if (isIntakeBusy) {
      return (
        <div className="flex min-h-screen bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30">
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <header className="sticky top-0 z-40 h-[72px] border-b border-white/10 bg-[#0A0A0A] flex items-center px-4 md:px-6 gap-4">
               <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 animate-pulse" />
               <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
            </header>
            <div className="flex-1 flex flex-col xl:flex-row gap-4 p-4 sm:p-6">
              <div className="flex-1 flex flex-col rounded-xl border border-white/10 bg-[#0A0A0A] p-4 items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-2 text-lime-300">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg font-medium">Extracting content…</span>
                  </div>
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10 mt-2">
                    <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-lime-300/60 to-transparent bg-[length:200%_100%]" />
                  </div>
                </div>
              </div>
              <div className="w-full xl:w-[420px] shrink-0 rounded-xl border border-white/10 bg-[#0A0A0A] p-4 animate-pulse flex flex-col gap-4">
                 <div className="h-8 w-full bg-white/5 rounded" />
                 <div className="h-32 w-full bg-white/5 rounded" />
                 <div className="h-32 w-full bg-white/5 rounded" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30">
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
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A] backdrop-blur-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black overflow-hidden">
              <Image src="/icon.png" alt="Origami" width={40} height={40} className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Create Workspace</h1>
              <p className="text-xs text-white/50">Universal Source Intake</p>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-[1200px] px-6 py-20 flex flex-col items-center justify-center">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-4">
              Import your source
            </h1>
            <p className="text-base text-[#A1A1AA] max-w-[500px] mx-auto leading-relaxed">
              Origami supports GitHub repositories, PDF documents, and raw text. Upload or paste below to begin your analysis and generate a **v0-powered MVP**.
            </p>
          </div>

          {surfaceError && (
            <div className="mb-8 w-full max-w-[1000px] rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-50 shrink-0">
              {surfaceError}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3 w-full max-w-[1000px]">
            {/* GitHub Input */}
            <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 transition-all hover:border-lime-300/30 hover:shadow-[0_0_30px_rgba(163,230,53,0.05)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors group-hover:bg-lime-300 group-hover:text-black">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">Import Repository</h3>
              <p className="mb-6 text-sm text-[#A1A1AA]">
                Scan an entire codebase to generate an interactive architecture dashboard.
              </p>
              <div className="mt-auto">
                <input
                  className="mb-3 w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-[#52525B] focus:border-lime-300/50 focus:ring-1 focus:ring-lime-300/50"
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScanRepo()}
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                />
                <button
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!githubUrl.trim() || isIntakeBusy}
                  onClick={handleScanRepo}
                  type="button"
                >
                  Scan Repo <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Paste Text */}
            <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 transition-all hover:border-lime-300/30 hover:shadow-[0_0_30px_rgba(163,230,53,0.05)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors group-hover:bg-lime-300 group-hover:text-black">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">Paste Source Text</h3>
              <p className="mb-6 text-sm text-[#A1A1AA]">
                Instantly analyze dense rules, policies, or technical documentation.
              </p>
              <div className="mt-auto">
                <textarea
                  className="mb-3 h-[84px] w-full resize-none rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-[#52525B] focus:border-lime-300/50 focus:ring-1 focus:ring-lime-300/50"
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your text here..."
                  value={pastedText}
                />
                <button
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!pastedText.trim() || isIntakeBusy}
                  onClick={handleUsePastedText}
                  type="button"
                >
                  Analyze Text <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Upload File */}
            <div className="group relative flex flex-col rounded-2xl border bg-[#0A0A0A] p-6 transition-all border-white/10 hover:border-lime-300/30 hover:shadow-[0_0_30px_rgba(163,230,53,0.05)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors text-white group-hover:bg-lime-300 group-hover:text-black">
                <UploadCloud className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">Upload Documents</h3>
              <p className="mb-6 text-sm text-[#A1A1AA]">
                Extract and visualize data from local PDF files or text documents.
              </p>
              <div
                className="mt-auto flex h-[84px] mb-3 items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/50 transition-colors cursor-pointer group-hover:border-lime-300/50 group-hover:bg-lime-300/10 hover:border-lime-300/50 hover:bg-lime-300/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-sm text-[#A1A1AA]">Click to browse</span>
              </div>
              <button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-lime-300/50 hover:bg-lime-300/10 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={isIntakeBusy}
                type="button"
              >
                Select File
              </button>
            </div>
          </div>
        </main>
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
    <div className="flex min-h-screen bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30">
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
        <div className="w-64 border-r border-white/10 flex flex-col sticky top-0 h-screen bg-[#0A0A0A] overflow-y-auto shrink-0 hidden md:flex">
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
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <DashboardNavbar
          title="The Universal Interactive Engine"
          subtitle="Generate interactive canvases from source"
          interactiveBusy={status === "submitted" || status === "streaming"}
          v0Busy={mvpSiteState.status === "loading"}
          isRightPanelCollapsed={isRightPanelCollapsed}
          onToggleRightPanel={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          onAnalyzeInteractive={() => void handleAnalyzeInteractive()}
          onStopInteractive={stop}
          onGenerateV0Preview={() => void handleGenerateMvpSite()}
          onNewWorkspace={handleNewWorkspace}
        />

        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4">
          {surfaceError && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-50 shrink-0">
              {surfaceError}
            </div>
          )}

          <div className="flex-1 flex flex-col xl:flex-row gap-4">
            {/* Main Column: Massive Canvas */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="mb-4 shrink-0">
                <SourceQuestionBox
                  error={workspaceQuestionState.error}
                  history={workspaceQuestionHistory}
                  onQuestionChange={setWorkspaceQuestion}
                  onRefreshSourceFlow={handleRefreshSourceFlow}
                  onSubmit={() => void handleAskWorkspaceQuestion()}
                  question={workspaceQuestion}
                  sourceFlowRenderKey={sourceFlowRenderKey}
                  sourceFlowState={sourceFlowState}
                  sourceLabel={selectedSourceView.title}
                  status={workspaceQuestionState.status}
                />
              </div>

              {messages.length === 0 && status !== "submitted" && status !== "streaming" ? (
                <div className="flex-1">
                  {renderBreakdownContent()}
                </div>
              ) : (
                <OrigamiCanvas
                  chatError={error?.message}
                  messages={messages}
                  onOpenRepoPath={activeSource.kind === "repo" ? openRepoTab : undefined}
                  sourceLabel={selectedSourceView.title}
                  status={status}
                />
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Overlay Backdrop */}
      {!isRightPanelCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsRightPanelCollapsed(true)} 
        />
      )}

      {/* Right Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-full sm:w-[540px] bg-[#0A0A0A] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
          isRightPanelCollapsed ? "translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0 bg-[#0A0A0A]">
          <h2 className="text-sm font-semibold text-white/90">Details & Analysis</h2>
          <button
            onClick={() => setIsRightPanelCollapsed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 pt-3 gap-6 shrink-0 bg-[#0A0A0A]">
          <button
            className={cn("pb-3 text-sm font-medium transition border-b-2", rightSidebarTab === "source" ? "border-lime-300 text-lime-300" : "border-transparent text-white/50 hover:text-white/80")}
            onClick={() => setRightSidebarTab("source")}
          >
            Source
          </button>
          <button
            className={cn("pb-3 text-sm font-medium transition border-b-2", rightSidebarTab === "breakdown" ? "border-lime-300 text-lime-300" : "border-transparent text-white/50 hover:text-white/80")}
            onClick={() => setRightSidebarTab("breakdown")}
          >
            Breakdown
          </button>
          <button
            className={cn("pb-3 text-sm font-medium transition border-b-2", rightSidebarTab === "v0" ? "border-lime-300 text-lime-300" : "border-transparent text-white/50 hover:text-white/80")}
            onClick={() => setRightSidebarTab("v0")}
          >
            v0 MVP
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#000]">
          {rightSidebarTab === "source" && (
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
                  setStandaloneInsightState({ status: "idle" });
                }
              }}
              pdfPreviewUrl={selectedSourceView.pdfPreviewUrl}
              sourceStats={sourceStats}
              sourceText={selectedSourceView.text}
              subtitle={selectedSourceView.subtitle}
              title={selectedSourceView.title}
            />
          )}

          {rightSidebarTab === "breakdown" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white">Breakdown Analysis</h3>
                <p className="text-sm text-white/60">Overview cards, file-level breakdowns, manifest dashboards, or PDF summaries.</p>
              </div>
              {renderBreakdownContent()}
            </div>
          )}

          {rightSidebarTab === "v0" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white">v0 MVP Generation</h3>
                <p className="text-sm text-white/60">Generate a grounded single-page MVP route with copyable React/Tailwind code.</p>
              </div>
              <MvpSitePanel
                generationState={mvpSiteState}
                onGenerate={() => void handleGenerateMvpSite()}
                onOpenArtifact={() => {
                  if (mvpSiteState.status === "ready") {
                    router.push(buildMvpArtifactHref(mvpSiteState.artifact.id));
                  }
                }}
                sourceLabel={selectedSourceView.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
