import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrigamiModel, getV0Model } from "@/lib/model";
import { V0_PREVIEW_SYSTEM_PROMPT } from "@/lib/prompts";
import { miniAppPreviewSchema } from "@/lib/tools";

const requestSchema = z.object({
  sourceKind: z.enum(["text", "file", "repo", "pdf"]),
  sourceLabel: z.string().min(1),
  brief: z.string().min(1),
});

export const maxDuration = 60;

function stripJsonFences(text: string) {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

async function generatePreviewWithModel(
  model: ReturnType<typeof getV0Model> | ReturnType<typeof getOrigamiModel>,
  payload: z.infer<typeof requestSchema>,
) {
  const { text } = await generateText({
    model,
    system: `${V0_PREVIEW_SYSTEM_PROMPT}

Return valid JSON only. Do not wrap it in markdown fences.`,
    prompt: [
      `Source kind: ${payload.sourceKind}`,
      `Source label: ${payload.sourceLabel}`,
      "",
      "Return a JSON object that exactly matches this shape:",
      `{
  "appTitle": string,
  "pitch": string,
  "targetUser": string,
  "appType": string,
  "designDirection": string,
  "screenCards": [{ "name": string, "purpose": string, "keyElements": string[] }],
  "primaryUserFlow": string[],
  "componentPalette": string[],
  "keyEntities": [{ "name": string, "role": string }],
  "launchChecklist": string[],
  "constraints": string[]
}`,
      "",
      "SOURCE BRIEF START",
      payload.brief,
      "SOURCE BRIEF END",
    ].join("\n"),
  });

  return miniAppPreviewSchema.parse(JSON.parse(stripJsonFences(text)));
}

export async function POST(request: Request) {
  try {
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        {
          error:
            "V0_API_KEY is missing. Add it to generate the v0 MVP brief from this source.",
        },
        { status: 400 },
      );
    }

    const payload = requestSchema.parse(await request.json());

    try {
      const preview = await generatePreviewWithModel(getV0Model(), payload);
      return NextResponse.json(preview);
    } catch (providerError) {
      const providerMessage =
        providerError instanceof Error ? providerError.message : "v0 preview failed";

      const preview = await generatePreviewWithModel(getOrigamiModel(), payload);

      return NextResponse.json({
        ...preview,
        _meta: {
          fallback: true,
          reason: providerMessage,
        },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate the v0 MVP preview.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
