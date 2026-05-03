import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrigamiModel } from "@/lib/model";
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
  model: ReturnType<typeof getOrigamiModel>,
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

async function generatePreviewWithV0Api(payload: z.infer<typeof requestSchema>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.v0.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.V0_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "v0-1.5-md",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `${V0_PREVIEW_SYSTEM_PROMPT}

Return valid JSON only. Do not wrap it in markdown fences.`,
          },
          {
            role: "user",
            content: [
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
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;

      try {
        const payload = (await response.json()) as { error?: { message?: string } | string };
        const message =
          typeof payload.error === "string"
            ? payload.error
            : payload.error?.message;
        if (message) {
          detail = `${detail}: ${message}`;
        }
      } catch {
        // Ignore body parse failures and preserve the HTTP status detail.
      }

      throw new Error(detail);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("The v0 API did not return a preview payload.");
    }

    return miniAppPreviewSchema.parse(JSON.parse(stripJsonFences(content)));
  } finally {
    clearTimeout(timeout);
  }
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
      const preview = await generatePreviewWithV0Api(payload);
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
