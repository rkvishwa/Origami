import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrigamiModel } from "@/lib/model";
import { SOURCE_QA_SYSTEM_PROMPT } from "@/lib/prompts";

const requestSchema = z.object({
  sourceKind: z.enum(["text", "file", "repo", "pdf"]),
  sourceLabel: z.string().min(1),
  brief: z.string().min(1),
  question: z.string().min(1),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());

    const { text } = await generateText({
      model: getOrigamiModel(),
      system: SOURCE_QA_SYSTEM_PROMPT,
      prompt: [
        `Source kind: ${payload.sourceKind}`,
        `Source label: ${payload.sourceLabel}`,
        "",
        "SOURCE CONTEXT START",
        payload.brief,
        "SOURCE CONTEXT END",
        "",
        "USER QUESTION START",
        payload.question,
        "USER QUESTION END",
      ].join("\n"),
    });

    return NextResponse.json({ answer: text.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to answer the source question.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
