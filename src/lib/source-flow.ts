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

export function normalizeSourceFlow(
  flow: z.infer<typeof sourceFlowOutputSchema>,
) {
  const columnBuckets = new Map<
    number,
    Array<z.infer<typeof sourceFlowNodeSchema>>
  >();

  for (const node of flow.nodes) {
    const bucket = columnBuckets.get(node.column) ?? [];
    bucket.push(node);
    columnBuckets.set(node.column, bucket);
  }

  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  const nodes = flow.nodes.map((node) => {
    const columnNodes = columnBuckets.get(node.column) ?? [];
    const index = columnNodes.findIndex((columnNode) => columnNode.id === node.id);

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
      position: {
        x: node.column * 300,
        y: index * 190,
      },
    };
  });

  return {
    ...flow,
    defaultSelectedNodeId:
      flow.defaultSelectedNodeId && nodeIds.has(flow.defaultSelectedNodeId)
        ? flow.defaultSelectedNodeId
        : nodes[0]?.id,
    nodes,
    edges: flow.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge, index) => ({
        ...edge,
        id: `${edge.source}-${edge.target}-${index}`,
        label: edge.label.trim() || undefined,
      })),
  };
}
