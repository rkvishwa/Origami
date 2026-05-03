import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

import { getOrigamiModel } from "@/lib/model";
import { buildPdfFallbackInsight, createPdfSourceDocument } from "@/lib/pdf";
import { PDF_INSIGHT_SYSTEM_PROMPT } from "@/lib/prompts";
import { pdfInsightOutputSchema } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF uploads are supported here." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: false });
    const fetchedAt = new Date().toISOString();
    const pages = extracted.text.map((page) => page.trim()).filter(Boolean);
    const source = createPdfSourceDocument({
      fileName: file.name,
      pages,
      fetchedAt,
    });

    if (source.parseStatus === "unsupported" || !source.text.trim()) {
      return NextResponse.json(
        {
          error:
            "This PDF does not appear to contain a usable text layer yet. Scanned or image-only PDFs are out of scope for this MVP.",
        },
        { status: 400 },
      );
    }

    let insight = buildPdfFallbackInsight(source);

    try {
      const { object } = await generateObject({
        model: getOrigamiModel(),
        system: PDF_INSIGHT_SYSTEM_PROMPT,
        schema: pdfInsightOutputSchema,
        prompt: [
          `File name: ${file.name}`,
          `Page count: ${extracted.totalPages}`,
          "",
          "Extracted sections:",
          source.sections.length > 0
            ? source.sections
                .map(
                  (section) =>
                    `- ${section.heading} (pages ${section.pageStart}-${section.pageEnd}): ${section.summary}`,
                )
                .join("\n")
            : "- No confident sections detected",
          "",
          "PDF TEXT START",
          source.text,
          "PDF TEXT END",
        ].join("\n"),
      });

      insight = object;
    } catch {
      // Fall back to a deterministic summary if the model is unavailable.
    }

    return NextResponse.json({ source, insight });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to extract text from the PDF.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
