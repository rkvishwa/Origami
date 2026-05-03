"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, FolderGit2, LayoutTemplate, Loader2, Terminal, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { sampleSources } from "@/lib/samples";

export function LandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleScanRepo = () => {
    if (!githubUrl.trim()) return;
    router.push(`/workspace?repo=${encodeURIComponent(githubUrl.trim())}`);
  };

  const handleUsePastedText = () => {
    if (!pastedText.trim()) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("origami_upload_name", "Pasted source text");
      window.sessionStorage.setItem("origami_upload_text", pastedText);
    }
    router.push("/workspace?source=upload");
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
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
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("origami_upload_name", file.name);
          window.sessionStorage.setItem("origami_pdf_payload", JSON.stringify(payload));
        }
        router.push("/workspace?source=pdf-upload");
      } else {
        const text = await file.text();
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("origami_upload_name", file.name);
          window.sessionStorage.setItem("origami_upload_text", text);
        }
        router.push("/workspace?source=upload");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] font-sans selection:bg-lime-300/30">
      {/* Navbar/Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-black/50 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-lime-300/10 border border-lime-300/20 text-lime-300">
            <LayoutTemplate className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Origami</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-16 md:pt-24">
        {/* Hero Section */}
        <div className="mx-auto max-w-[800px] text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-lime-300/60 mb-6">
            The Universal Interactive Engine
          </h1>
          <p className="text-lg md:text-xl text-[#A1A1AA] max-w-[600px] mx-auto leading-relaxed">
            Upload a PDF, scan a repository, or paste raw text. Origami breaks it down, streams an interactive explanation, and drafts a v0-ready MVP concept in seconds.
          </p>
        </div>

        {/* Intake Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-24">
          {/* GitHub Input */}
          <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 transition-all hover:border-white/20">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors group-hover:bg-white group-hover:text-black">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-white">Import Repository</h3>
            <p className="mb-6 text-sm text-[#A1A1AA]">
              Scan an entire codebase to generate an interactive architecture dashboard.
            </p>
            <div className="mt-auto">
              <input
                className="mb-3 w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-[#52525B] focus:border-white/30 focus:ring-1 focus:ring-white/30"
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanRepo()}
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
              />
              <button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!githubUrl.trim()}
                onClick={handleScanRepo}
                type="button"
              >
                Scan Repo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Paste Text */}
          <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 transition-all hover:border-white/20">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors group-hover:bg-white group-hover:text-black">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-white">Paste Source Text</h3>
            <p className="mb-6 text-sm text-[#A1A1AA]">
              Instantly analyze dense rules, policies, or technical documentation.
            </p>
            <div className="mt-auto">
              <textarea
                className="mb-3 h-[84px] w-full resize-none rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-[#52525B] focus:border-white/30 focus:ring-1 focus:ring-white/30"
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your text here..."
                value={pastedText}
              />
              <button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!pastedText.trim()}
                onClick={handleUsePastedText}
                type="button"
              >
                Analyze Text <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Upload File */}
          <div className={`group relative flex flex-col rounded-2xl border bg-[#0A0A0A] p-6 transition-all ${isUploading ? "border-lime-300/30" : "border-white/10 hover:border-white/20"}`}>
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors ${isUploading ? "text-lime-300" : "text-white group-hover:bg-white group-hover:text-black"}`}>
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <h3 className="mb-2 text-lg font-medium text-white">Upload Documents</h3>
            <p className="mb-6 text-sm text-[#A1A1AA]">
              {isUploading ? "Processing your file…" : "Extract and visualize data from local text files or markdown documents."}
            </p>
            {isUploading ? (
              <div className="mt-auto flex h-[84px] mb-3 flex-col items-center justify-center gap-3 rounded-lg border border-lime-300/20 bg-lime-300/5">
                <div className="flex items-center gap-2 text-lime-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Extracting content…</span>
                </div>
                <div className="h-1 w-36 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-lime-300/60 to-transparent bg-[length:200%_100%]" />
                </div>
              </div>
            ) : (
              <div
                className="mt-auto flex h-[84px] mb-3 items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/50 transition-colors cursor-pointer group-hover:border-lime-300/30 group-hover:bg-lime-300/5 hover:border-lime-300/30 hover:bg-lime-300/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-sm text-[#A1A1AA]">Click to browse</span>
              </div>
            )}
            <button
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-lime-300/50 hover:bg-lime-300/10 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              type="button"
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : "Select File"}
            </button>
            <input
              accept=".pdf,.txt,.md,.mdx,.json,.yaml,.yml,.csv,.ts,.tsx,.js,.jsx"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFileUpload(file);
                event.target.value = "";
              }}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </div>

        {/* Catalog Section */}
        <div>
          <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Example Workspaces</h2>
              <p className="text-sm text-[#A1A1AA] mt-1">Explore interactive canvases built from different sources.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sampleSources.map((sample) => (
              <button
                key={sample.id}
                onClick={() => router.push(`/workspace?sample=${sample.id}`)}
                className="group flex cursor-pointer flex-col items-start rounded-xl border border-white/10 bg-[#0A0A0A] p-5 text-left transition-all hover:border-lime-300/30 hover:bg-[#0f0f0f]"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:border-lime-300/30 group-hover:bg-lime-300/10 group-hover:text-lime-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[#A1A1AA] group-hover:text-lime-300 transition-colors">
                  {sample.eyebrow}
                </div>
                <h3 className="mb-2 text-sm font-medium text-white leading-snug">
                  {sample.title}
                </h3>
                <p className="text-sm text-[#71717A] leading-relaxed">
                  {sample.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
