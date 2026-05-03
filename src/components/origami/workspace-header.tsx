"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardNavbarProps = {
  title: string;
  subtitle: string;
  interactiveBusy: boolean;
  v0Busy: boolean;
  isRightPanelCollapsed: boolean;
  onToggleRightPanel: () => void;
  onAnalyzeInteractive: () => void;
  onStopInteractive: () => void;
  onGenerateV0Preview: () => void;
};

export function DashboardNavbar({
  title,
  subtitle,
  interactiveBusy,
  v0Busy,
  isRightPanelCollapsed,
  onToggleRightPanel,
  onAnalyzeInteractive,
  onStopInteractive,
  onGenerateV0Preview,
}: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black overflow-hidden">
              <Image src="/icon.png" alt="Origami" width={40} height={40} className="h-full w-full object-contain p-1" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-semibold text-white/94">{title}</h1>
              <p className="text-xs text-white/56">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {interactiveBusy ? (
              <button
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/16"
                onClick={onStopInteractive}
                type="button"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Stop stream
              </button>
            ) : null}
            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed"
              disabled={v0Busy}
              onClick={onGenerateV0Preview}
              type="button"
            >
              {v0Busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              v0 MVP
            </button>
            <button
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition",
                "bg-gradient-to-r from-lime-300 to-lime-400 hover:opacity-92",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
              disabled={interactiveBusy}
              onClick={onAnalyzeInteractive}
              type="button"
            >
              {interactiveBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate interactive
            </button>
            <button
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
                isRightPanelCollapsed
                  ? "border-white/10 bg-[#111] text-white/80 hover:bg-white/10 hover:text-white"
                  : "border-lime-300/30 bg-lime-300/10 text-lime-100 hover:bg-lime-300/20"
              )}
              onClick={onToggleRightPanel}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M15 3v18" />
              </svg>
              {isRightPanelCollapsed ? "Open Details" : "Close Details"}
            </button>
          </div>
        </div>


      </div>
    </header>
  );
}
