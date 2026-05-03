import { generateText, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSourceQaMcpClient,
  sourceQaSnapshotSchema,
} from "@/lib/mcp/source-qa";
import { getOrigamiModel } from "@/lib/model";
import { SOURCE_QA_SYSTEM_PROMPT } from "@/lib/prompts";

const requestSchema = z.object({
  sourceKind: z.enum(["text", "file", "repo", "pdf"]),
  sourceLabel: z.string().min(1),
  brief: z.string().min(1),
  sourceSnapshot: sourceQaSnapshotSchema,
  question: z.string().min(1),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let mcpClient:
    | Awaited<ReturnType<typeof createSourceQaMcpClient>>
    | undefined;

  try {
    const payload = requestSchema.parse(await request.json());
    mcpClient = await createSourceQaMcpClient(payload.sourceSnapshot);

    const { text } = await generateText({
      model: getOrigamiModel(),
      system: SOURCE_QA_SYSTEM_PROMPT,
      tools: await mcpClient.tools(),
      stopWhen: stepCountIs(6),
      prompt: [
        `Source kind: ${payload.sourceKind}`,
        `Source label: ${payload.sourceLabel}`,
        "",
        "SOURCE SUMMARY START",
        payload.brief,
        "SOURCE SUMMARY END",
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
  } finally {
    await mcpClient?.close().catch(() => undefined);
  }
}
