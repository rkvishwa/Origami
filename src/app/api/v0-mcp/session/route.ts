import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";
import { z } from "zod";

type McpTool = {
  name: string;
  description?: string;
  inputSchema?: {
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

type McpToolResult = {
  content?: Array<
    | {
        type: "text";
        text: string;
      }
    | {
        type: string;
        [key: string]: unknown;
      }
  >;
  structuredContent?: Record<string, unknown>;
};

const requestSchema = z.object({
  sourceKind: z.enum(["text", "file", "repo", "pdf"]),
  sourceLabel: z.string().min(1),
  brief: z.string().min(1),
  followUp: z.string().optional(),
});

const DEFAULT_FOLLOW_UP =
  "Continue refining this as a polished hackathon MVP with a strong dashboard shell, sharp empty states, and one memorable primary flow.";

function getToolSearchText(tool: McpTool) {
  return `${tool.name} ${tool.description ?? ""}`.toLowerCase();
}

function scoreTool(tool: McpTool, requiredTerms: string[], bonusTerms: string[]) {
  const haystack = getToolSearchText(tool);

  if (!requiredTerms.every((term) => haystack.includes(term))) {
    return -1;
  }

  return bonusTerms.reduce(
    (score, term) => score + (haystack.includes(term) ? 1 : 0),
    requiredTerms.length,
  );
}

function pickBestTool(tools: McpTool[], variants: Array<{ required: string[]; bonus: string[] }>) {
  const scored = tools
    .map((tool) => {
      const score = Math.max(
        ...variants.map((variant) => scoreTool(tool, variant.required, variant.bonus)),
      );

      return { tool, score };
    })
    .filter((item) => item.score >= 0)
    .sort((left, right) => right.score - left.score);

  return scored[0]?.tool ?? null;
}

function buildArgumentsFromSchema(
  tool: McpTool,
  values: {
    sourceKind: string;
    sourceLabel: string;
    brief: string;
    followUp: string;
    chatId?: string;
    chatUrl?: string;
  },
) {
  const properties = tool.inputSchema?.properties ?? {};
  const args: Record<string, unknown> = {};

  for (const key of Object.keys(properties)) {
    const normalized = key.toLowerCase();

    if (normalized.includes("chat") && normalized.endsWith("id") && values.chatId) {
      args[key] = values.chatId;
      continue;
    }

    if (
      normalized === "message" ||
      normalized === "prompt" ||
      normalized === "input" ||
      normalized === "text" ||
      normalized === "content" ||
      normalized === "request"
    ) {
      args[key] = values.brief;
      continue;
    }

    if (normalized.includes("follow") || normalized.includes("refine")) {
      args[key] = values.followUp;
      continue;
    }

    if (normalized === "title" || normalized === "name" || normalized === "subject") {
      args[key] = `Origami: ${values.sourceLabel}`;
      continue;
    }

    if (normalized === "description" || normalized === "context") {
      args[key] = `Source kind: ${values.sourceKind}\nSource label: ${values.sourceLabel}`;
      continue;
    }

    if (normalized === "url" && values.chatUrl) {
      args[key] = values.chatUrl;
      continue;
    }
  }

  return args;
}

function readTextContent(result: McpToolResult) {
  return (result.content ?? [])
    .filter((item): item is { type: "text"; text: string } => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function extractSession(result: McpToolResult) {
  const structured = result.structuredContent ?? {};
  const text = readTextContent(result);
  const urlMatch = text.match(/https?:\/\/[^\s)]+/);

  const possibleChatUrl =
    (structured.chatUrl as string | undefined) ??
    (structured.url as string | undefined) ??
    (structured.link as string | undefined) ??
    urlMatch?.[0];

  const possibleChatId =
    (structured.chatId as string | undefined) ??
    (structured.id as string | undefined) ??
    (possibleChatUrl ? possibleChatUrl.split("/").filter(Boolean).pop() : undefined);

  if (!possibleChatId || !possibleChatUrl) {
    return null;
  }

  return {
    chatId: possibleChatId,
    chatUrl: possibleChatUrl,
  };
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.V0_API_KEY) {
    return NextResponse.json(
      {
        error:
          "V0_API_KEY is missing. Add it to create a Continue in v0 MCP session.",
      },
      { status: 400 },
    );
  }

  const payload = requestSchema.parse(await request.json());
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.v0.dev"), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.V0_API_KEY}`,
      },
    },
  });
  const client = new Client({
    name: "origami-v0-handoff",
    version: "0.1.0",
  });

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    const initTool = pickBestTool(tools as McpTool[], [
      { required: ["chat"], bonus: ["init", "create", "start", "new"] },
      { required: ["session"], bonus: ["chat", "create", "start"] },
      { required: ["v0"], bonus: ["chat", "create", "start"] },
    ]);

    if (!initTool) {
      return NextResponse.json(
        { error: "The v0 MCP server did not expose a recognizable chat initialization tool." },
        { status: 502 },
      );
    }

    const initArgs = buildArgumentsFromSchema(initTool, {
      sourceKind: payload.sourceKind,
      sourceLabel: payload.sourceLabel,
      brief: payload.brief,
      followUp: payload.followUp ?? DEFAULT_FOLLOW_UP,
    });
    const initResult = (await client.callTool({
      name: initTool.name,
      arguments: initArgs,
    })) as McpToolResult;

    const session = extractSession(initResult);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "The v0 MCP server responded, but Origami could not extract a chat link from the result.",
        },
        { status: 502 },
      );
    }

    const followUpTool = pickBestTool(
      (tools as McpTool[]).filter((tool) => tool.name !== initTool.name),
      [
        { required: ["chat"], bonus: ["message", "append", "continue", "follow"] },
        { required: ["message"], bonus: ["chat", "send", "append"] },
      ],
    );

    let followUpSent = false;

    if (followUpTool) {
      try {
        const followUpArgs = buildArgumentsFromSchema(followUpTool, {
          sourceKind: payload.sourceKind,
          sourceLabel: payload.sourceLabel,
          brief: payload.followUp ?? DEFAULT_FOLLOW_UP,
          followUp: payload.followUp ?? DEFAULT_FOLLOW_UP,
          chatId: session.chatId,
          chatUrl: session.chatUrl,
        });

        await client.callTool({
          name: followUpTool.name,
          arguments: followUpArgs,
        });
        followUpSent = true;
      } catch {
        followUpSent = false;
      }
    }

    return NextResponse.json({
      chatId: session.chatId,
      chatUrl: session.chatUrl,
      toolName: initTool.name,
      followUpSent,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create a v0 MCP session.";

    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore transport cleanup errors.
    }
  }
}
