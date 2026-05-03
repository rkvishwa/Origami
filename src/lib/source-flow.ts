import { z } from "zod";

const sourceFlowReferenceSchema = z.object({
  kind: z.enum(["repo-path", "pdf-section", "source"]),
  label: z.string().min(1),
  detail: z.string().min(1),
});

const sourceFlowNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["root", "section", "insight", "decision", "action"]),
  summary: z.string().min(1).max(220),
  details: z.string().min(1),
  references: z.array(sourceFlowReferenceSchema).max(4),
  relatedNodeIds: z.array(z.string().min(1)).max(6),
  column: z.number().int().min(0).max(5),
});

const sourceFlowEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string(),
});

export const sourceFlowOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  defaultSelectedNodeId: z.string(),
  nodes: z.array(sourceFlowNodeSchema).min(4).max(9),
  edges: z.array(sourceFlowEdgeSchema).min(3).max(12),
});

const HORIZONTAL_GAP = 360;
const VERTICAL_GAP = 210;

function compareNodeLabels(
  left: z.infer<typeof sourceFlowNodeSchema>,
  right: z.infer<typeof sourceFlowNodeSchema>,
) {
  return left.label.localeCompare(right.label, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getLayoutRootIds(
  flow: z.infer<typeof sourceFlowOutputSchema>,
  incomingCounts: Map<string, number>,
) {
  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  const zeroIncoming = flow.nodes
    .filter((node) => (incomingCounts.get(node.id) ?? 0) === 0)
    .sort(compareNodeLabels)
    .map((node) => node.id);
  const remaining = flow.nodes
    .filter((node) => !zeroIncoming.includes(node.id))
    .sort((left, right) => {
      const incomingDifference =
        (incomingCounts.get(left.id) ?? 0) - (incomingCounts.get(right.id) ?? 0);

      return incomingDifference || compareNodeLabels(left, right);
    })
    .map((node) => node.id);

  if (
    flow.defaultSelectedNodeId &&
    nodeIds.has(flow.defaultSelectedNodeId) &&
    (incomingCounts.get(flow.defaultSelectedNodeId) ?? 0) === 0
  ) {
    return [
      flow.defaultSelectedNodeId,
      ...zeroIncoming.filter((nodeId) => nodeId !== flow.defaultSelectedNodeId),
      ...remaining,
    ];
  }

  return [...zeroIncoming, ...remaining];
}

function buildStageMap(
  flow: z.infer<typeof sourceFlowOutputSchema>,
  incomingCounts: Map<string, number>,
  outgoing: Map<string, string[]>,
) {
  const stageByNodeId = new Map<string, number>();
  const layoutRoots = getLayoutRootIds(flow, incomingCounts);

  for (const rootId of layoutRoots) {
    if (stageByNodeId.has(rootId)) {
      continue;
    }

    const queue: string[] = [rootId];
    stageByNodeId.set(rootId, 0);

    while (queue.length > 0) {
      const currentId = queue.shift() as string;
      const currentStage = stageByNodeId.get(currentId) ?? 0;

      for (const nextId of outgoing.get(currentId) ?? []) {
        const nextStage = currentStage + 1;
        const previousStage = stageByNodeId.get(nextId);

        if (previousStage === undefined || nextStage > previousStage) {
          stageByNodeId.set(nextId, nextStage);
        }

        if (previousStage === undefined) {
          queue.push(nextId);
        }
      }
    }
  }

  return stageByNodeId;
}

export function normalizeSourceFlow(
  flow: z.infer<typeof sourceFlowOutputSchema>,
) {
  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  const filteredEdges = flow.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
  const incomingCounts = new Map(flow.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of filteredEdges) {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1);

    const nextOutgoing = outgoing.get(edge.source) ?? [];
    if (!nextOutgoing.includes(edge.target)) {
      nextOutgoing.push(edge.target);
      outgoing.set(edge.source, nextOutgoing);
    }

    const nextIncoming = incoming.get(edge.target) ?? [];
    if (!nextIncoming.includes(edge.source)) {
      nextIncoming.push(edge.source);
      incoming.set(edge.target, nextIncoming);
    }
  }

  const stageByNodeId = buildStageMap(flow, incomingCounts, outgoing);
  const stageBuckets = new Map<number, Array<z.infer<typeof sourceFlowNodeSchema>>>();

  for (const node of flow.nodes) {
    const stage = stageByNodeId.get(node.id) ?? node.column ?? 0;
    const bucket = stageBuckets.get(stage) ?? [];
    bucket.push(node);
    stageBuckets.set(stage, bucket);
  }

  const sortedStages = Array.from(stageBuckets.keys()).sort((left, right) => left - right);
  const previousStageOrder = new Map<string, number>();
  const positionByNodeId = new Map<string, { x: number; y: number }>();

  for (const stage of sortedStages) {
    const stageNodes = [...(stageBuckets.get(stage) ?? [])];
    stageNodes.sort((left, right) => {
      const leftIncoming = incoming.get(left.id) ?? [];
      const rightIncoming = incoming.get(right.id) ?? [];
      const leftParentOrder = leftIncoming.length
        ? Math.min(...leftIncoming.map((nodeId) => previousStageOrder.get(nodeId) ?? Number.MAX_SAFE_INTEGER))
        : Number.MAX_SAFE_INTEGER;
      const rightParentOrder = rightIncoming.length
        ? Math.min(...rightIncoming.map((nodeId) => previousStageOrder.get(nodeId) ?? Number.MAX_SAFE_INTEGER))
        : Number.MAX_SAFE_INTEGER;
      const leftFallback = left.column ?? stage;
      const rightFallback = right.column ?? stage;

      return (
        leftParentOrder - rightParentOrder ||
        leftFallback - rightFallback ||
        compareNodeLabels(left, right)
      );
    });

    stageNodes.forEach((node, index) => {
      previousStageOrder.set(node.id, index);
      positionByNodeId.set(node.id, {
        x: stage * HORIZONTAL_GAP,
        y: index * VERTICAL_GAP,
      });
    });
  }

  const nodes = flow.nodes.map((node) => {
    const fallbackStage = node.column ?? 0;
    const fallbackIndex = [...flow.nodes]
      .filter((candidate) => (candidate.column ?? 0) === fallbackStage)
      .sort(compareNodeLabels)
      .findIndex((candidate) => candidate.id === node.id);
    const position = positionByNodeId.get(node.id) ?? {
      x: fallbackStage * HORIZONTAL_GAP,
      y: fallbackIndex * VERTICAL_GAP,
    };

    return {
      ...node,
      label: node.label.trim(),
      summary: node.summary.trim(),
      details: node.details.trim(),
      references: node.references
        .slice(0, 4)
        .map((reference) => ({
          kind: reference.kind,
          label: reference.label.trim(),
          detail: reference.detail.trim(),
        }))
        .filter((reference) => reference.label && reference.detail),
      relatedNodeIds: node.relatedNodeIds.filter((relatedNodeId) =>
        nodeIds.has(relatedNodeId),
      ),
      position,
    };
  });

  return {
    ...flow,
    defaultSelectedNodeId:
      flow.defaultSelectedNodeId && nodeIds.has(flow.defaultSelectedNodeId)
        ? flow.defaultSelectedNodeId
        : nodes[0]?.id,
    nodes,
    edges: filteredEdges.map((edge, index) => ({
        ...edge,
        id: `${edge.source}-${edge.target}-${index}`,
        label: edge.label.trim() || undefined,
      })),
  };
}
