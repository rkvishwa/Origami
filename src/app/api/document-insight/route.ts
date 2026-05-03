import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrigamiModel } from "@/lib/model";
import { DOCUMENT_INSIGHT_SYSTEM_PROMPT } from "@/lib/prompts";
import {
  documentInsightOutputSchema,
  normalizeDocumentInsightOutput,
} from "@/lib/tools";

const requestSchema = z.object({
  repoLabel: z.string().min(1).optional(),
  branch: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  sourceKind: z.enum(["text", "file", "repo", "pdf"]).optional(),
  relatedPaths: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());

    const { object } = await generateObject({
      model: getOrigamiModel(),
      system: DOCUMENT_INSIGHT_SYSTEM_PROMPT,
      schema: documentInsightOutputSchema,
      prompt: [
        payload.repoLabel ? `Repository: ${payload.repoLabel}` : "Repository: n/a",
        payload.branch ? `Branch: ${payload.branch}` : "Branch: n/a",
        payload.path ? `Selected file: ${payload.path}` : "Selected file: standalone source",
        `Title: ${payload.title}`,
        payload.sourceKind ? `Source kind: ${payload.sourceKind}` : null,
        payload.relatedPaths.length > 0
          ? `Available related files:\n${payload.relatedPaths.map((path) => `- ${path}`).join("\n")}`
          : "Available related files: none",
        "",
        "FILE CONTENT START",
        payload.content,
        "FILE CONTENT END",
      ].join("\n"),
    });

    return NextResponse.json(normalizeDocumentInsightOutput(object));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate a document insight.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
