import { tool } from "ai";
import { z } from "zod";

const graphEvidenceSchema = z.object({
  path: z.string().min(1),
  excerpt: z.string().max(240),
  reason: z.string().min(1),
});

const architectureNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["entry", "ui", "service", "data", "external"]),
  description: z.string(),
  details: z.string().min(1),
  evidence: z.array(graphEvidenceSchema).max(4),
  relatedNodeIds: z.array(z.string().min(1)).max(6),
  recommendedPaths: z.array(z.string().min(1)).max(4),
  layer: z.number().int().min(0).max(5),
});

const architectureEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string(),
});

export const architectureGraphOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(2).max(5),
  defaultSelectedNodeId: z.string(),
  nodes: z.array(architectureNodeSchema).min(4).max(8),
  edges: z.array(architectureEdgeSchema).min(3).max(10),
});

const relatedFileSchema = z.object({
  path: z.string().min(1),
  reason: z.string().min(1),
});

export const documentInsightOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sourceType: z.enum(["guide", "setup", "architecture", "policy", "reference"]),
  takeawayBullets: z.array(z.string().min(1)).min(2).max(5),
  recommendedActions: z.array(z.string().min(1)).min(1).max(4),
  relatedFiles: z.array(relatedFileSchema).max(5),
  focusGraph: architectureGraphOutputSchema.nullable(),
});

const pdfInsightMetricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  context: z.string().min(1),
});

const pdfInsightSectionSchema = z.object({
  heading: z.string().min(1),
  summary: z.string().min(1),
  pageRange: z.string().min(1),
});

export const pdfInsightOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  documentType: z.string().min(1),
  keyTakeaways: z.array(z.string().min(1)).min(2).max(5),
  notableMetrics: z.array(pdfInsightMetricSchema).max(6),
  sectionBreakdown: z.array(pdfInsightSectionSchema).min(2).max(6),
  recommendedActions: z.array(z.string().min(1)).min(1).max(5),
});

const miniAppPreviewScreenSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1),
  keyElements: z.array(z.string().min(1)).min(2).max(5),
});

const miniAppPreviewEntitySchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
});

export const miniAppPreviewSchema = z.object({
  appTitle: z.string().min(1),
  pitch: z.string().min(1),
  targetUser: z.string().min(1),
  appType: z.string().min(1),
  designDirection: z.string().min(1),
  screenCards: z.array(miniAppPreviewScreenSchema).min(3).max(5),
  primaryUserFlow: z.array(z.string().min(1)).min(3).max(6),
  componentPalette: z.array(z.string().min(1)).min(4).max(8),
  keyEntities: z.array(miniAppPreviewEntitySchema).min(2).max(6),
  launchChecklist: z.array(z.string().min(1)).min(3).max(6),
  constraints: z.array(z.string().min(1)).min(2).max(5),
});

const calculatorParameterSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  defaultValue: z.number(),
  unit: z.string().optional(),
  multiplier: z.number(),
});

const scenarioOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  impact: z.string().min(1),
  scoreDelta: z.number().int().min(-2).max(3),
  tone: z.enum(["positive", "neutral", "warning"]),
});

const scenarioStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  question: z.string().min(1),
  guidance: z.string().optional(),
  options: z.array(scenarioOptionSchema).min(2).max(3),
});

