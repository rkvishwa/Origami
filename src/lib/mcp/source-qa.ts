import { createMCPClient } from "@ai-sdk/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

import type {
  SourceQaPdfSectionSnapshot,
  SourceQaPdfSnapshot,
  SourceQaRepoSnapshot,
  SourceQaSnapshot,
} from "@/lib/types";

const REQUEST_LOCAL_MCP_URL = "http://origami.local/source-qa-mcp";
const SEARCH_RESULT_LIMIT = 8;
const READ_SNIPPET_LIMIT = 2600;
const SEARCH_SNIPPET_LIMIT = 220;

const sourceQaTextSnapshotSchema = z.object({
  kind: z.literal("text"),
  label: z.string().min(1),
  sourceUrl: z.string().optional(),
  item: z.object({
    id: z.literal("source"),
    label: z.string().min(1),
    content: z.string(),
    contentTruncated: z.boolean(),
  }),
});

const sourceQaFileSnapshotSchema = z.object({
  kind: z.literal("file"),
  label: z.string().min(1),
  sourceUrl: z.string().optional(),
  item: z.object({
    id: z.literal("source"),
    label: z.string().min(1),
    content: z.string(),
    contentTruncated: z.boolean(),
  }),
});

const sourceQaPdfSnapshotSchema = z.object({
  kind: z.literal("pdf"),
  label: z.string().min(1),
  fileName: z.string().min(1),
  pageCount: z.number().int().nonnegative(),
  parseStatus: z.enum(["ready", "unsupported"]),
  fullText: z.string(),
  fullTextTruncated: z.boolean(),
  sections: z.array(
    z.object({
      id: z.string().min(1),
      heading: z.string().min(1),
      summary: z.string(),
      excerpt: z.string(),
      pageStart: z.number().int().positive(),
      pageEnd: z.number().int().positive(),
    }),
  ),
});

const sourceQaRepoSnapshotSchema = z.object({
  kind: z.literal("repo"),
  label: z.string().min(1),
  repo: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    branch: z.string().min(1),
    sourceUrl: z.string().min(1),
  }),
  overviewFiles: z.array(z.string().min(1)),
  selectedTabId: z.string().min(1),
  totalMatchedFiles: z.number().int().nonnegative(),
  truncated: z.boolean(),
  tabs: z.array(
    z.object({
      id: z.string().min(1),
      path: z.string().min(1),
      title: z.string().min(1),
      kind: z.enum(["markdown", "manifest"]),
      manifestType: z
        .enum([
          "package-json",
          "pnpm-workspace",
          "turbo-json",
          "tsconfig-json",
          "other-manifest",
        ])
        .optional(),
      fetched: z.boolean(),
      includedInOverview: z.boolean(),
      content: z.string().optional(),
      contentTruncated: z.boolean(),
    }),
  ),
});

export const sourceQaSnapshotSchema = z.union([
  sourceQaTextSnapshotSchema,
  sourceQaFileSnapshotSchema,
  sourceQaPdfSnapshotSchema,
  sourceQaRepoSnapshotSchema,
]);

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function makeSnippet(text: string, index: number, maxLength = SEARCH_SNIPPET_LIMIT) {
  const normalized = collapseWhitespace(text);

  if (!normalized) {
    return "[No excerpt available]";
  }

  const safeIndex = Math.max(0, Math.min(index, normalized.length));
  const halfWindow = Math.floor(maxLength / 2);
  const start = Math.max(0, safeIndex - halfWindow);
  const end = Math.min(normalized.length, start + maxLength);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";

  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function findCaseInsensitive(haystack: string, needle: string, fromIndex = 0) {
  return haystack.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase(), fromIndex);
}

