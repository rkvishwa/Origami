import { NextResponse } from "next/server";

import { fetchGitHubRepoSource } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const { url }: { url?: string } = await request.json();

    if (!url?.trim()) {
      return NextResponse.json(
        { error: "A GitHub repository URL is required." },
        { status: 400 },
      );
    }

    const result = await fetchGitHubRepoSource(url);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch repository documents.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
