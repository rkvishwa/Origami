import type {
  PdfSourceDocument,
  RepoFileDescriptor,
  RepoSourceDocument,
  SourceDocument,
  SourceStats,
} from "@/lib/types";

const SOURCE_CHAR_LIMIT = 18000;
const REPO_FILE_CHAR_LIMIT = 3200;
const SOURCE_BRIEF_CHAR_LIMIT = 12000;

export function getSourceStats(text: string): SourceStats {
  const normalized = text.trim();

  if (!normalized) {
    return {
      lines: 0,
      words: 0,
      characters: 0,
    };
  }

  return {
    lines: normalized.split(/\r?\n/).length,
    words: normalized.split(/\s+/).filter(Boolean).length,
    characters: normalized.length,
  };
}

export function truncateSourceText(text: string, limit = SOURCE_CHAR_LIMIT) {
  const normalized = text.trim();

  if (normalized.length <= limit) {
    return {
      text: normalized,
      truncated: false,
    };
  }

  return {
    text: `${normalized.slice(0, limit)}\n\n[Source truncated for this analysis pass.]`,
    truncated: true,
  };
}

function truncateRepoFileText(text: string, limit = REPO_FILE_CHAR_LIMIT) {
  const normalized = text.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}\n\n[File truncated for overview analysis.]`;
}

export function getSelectedRepoTab(source: RepoSourceDocument) {
  if (source.selectedTabId === "overview") {
    return null;
  }

  return source.tabs.find((tab) => tab.id === source.selectedTabId) ?? null;
}

export function buildRepoOverviewText(source: RepoSourceDocument) {
  return source.overviewFiles
    .map((path) => {
      const content = source.contentCache[path];

      if (!content) {
        return `FILE: ${path}\n[Content unavailable]`;
      }

      return `FILE: ${path}\n${content}`;
    })
    .join("\n\n====================\n\n");
}

function buildRepoOverviewDigest(source: RepoSourceDocument) {
  const includedFiles = source.tabs.map((tab) => `- ${tab.path} (${tab.kind})`).join("\n");
  const overviewFiles = source.overviewFiles
    .map((path) => {
      const content = source.contentCache[path];

      return [
        `FILE START: ${path}`,
        content ? truncateRepoFileText(content) : "[Content unavailable]",
        `FILE END: ${path}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Repository: ${source.repo.owner}/${source.repo.repo}`,
    `Branch: ${source.repo.branch}`,
    `Included file count: ${source.tabs.length}`,
    source.truncated
      ? `Only the highest-priority ${source.tabs.length} files are included from ${source.totalMatchedFiles} matches.`
      : `All matched files are included (${source.totalMatchedFiles}).`,
    "",
    "Included files:",
    includedFiles,
    "",
    "Overview files:",
    overviewFiles,
  ].join("\n");
}

export function buildRepoFileDigest(
  source: RepoSourceDocument,
  tab: RepoFileDescriptor,
  content = source.contentCache[tab.path] ?? "",
) {
  return [
    `Repository: ${source.repo.owner}/${source.repo.repo}`,
    `Branch: ${source.repo.branch}`,
    `Selected file: ${tab.path}`,
    `File kind: ${tab.kind}${tab.manifestType ? ` (${tab.manifestType})` : ""}`,
    `File title: ${tab.title}`,
    "",
    "FILE CONTENT START",
    truncateRepoFileText(content, SOURCE_BRIEF_CHAR_LIMIT),
    "FILE CONTENT END",
  ].join("\n");
}

function buildPdfDigest(source: PdfSourceDocument) {
  const sectionDigest = source.sections
    .slice(0, 8)
    .map(
      (section) =>
        `SECTION: ${section.heading} (pages ${section.pageStart}-${section.pageEnd})\n${section.excerpt}`,
    )
    .join("\n\n");

  return [
    `Document: ${source.fileName}`,
    `Page count: ${source.pageCount}`,
    `Parse status: ${source.parseStatus}`,
    "",
    "Key sections:",
    sectionDigest || "No sections were confidently extracted.",
    "",
    "EXTRACTED TEXT START",
    truncateSourceText(source.text, SOURCE_BRIEF_CHAR_LIMIT).text,
    "EXTRACTED TEXT END",
  ].join("\n");
}

export function createSourceBrief(source: SourceDocument) {
  if (source.kind === "repo") {
    const selectedTab = getSelectedRepoTab(source);

    if (selectedTab) {
      return buildRepoFileDigest(source, selectedTab);
    }

    return buildRepoOverviewDigest(source);
  }

  if (source.kind === "pdf") {
    return buildPdfDigest(source);
  }

  const { text, truncated } = truncateSourceText(source.text, SOURCE_BRIEF_CHAR_LIMIT);

  return [
    `Source kind: ${source.kind}`,
    `Source label: ${source.label}`,
    source.sourceUrl ? `Source URL: ${source.sourceUrl}` : null,
    truncated ? "Note: source content was truncated for this brief." : null,
    "",
    "SOURCE START",
    text,
    "SOURCE END",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createOrigamiMessagePayload(source: SourceDocument) {
  if (source.kind === "repo") {
    const selectedTab = getSelectedRepoTab(source);

    if (selectedTab) {
      const digest = buildRepoFileDigest(source, selectedTab);
      const { text, truncated } = truncateSourceText(digest);

      return [
        "Turn this repository file into the most useful interactive explanation you can.",
        selectedTab.kind === "manifest"
          ? "Prefer buildDocumentInsight unless the manifest strongly suggests another clearer output."
          : "Choose the single best tool for the selected file. For technical docs, buildDocumentInsight with a focusGraph is often the best fit.",
        `Source kind: ${source.kind}`,
        `Source label: ${source.label}`,
        `Source URL: ${source.sourceUrl}`,
        truncated ? "Note: the selected file digest below was truncated." : null,
        "",
        "SELECTED REPOSITORY FILE DIGEST START",
        text,
        "SELECTED REPOSITORY FILE DIGEST END",
      ]
        .filter(Boolean)
        .join("\n");
    }

    const digest = buildRepoOverviewDigest(source);
    const { text, truncated } = truncateSourceText(digest);

    return [
      "Turn this repository digest into an overview-first interactive dashboard.",
      "Use buildArchitectureGraph unless another tool is dramatically more suitable.",
      "Every graph node should include meaningful details, evidence, and related file paths.",
      `Source kind: ${source.kind}`,
      `Source label: ${source.label}`,
      `Source URL: ${source.sourceUrl}`,
      truncated
        ? "Note: the repository digest below was truncated to fit one fast analysis pass."
        : null,
      "",
      "REPOSITORY DIGEST START",
      text,
      "REPOSITORY DIGEST END",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (source.kind === "pdf") {
    const digest = buildPdfDigest(source);
    const { text, truncated } = truncateSourceText(digest);

    return [
      "Turn this extracted PDF into the best interactive experience you can.",
      "Prefer buildDocumentInsight for explanatory docs, buildCalculator for quantitative policies, and buildScenarioSimulator for branching rulebooks.",
      `Source kind: ${source.kind}`,
      `Source label: ${source.label}`,
      `Page count: ${source.pageCount}`,
      truncated ? "Note: the extracted PDF digest below was truncated." : null,
      "",
      "PDF DIGEST START",
      text,
      "PDF DIGEST END",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const { text, truncated } = truncateSourceText(source.text);

  return [
    "Turn this source into the most useful interactive mini-app you can.",
    "Choose the single best visualization tool for the material.",
    `Source kind: ${source.kind}`,
    `Source label: ${source.label}`,
    source.sourceUrl ? `Source URL: ${source.sourceUrl}` : null,
    truncated
      ? "Note: the source below was truncated to fit one fast analysis pass."
      : null,
    "",
    "SOURCE START",
    text,
    "SOURCE END",
  ]
    .filter(Boolean)
    .join("\n");
}
