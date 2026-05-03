import { Suspense } from "react";

import { WorkspaceApp } from "@/components/origami/workspace-app";

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white/60">
          Loading Origami workspace…
        </div>
      }
    >
      <WorkspaceApp />
    </Suspense>
  );
}
