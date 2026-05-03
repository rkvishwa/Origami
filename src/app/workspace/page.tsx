import { Suspense } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { WorkspaceApp } from "@/components/origami/workspace-app";

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#000000] selection:bg-lime-300/30">
          <div className="relative flex flex-col items-center">
            <div className="absolute inset-0 bg-lime-300/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden mb-8">
              <Image src="/icon.png" alt="Origami" width={64} height={64} className="h-full w-full object-contain p-3 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-lime-300" />
              <span className="text-lg font-bold tracking-tight text-white/80">Initializing Workspace</span>
            </div>
            <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-lime-300/60 to-transparent bg-[length:200%_100%]" />
            </div>
          </div>
        </div>
      }
    >
      <WorkspaceApp />
    </Suspense>
  );
}