function buildTextSourceItemList(snapshot: Extract<SourceQaSnapshot, { kind: "text" | "file" }>) {
  return [
    `Source type: ${snapshot.kind}`,
    `Source label: ${snapshot.label}`,
    `Item ID: ${snapshot.item.id}`,
    snapshot.sourceUrl ? `Source URL: ${snapshot.sourceUrl}` : null,
    snapshot.item.contentTruncated ? "Note: the stored source content was truncated." : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPdfSourceItemList(snapshot: SourceQaPdfSnapshot) {
  const lines = [
    `Document: ${snapshot.fileName}`,
    `Page count: ${snapshot.pageCount}`,
    `Parse status: ${snapshot.parseStatus}`,
    snapshot.fullTextTruncated ? "Note: the stored PDF text was truncated." : null,
    "",
    "Sections:",
  ].filter(Boolean) as string[];

  for (const section of snapshot.sections) {
    lines.push(
      `- ${section.id}: ${section.heading} (pages ${section.pageStart}-${section.pageEnd})`,
    );
  }

  return lines.join("\n");
}

function buildRepoSourceItemList(snapshot: SourceQaRepoSnapshot) {
  const lines = [
    `Repository: ${snapshot.repo.owner}/${snapshot.repo.repo}`,
    `Branch: ${snapshot.repo.branch}`,
    `Selected tab id: ${snapshot.selectedTabId}`,
    snapshot.truncated
      ? `Included ${snapshot.tabs.length} high-priority files from ${snapshot.totalMatchedFiles} matches.`
      : `Included all ${snapshot.totalMatchedFiles} matched files.`,
    "",
    "Files:",
  ];

  for (const tab of snapshot.tabs) {
    lines.push(
      [
        `- ${tab.id}`,
        `  Path: ${tab.path}`,
        `  Title: ${tab.title}`,
        `  Kind: ${tab.kind}${tab.manifestType ? ` (${tab.manifestType})` : ""}`,
        `  Overview file: ${tab.includedInOverview ? "yes" : "no"}`,
        `  Content available: ${tab.content ? "yes" : "no"}`,
        tab.contentTruncated ? "  Note: stored file content was truncated." : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return lines.join("\n");
}

function formatListSourceItems(snapshot: SourceQaSnapshot) {
  if (snapshot.kind === "repo") {
    return buildRepoSourceItemList(snapshot);
  }

  if (snapshot.kind === "pdf") {
    return buildPdfSourceItemList(snapshot);
  }

  return buildTextSourceItemList(snapshot);
}

function formatSearchResults(
  query: string,
  results: Array<{
    itemId: string;
    label: string;
    snippet: string;
    details?: string;
  }>,
) {
  if (results.length === 0) {
    return `No matches found for "${query}".`;
  }

  return [
    `Found ${results.length} match${results.length === 1 ? "" : "es"} for "${query}":`,
    "",
    ...results.map((result, index) =>
      [
        `[${index + 1}] ${result.label}`,
        `Item ID: ${result.itemId}`,
        result.details,
        `Snippet: ${result.snippet}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n");
}

function buildFocusedExcerpt(text: string, focus?: string, maxLength = READ_SNIPPET_LIMIT) {
  const normalized = text.trim();

  if (!normalized) {
    return "[No content available]";
  }

  if (!focus?.trim()) {
    const suffix = normalized.length > maxLength ? "\n\n[Excerpt truncated]" : "";
    return `${normalized.slice(0, maxLength)}${suffix}`;
  }

  const matchIndex = findCaseInsensitive(normalized, focus.trim());
  if (matchIndex === -1) {
    const suffix = normalized.length > maxLength ? "\n\n[Excerpt truncated]" : "";
    return `${normalized.slice(0, maxLength)}${suffix}`;
  }

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const end = Math.min(normalized.length, start + maxLength);
  const prefix = start > 0 ? "...\n" : "";
  const suffix = end < normalized.length ? "\n..." : "";

  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function searchTextSnapshot(
  snapshot: Extract<SourceQaSnapshot, { kind: "text" | "file" }>,
  query: string,
) {
  const metadata = `${snapshot.label}\n${snapshot.sourceUrl ?? ""}`.trim();
  const metadataIndex = findCaseInsensitive(metadata, query);
  const contentIndex = findCaseInsensitive(snapshot.item.content, query);

  if (metadataIndex === -1 && contentIndex === -1) {
    return [];
  }

  return [
    {
      itemId: snapshot.item.id,
      label: snapshot.label,
      details: `Source type: ${snapshot.kind}`,
      snippet:
        contentIndex >= 0
          ? makeSnippet(snapshot.item.content, contentIndex)
          : makeSnippet(metadata, metadataIndex),
    },
  ];
}

function searchRepoSnapshot(snapshot: SourceQaRepoSnapshot, query: string) {
  const results: Array<{
    itemId: string;
    label: string;
    snippet: string;
    details: string;
    sortIndex: number;
  }> = [];

  for (const tab of snapshot.tabs) {
    const metadata = `${tab.title}\n${tab.path}\n${tab.manifestType ?? ""}`;
    const metadataIndex = findCaseInsensitive(metadata, query);
    const contentIndex = tab.content ? findCaseInsensitive(tab.content, query) : -1;

    if (metadataIndex === -1 && contentIndex === -1) {
      continue;
    }

    results.push({
      itemId: tab.id,
      label: tab.path,
      details: `Title: ${tab.title} • Kind: ${tab.kind}${tab.manifestType ? ` (${tab.manifestType})` : ""}`,
      snippet:
        contentIndex >= 0
          ? makeSnippet(tab.content ?? "", contentIndex)
          : makeSnippet(metadata, metadataIndex),
      sortIndex: contentIndex >= 0 ? contentIndex : metadataIndex,
    });
  }

  return results
    .sort((left, right) => left.sortIndex - right.sortIndex)
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((result) => ({
      itemId: result.itemId,
      label: result.label,
      snippet: result.snippet,
      details: result.details,
    }));
}

function findPdfSectionAnchor(fullText: string, section: SourceQaPdfSectionSnapshot) {
  const candidates = [section.excerpt, section.heading, section.summary]
    .map((value) => collapseWhitespace(value).slice(0, 120))
    .filter(Boolean);

  for (const candidate of candidates) {
    const index = findCaseInsensitive(fullText, candidate);
    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

function buildPdfSectionAnchors(snapshot: SourceQaPdfSnapshot) {
  const anchors = snapshot.sections.map((section, index) => ({
    section,
    index,
    start: findPdfSectionAnchor(snapshot.fullText, section),
  }));

  return anchors.map((anchor, index) => {
    const nextAnchor = anchors
      .slice(index + 1)
      .find((candidate) => candidate.start > anchor.start);

    return {
      ...anchor,
      start: anchor.start >= 0 ? anchor.start : index === 0 ? 0 : anchors[index - 1].start + 1,
      end: nextAnchor?.start ?? snapshot.fullText.length,
    };
  });
}

function searchPdfSnapshot(snapshot: SourceQaPdfSnapshot, query: string) {
  const sectionResults: Array<{
    itemId: string;
    label: string;
    snippet: string;
    details: string;
  }> = [];

  for (const section of snapshot.sections) {
    const combined = [
      section.heading,
      section.summary,
      section.excerpt,
      `pages ${section.pageStart}-${section.pageEnd}`,
    ].join("\n");
    const matchIndex = findCaseInsensitive(combined, query);

    if (matchIndex === -1) {
      continue;
    }

    sectionResults.push({
      itemId: section.id,
      label: `${section.heading} (pages ${section.pageStart}-${section.pageEnd})`,
      details: `Section ID: ${section.id}`,
      snippet: makeSnippet(combined, matchIndex),
    });
  }

  if (sectionResults.length > 0) {
    return sectionResults.slice(0, SEARCH_RESULT_LIMIT);
  }

  const anchors = buildPdfSectionAnchors(snapshot);
  const fullTextResults: Array<{
    itemId: string;
    label: string;
    snippet: string;
    details: string;
  }> = [];
  const seenItemIds = new Set<string>();
  let searchFrom = 0;

  while (fullTextResults.length < SEARCH_RESULT_LIMIT) {
    const matchIndex = findCaseInsensitive(snapshot.fullText, query, searchFrom);
    if (matchIndex === -1) {
      break;
    }

    let sectionAnchor = anchors[0];

    for (const anchor of anchors) {
      if (anchor.start <= matchIndex) {
        sectionAnchor = anchor;
      } else {
        break;
      }
    }

    const section = sectionAnchor?.section;
    const itemId = section?.id ?? "document";

    if (!seenItemIds.has(itemId)) {
      fullTextResults.push({
        itemId,
        label: section
          ? `${section.heading} (pages ${section.pageStart}-${section.pageEnd})`
          : snapshot.fileName,
        details: section ? `Section ID: ${section.id}` : "Document-wide match",
        snippet: makeSnippet(snapshot.fullText, matchIndex),
      });
      seenItemIds.add(itemId);
    }

    searchFrom = matchIndex + query.length;
  }

  return fullTextResults;
}

function formatReadSourceItem(snapshot: SourceQaSnapshot, itemId: string, focus?: string) {
  if (snapshot.kind === "repo") {
    const tab =
      snapshot.tabs.find((candidate) => candidate.id === itemId) ??
      snapshot.tabs.find((candidate) => candidate.path === itemId);

    if (!tab) {
      return `No repository file found for item id "${itemId}".`;
    }

    if (!tab.content?.trim()) {
      return [
        `Path: ${tab.path}`,
        `Title: ${tab.title}`,
        "",
        "No stored file content is available for this tab.",
      ].join("\n");
    }

    return [
      `Path: ${tab.path}`,
      `Title: ${tab.title}`,
      `Kind: ${tab.kind}${tab.manifestType ? ` (${tab.manifestType})` : ""}`,
      tab.contentTruncated ? "Note: the stored file content was truncated." : null,
      "",
      buildFocusedExcerpt(tab.content, focus),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (snapshot.kind === "pdf") {
    const section = snapshot.sections.find((candidate) => candidate.id === itemId);

    if (!section) {
      return `No PDF section found for item id "${itemId}".`;
    }

    const anchors = buildPdfSectionAnchors(snapshot);
    const anchor = anchors.find((candidate) => candidate.section.id === itemId);
    const sectionText =
      anchor && snapshot.fullText.trim()
        ? snapshot.fullText.slice(anchor.start, Math.max(anchor.start, anchor.end)).trim()
        : [section.summary, section.excerpt].filter(Boolean).join("\n\n");

    return [
      `Section: ${section.heading}`,
      `Pages: ${section.pageStart}-${section.pageEnd}`,
      snapshot.fullTextTruncated ? "Note: the stored PDF text was truncated." : null,
      "",
      buildFocusedExcerpt(sectionText, focus),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (itemId !== snapshot.item.id) {
    return `No source item found for item id "${itemId}".`;
  }

  return [
    `Source: ${snapshot.label}`,
    `Type: ${snapshot.kind}`,
    snapshot.item.contentTruncated ? "Note: the stored source content was truncated." : null,
    "",
    buildFocusedExcerpt(snapshot.item.content, focus),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatSearchSource(snapshot: SourceQaSnapshot, query: string, maxResults?: number) {
  const limit = Math.min(Math.max(maxResults ?? 5, 1), SEARCH_RESULT_LIMIT);

  if (snapshot.kind === "repo") {
    return formatSearchResults(query, searchRepoSnapshot(snapshot, query).slice(0, limit));
  }

  if (snapshot.kind === "pdf") {
    return formatSearchResults(query, searchPdfSnapshot(snapshot, query).slice(0, limit));
  }

  return formatSearchResults(query, searchTextSnapshot(snapshot, query).slice(0, limit));
}

function toTextToolResult(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

function createSourceQaMcpServer(snapshot: SourceQaSnapshot) {
  const server = new McpServer({
    name: "origami-source-qa-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "list_source_items",
    {
      title: "List source items",
      description:
        "List the available source items you can inspect, such as repository files, PDF sections, or the single text source.",
    },
    async () => toTextToolResult(formatListSourceItems(snapshot)),
  );

  server.registerTool(
    "search_source",
    {
      title: "Search source",
      description:
        "Search the active source for a keyword or phrase and return grounded snippets from matching files or sections.",
      inputSchema: {
        query: z.string().min(1).describe("Keyword or phrase to search for in the source."),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(SEARCH_RESULT_LIMIT)
          .optional()
          .describe("Optional maximum number of matches to return."),
      },
    },
    async ({ query, maxResults }) =>
      toTextToolResult(formatSearchSource(snapshot, query, maxResults)),
  );

  server.registerTool(
    "read_source_item",
    {
      title: "Read source item",
      description:
        "Read a longer excerpt from one repository file, PDF section, or the single text source.",
      inputSchema: {
        itemId: z
          .string()
          .min(1)
          .describe("The item id returned by list_source_items or search_source."),
        focus: z
          .string()
          .optional()
          .describe("Optional phrase to center the returned excerpt around."),
      },
    },
    async ({ itemId, focus }) =>
      toTextToolResult(formatReadSourceItem(snapshot, itemId, focus)),
  );

  return server;
}

async function buildLocalMcpResponse(snapshot: SourceQaSnapshot, request: Request) {
  if (request.method === "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (request.method === "DELETE") {
    return new Response(null, { status: 204 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  const server = createSourceQaMcpServer(snapshot);

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const body = await response.arrayBuffer();

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    await server.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }
}

function createRequestLocalFetch(snapshot: SourceQaSnapshot) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);

    return buildLocalMcpResponse(snapshot, request);
  };
}

export async function createSourceQaMcpClient(snapshot: SourceQaSnapshot) {
  return createMCPClient({
    name: "origami-source-qa-client",
    transport: {
      type: "http",
      url: REQUEST_LOCAL_MCP_URL,
      fetch: createRequestLocalFetch(snapshot),
    },
  });
}
