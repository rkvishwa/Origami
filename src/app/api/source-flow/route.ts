import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrigamiModel } from "@/lib/model";
import { SOURCE_FLOW_SYSTEM_PROMPT } from "@/lib/prompts";
import { normalizeSourceFlow, sourceFlowOutputSchema } from "@/lib/source-flow";

const requestSchema = z.object({
  sourceKind: z.enum(["text", "file", "repo", "pdf"]),
  sourceLabel: z.string().min(1),
  brief: z.string().min(1),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());

    const { object } = await generateObject({
      model: getOrigamiModel(),
      system: SOURCE_FLOW_SYSTEM_PROMPT,
      schema: sourceFlowOutputSchema,
      prompt: [
        `Source kind: ${payload.sourceKind}`,
        `Source label: ${payload.sourceLabel}`,
        "",
        "SOURCE BRIEF START",
        payload.brief,
        "SOURCE BRIEF END",
      ].join("\n"),
    });

    return NextResponse.json(normalizeSourceFlow(object));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate the source flow map.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
