import type {
  PdfInsightMetric,
  PdfInsightOutput,
  PdfSection,
  PdfSourceDocument,
} from "@/lib/types";

const PDF_TEXT_LIMIT = 22000;
const PDF_SECTION_EXCERPT_LIMIT = 260;

function normalizeWhitespace(text: string) {
  return text.replace(/\u0000/g, "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

function truncateText(text: string, limit = PDF_TEXT_LIMIT) {
  const normalized = normalizeWhitespace(text);

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}\n\n[PDF text truncated for this pass.]`;
}

function summarizeExcerpt(text: string, limit = PDF_SECTION_EXCERPT_LIMIT) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return "";
  }

  const sentenceMatch = normalized.match(/^.{0,220}?[.!?](?:\s|$)/);
  const excerpt = sentenceMatch?.[0] ?? normalized.slice(0, limit);

  return excerpt.length <= limit ? excerpt : `${excerpt.slice(0, limit - 1)}…`;
}

function looksLikeHeading(line: string) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.length < 4 || trimmed.length > 90) {
    return false;
  }

  if (/^#{1,6}\s+/.test(trimmed)) {
    return true;
  }

  if (/^\d+(\.\d+)*[\s:-]+[A-Za-z]/.test(trimmed)) {
    return true;
  }

  if (/^[A-Z0-9][A-Z0-9\s/&-]{3,}$/.test(trimmed) && trimmed.split(/\s+/).length <= 10) {
    return true;
  }

  if (/[.:]$/.test(trimmed)) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  const titleCaseWords = words.filter((word) => /^[A-Z][a-z0-9/-]+$/.test(word)).length;

  return words.length <= 8 && titleCaseWords >= Math.max(2, Math.ceil(words.length * 0.6));
}

function finalizeSection(
  sections: PdfSection[],
  heading: string,
  lines: string[],
  pageStart: number,
  pageEnd: number,
) {
  const body = normalizeWhitespace(lines.join("\n"));

  if (!body) {
    return;
  }

  sections.push({
    id: `section-${sections.length + 1}`,
    heading,
    summary: summarizeExcerpt(body, 180),
    pageStart,
    pageEnd,
    excerpt: summarizeExcerpt(body),
  });
}

function buildFallbackSections(pages: string[]) {
  const sections: PdfSection[] = [];

  pages.forEach((pageText, pageIndex) => {
    const paragraphs = normalizeWhitespace(pageText)
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      return;
    }

    const combined = paragraphs.slice(0, 3).join("\n\n");
    sections.push({
      id: `section-${sections.length + 1}`,
      heading: paragraphs[0].split("\n")[0]?.slice(0, 50) || `Page ${pageIndex + 1}`,
      summary: summarizeExcerpt(combined, 180),
      pageStart: pageIndex + 1,
      pageEnd: pageIndex + 1,
      excerpt: summarizeExcerpt(combined),
    });
  });

  return sections.slice(0, 6);
}

export function hasUsablePdfText(pages: string[]) {
  const total = normalizeWhitespace(pages.join("\n")).length;
  return total >= 80;
}

export function extractPdfSections(pages: string[]) {
  const sections: PdfSection[] = [];

  let currentHeading = "Opening overview";
  let currentLines: string[] = [];
  let sectionStartPage = 1;
  let lastPage = 1;

  pages.forEach((pageText, pageIndex) => {
    const pageNumber = pageIndex + 1;
    const lines = normalizeWhitespace(pageText)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return;
    }

    for (const line of lines) {
      if (looksLikeHeading(line) && currentLines.length > 0) {
        finalizeSection(sections, currentHeading, currentLines, sectionStartPage, lastPage);
        currentHeading = line.replace(/^#{1,6}\s+/, "");
        currentLines = [];
        sectionStartPage = pageNumber;
      } else if (looksLikeHeading(line) && currentLines.length === 0) {
        currentHeading = line.replace(/^#{1,6}\s+/, "");
        sectionStartPage = pageNumber;
      } else {
        currentLines.push(line);
      }
    }

    lastPage = pageNumber;
  });

  finalizeSection(sections, currentHeading, currentLines, sectionStartPage, lastPage);

  if (sections.length < 2) {
    return buildFallbackSections(pages);
  }

  return sections.slice(0, 8);
}

export function createPdfSourceDocument({
  fileName,
  pages,
  fetchedAt = new Date().toISOString(),
}: {
  fileName: string;
  pages: string[];
  fetchedAt?: string;
}): PdfSourceDocument {
  const joinedText = truncateText(pages.join("\n\n--- Page Break ---\n\n"));
  const sections = extractPdfSections(pages);

  return {
    kind: "pdf",
    label: fileName,
    fileName,
    text: joinedText,
    fetchedAt,
    uploadedAt: fetchedAt,
    pageCount: pages.length,
    sections,
    parseStatus: hasUsablePdfText(pages) ? "ready" : "unsupported",
  };
}

export function extractPdfNotableMetrics(text: string): PdfInsightMetric[] {
  const matches = Array.from(
    text.matchAll(
      /(\$[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b|\b\d+\s+(?:days|months|years|pages|users|items)\b)/gi,
    ),
  );

  const unique = new Set<string>();
  const metrics: PdfInsightMetric[] = [];

  for (const match of matches) {
    const value = match[0];
    if (unique.has(value)) {
      continue;
    }

    unique.add(value);
    const start = Math.max(0, (match.index ?? 0) - 60);
    const end = Math.min(text.length, (match.index ?? 0) + value.length + 80);
    const context = normalizeWhitespace(text.slice(start, end));

    metrics.push({
      label: metrics.length === 0 ? "Key figure" : `Figure ${metrics.length + 1}`,
      value,
      context: summarizeExcerpt(context, 140),
    });

    if (metrics.length >= 5) {
      break;
    }
  }

  return metrics;
}

export function buildPdfFallbackInsight(source: PdfSourceDocument): PdfInsightOutput {
  const sectionBreakdown = source.sections.slice(0, 5).map((section) => ({
    heading: section.heading,
    summary: section.summary,
    pageRange:
      section.pageStart === section.pageEnd
        ? `Page ${section.pageStart}`
        : `Pages ${section.pageStart}-${section.pageEnd}`,
  }));

  return {
    title: source.fileName,
    summary:
      sectionBreakdown[0]?.summary ||
      "Extracted the document successfully and organized it into a quick review view.",
    documentType: "Uploaded PDF",
    keyTakeaways: sectionBreakdown
      .slice(0, 4)
      .map((section) => `${section.heading}: ${section.summary}`),
    notableMetrics: extractPdfNotableMetrics(source.text),
    sectionBreakdown,
    recommendedActions: [
      "Review the strongest sections first to confirm the model's interpretation.",
      "Use the interactive pane to turn the extracted rules or structure into a mini-app.",
      "Generate the v0 MVP brief to showcase a UI concept built from this document.",
    ],
  };
}
