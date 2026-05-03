"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardNavbarProps = {
  title: string;
  subtitle: string;
  interactiveBusy: boolean;
  v0Busy: boolean;
  mcpBusy: boolean;
  hasV0Key: boolean;
  onAnalyzeInteractive: () => void;
  onStopInteractive: () => void;
  onGenerateV0Preview: () => void;
  onContinueInV0: () => void;
};

export function DashboardNavbar({
  title,
  subtitle,
  interactiveBusy,
  v0Busy,
  mcpBusy,
  hasV0Key,
  onAnalyzeInteractive,
  onStopInteractive,
  onGenerateV0Preview,
  onContinueInV0,
}: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
            disabled={v0Busy || !hasV0Key}
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/84 transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed"
            disabled={mcpBusy || !hasV0Key}
            onClick={onContinueInV0}
            type="button"
          >
            {mcpBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Continue in v0
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
        </div>
      </div>
    </header>
  );
}

