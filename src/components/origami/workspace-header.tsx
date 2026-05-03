"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";

type DashboardNavbarProps = {
  title: string;
  subtitle: string;
  interactiveBusy: boolean;
  onStopInteractive: () => void;
  onNewWorkspace?: () => void;
};

export function DashboardNavbar({
  title,
  subtitle,
  interactiveBusy,
  onStopInteractive,
  onNewWorkspace,
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
            {onNewWorkspace && (
              <button
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/60 transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-300"
                onClick={onNewWorkspace}
                type="button"
                title="Clear current workspace and start fresh"
              >
                <PlusCircle className="h-4 w-4" />
                New Workspace
              </button>
            )}
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
          </div>
        </div>
      </div>
    </header>
  );
}