const scenarioEndingSchema = z.object({
  label: z.string().min(1),
  minScore: z.number().int().min(0),
  description: z.string().min(1),
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeParameter(parameter: z.infer<typeof calculatorParameterSchema>) {
  const min = Math.min(parameter.min, parameter.max);
  const max = Math.max(parameter.min, parameter.max);
  const defaultValue = clamp(parameter.defaultValue, min, max);

  return {
    ...parameter,
    min,
    max,
    defaultValue,
    step: parameter.step > max - min && max > min ? Math.max((max - min) / 4, 1) : parameter.step,
  };
}

function calculateWeightedOutput(
  baseValue: number,
  parameters: Array<ReturnType<typeof normalizeParameter>>,
  values: Record<string, number>,
  decimals: number,
) {
  const raw = parameters.reduce((total, parameter) => {
    const denominator = Math.max(parameter.max - parameter.min, parameter.step, 1);
    const normalized = (values[parameter.id] - parameter.min) / denominator;

    return total + normalized * parameter.multiplier;
  }, baseValue);

  return Number(raw.toFixed(decimals));
}

function buildCalculatorSeries(
  baseValue: number,
  parameters: Array<ReturnType<typeof normalizeParameter>>,
  primaryParameterId: string,
  decimals: number,
) {
  const primaryParameter =
    parameters.find((parameter) => parameter.id === primaryParameterId) ?? parameters[0];

  const defaultValues = Object.fromEntries(
    parameters.map((parameter) => [parameter.id, parameter.defaultValue]),
  );

  const series: Array<{ label: string; value: number; [key: string]: number | string }> = [];
  const steps = Math.min(
    10,
    Math.max(4, Math.round((primaryParameter.max - primaryParameter.min) / primaryParameter.step)),
  );

  for (let index = 0; index <= steps; index += 1) {
    const ratio = steps === 0 ? 0 : index / steps;
    const currentValue =
      primaryParameter.min + (primaryParameter.max - primaryParameter.min) * ratio;

    const nextValues = {
      ...defaultValues,
      [primaryParameter.id]: Number(currentValue.toFixed(decimals > 0 ? decimals : 2)),
    };

    series.push({
      label: `${nextValues[primaryParameter.id]}${primaryParameter.unit ?? ""}`,
      value: calculateWeightedOutput(baseValue, parameters, nextValues, decimals),
      [primaryParameter.id]: nextValues[primaryParameter.id],
    });
  }

  return series;
}

export function normalizeArchitectureGraph(
  graph: z.infer<typeof architectureGraphOutputSchema>,
) {
  const layerBuckets = new Map<number, Array<z.infer<typeof architectureNodeSchema>>>();

  for (const node of graph.nodes) {
    const bucket = layerBuckets.get(node.layer) ?? [];
    bucket.push(node);
    layerBuckets.set(node.layer, bucket);
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const nodes = graph.nodes.map((node) => {
    const layerNodes = layerBuckets.get(node.layer) ?? [];
    const index = layerNodes.findIndex((layerNode) => layerNode.id === node.id);

    return {
      ...node,
      description: node.description.trim() || undefined,
      evidence: node.evidence.slice(0, 4).map((item) => ({
        ...item,
        excerpt: item.excerpt.trim() || undefined,
      })),
      relatedNodeIds: node.relatedNodeIds.filter((relatedNodeId) => nodeIds.has(relatedNodeId)),
      recommendedPaths: node.recommendedPaths.slice(0, 4),
      position: {
        x: node.layer * 320,
        y: index * 150,
      },
    };
  });

  return {
    ...graph,
    defaultSelectedNodeId:
      graph.defaultSelectedNodeId && nodeIds.has(graph.defaultSelectedNodeId)
        ? graph.defaultSelectedNodeId
        : nodes[0]?.id,
    nodes,
    edges: graph.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge, index) => ({
        ...edge,
        id: `${edge.source}-${edge.target}-${index}`,
        label: edge.label.trim() || undefined,
      })),
  };
}

export function normalizeDocumentInsightOutput(
  insight: z.infer<typeof documentInsightOutputSchema>,
) {
  return {
    ...insight,
    focusGraph: insight.focusGraph
      ? normalizeArchitectureGraph(insight.focusGraph)
      : undefined,
  };
}

export const origamiTools = {
  buildArchitectureGraph: tool({
    description:
      "Use this when the source describes a technical architecture, product system, repository structure, API flow, or platform workflow. Return a concise architecture graph config with evidence and explanations.",
    inputSchema: architectureGraphOutputSchema,
    execute: async (input) => normalizeArchitectureGraph(input),
  }),
  buildDocumentInsight: tool({
    description:
      "Use this for prose-heavy docs, setup guides, policies, references, or markdown files that need a readable multi-card dashboard. Optionally include a small focus graph for technical docs.",
    inputSchema: documentInsightOutputSchema,
    execute: async (input) => normalizeDocumentInsightOutput(input),
  }),
  buildCalculator: tool({
    description:
      "Use this when the source contains formulas, pricing, penalties, fees, mathematical rules, or scoring logic. Return a compact slider-based calculator config.",
    inputSchema: z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      baseValue: z.number(),
      outputLabel: z.string().min(1),
      outputUnit: z.string().optional(),
      decimals: z.number().int().min(0).max(2).default(0),
      formulaLabel: z.string().min(1),
      highlights: z.array(z.string().min(1)).min(2).max(4),
      parameters: z.array(calculatorParameterSchema).min(1).max(3),
      primaryParameterId: z.string().min(1).optional(),
    }),
    execute: async ({
      baseValue,
      decimals,
      parameters,
      primaryParameterId,
      ...rest
    }) => {
      const normalizedParameters = parameters.map(normalizeParameter);
      const resolvedPrimaryParameterId =
        normalizedParameters.find((parameter) => parameter.id === primaryParameterId)?.id ??
        normalizedParameters[0].id;

      const defaultValues = Object.fromEntries(
        normalizedParameters.map((parameter) => [parameter.id, parameter.defaultValue]),
      );

      return {
        ...rest,
        baseValue,
        decimals,
        parameters: normalizedParameters,
        primaryParameterId: resolvedPrimaryParameterId,
        defaultOutput: calculateWeightedOutput(
          baseValue,
          normalizedParameters,
          defaultValues,
          decimals,
        ),
        series: buildCalculatorSeries(
          baseValue,
          normalizedParameters,
          resolvedPrimaryParameterId,
          decimals,
        ),
      };
    },
  }),
  buildScenarioSimulator: tool({
    description:
      "Use this when the source contains branching decisions, playbooks, manuals, or if/then rules. Return a guided multi-step simulator config.",
    inputSchema: z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      takeawayBullets: z.array(z.string().min(1)).min(2).max(4),
      steps: z.array(scenarioStepSchema).min(4).max(7),
      endings: z.array(scenarioEndingSchema).min(2).max(4),
    }),
    execute: async ({ steps, endings, ...rest }) => {
      const maxScore = steps.reduce((total, step) => {
        const largestDelta = Math.max(...step.options.map((option) => option.scoreDelta));
        return total + Math.max(largestDelta, 0);
      }, 0);

      return {
        ...rest,
        steps,
        maxScore,
        endings: [...endings].sort((left, right) => left.minScore - right.minScore),
      };
    },
  }),
};
