import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrigamiModel } from "@/lib/model";
import { synthesizeMvpSiteCode } from "@/lib/mvp-site";
import { MVP_SITE_SYSTEM_PROMPT } from "@/lib/prompts";
import { mvpSiteSpecSchema } from "@/lib/tools";

const currentArtifactSchema = z.object({
  id: z.string().min(1),
  appTitle: z.string().min(1),
  summary: z.string().min(1),
  sourceBrief: z.string().min(1),
  customizationHistory: z.array(z.string().min(1)).default([]),
  siteSpec: mvpSiteSpecSchema,
});

const requestSchema = z.object({
  artifactId: z.string().min(1).optional(),
  sourceKind: z.enum(["text", "file", "repo", "pdf"]),
  sourceLabel: z.string().min(1),
  brief: z.string().min(1),
  customizationPrompt: z.string().min(1).optional(),
  currentArtifact: currentArtifactSchema.optional(),
});

const modelPayloadSchema = z.object({
  appTitle: z.string().min(1),
  summary: z.string().min(1),
  siteSpec: mvpSiteSpecSchema,
});

export const runtime = "nodejs";
export const maxDuration = 60;

function stripJsonFences(text: string) {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function buildPrompt(payload: z.infer<typeof requestSchema>) {
  const baseSections = [
    `Source kind: ${payload.sourceKind}`,
    `Source label: ${payload.sourceLabel}`,
    "",
    "Return a JSON object that exactly matches this shape:",
    `{
  "appTitle": string,
  "summary": string,
  "siteSpec": {
    "hero": { "eyebrow": string, "headline": string, "subheadline": string },
    "stats": [{ "label": string, "value": string, "detail": string }],
    "featureCards": [{ "title": string, "description": string, "bullets": string[] }],
    "workflow": {
      "title": string,
      "steps": [{ "title": string, "description": string }]
    },
    "contentHighlights": {
      "title": string,
      "items": [{ "eyebrow": string, "title": string, "summary": string }]
    },
    "sourceProof": {
      "title": string,
      "items": [{ "label": string, "value": string, "detail": string }]
    },
    "cta": {
      "title": string,
      "description": string,
      "primaryLabel": string,
      "secondaryLabel": string
    }
  }
}`,
    "",
    "SOURCE BRIEF START",
    payload.brief,
    "SOURCE BRIEF END",
  ];

  if (!payload.currentArtifact || !payload.customizationPrompt) {
    return baseSections.join("\n");
  }

  return [
    ...baseSections,
    "",
    "CURRENT SITE START",
    JSON.stringify(
      {
        appTitle: payload.currentArtifact.appTitle,
        summary: payload.currentArtifact.summary,
        siteSpec: payload.currentArtifact.siteSpec,
        customizationHistory: payload.currentArtifact.customizationHistory,
      },
      null,
      2,
    ),
    "CURRENT SITE END",
    "",
    "CUSTOMIZATION REQUEST START",
    payload.customizationPrompt,
    "CUSTOMIZATION REQUEST END",
  ].join("\n");
}

async function generateArtifactPayloadWithModel(
  model: ReturnType<typeof getOrigamiModel>,
  payload: z.infer<typeof requestSchema>,
) {
  const { text } = await generateText({
    model,
    system: `${MVP_SITE_SYSTEM_PROMPT}

Return valid JSON only. Do not wrap it in markdown fences.`,
    prompt: buildPrompt(payload),
  });

  return modelPayloadSchema.parse(JSON.parse(stripJsonFences(text)));
}

async function generateArtifactPayloadWithV0Api(payload: z.infer<typeof requestSchema>) {
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
            content: `${MVP_SITE_SYSTEM_PROMPT}

Return valid JSON only. Do not wrap it in markdown fences.`,
          },
          {
            role: "user",
            content: buildPrompt(payload),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;

      try {
        const responsePayload = (await response.json()) as {
          error?: { message?: string } | string;
        };
        const message =
          typeof responsePayload.error === "string"
            ? responsePayload.error
            : responsePayload.error?.message;
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
      throw new Error("The v0 API did not return an MVP payload.");
    }

    return modelPayloadSchema.parse(JSON.parse(stripJsonFences(content)));
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());

    let artifactPayload: z.infer<typeof modelPayloadSchema>;

    if (process.env.V0_API_KEY) {
      try {
        artifactPayload = await generateArtifactPayloadWithV0Api(payload);
      } catch {
        artifactPayload = await generateArtifactPayloadWithModel(getOrigamiModel(), payload);
      }
    } else {
      artifactPayload = await generateArtifactPayloadWithModel(getOrigamiModel(), payload);
    }

    const artifactId = crypto.randomUUID();
    const artifact = {
      id: payload.artifactId ?? payload.currentArtifact?.id ?? artifactId,
      sourceKind: payload.sourceKind,
      sourceLabel: payload.sourceLabel,
      appTitle: artifactPayload.appTitle,
      summary: artifactPayload.summary,
      sourceBrief: payload.brief,
      customizationHistory:
        payload.customizationPrompt && payload.customizationPrompt.trim()
          ? [
              ...(payload.currentArtifact?.customizationHistory ?? []),
              payload.customizationPrompt.trim(),
            ]
          : payload.currentArtifact?.customizationHistory ?? [],
      siteSpec: artifactPayload.siteSpec,
      code: synthesizeMvpSiteCode({
        appTitle: artifactPayload.appTitle,
        summary: artifactPayload.summary,
        siteSpec: artifactPayload.siteSpec,
      }),
    };

    return NextResponse.json(artifact);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate the in-app MVP site.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
