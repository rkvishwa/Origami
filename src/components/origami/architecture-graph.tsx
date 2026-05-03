"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FileCode2,
  Network,
  PanelsTopLeft,
  ServerCog,
  DatabaseZap,
  Maximize2,
} from "lucide-react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  type Edge,
  type Node,
} from "reactflow";

import type { ArchitectureGraphNode, ArchitectureGraphOutput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/origami/modal";

type ArchitectureGraphProps = {
  graph: ArchitectureGraphOutput;
  onOpenRepoPath?: (path: string) => void;
  compact?: boolean;
  className?: string;
};

const kindStyles = {
  entry: {
    border: "border-lime-300/40",
    bg: "from-lime-300/20 to-lime-400/5",
    text: "text-lime-50",
    icon: PanelsTopLeft,
  },
  ui: {
    border: "border-cyan-300/35",
    bg: "from-cyan-300/18 to-cyan-400/5",
    text: "text-cyan-50",
    icon: Network,
  },
  service: {
    border: "border-amber-300/35",
    bg: "from-amber-300/18 to-amber-400/5",
    text: "text-amber-50",
    icon: ServerCog,
  },
  data: {
    border: "border-fuchsia-300/35",
    bg: "from-fuchsia-300/18 to-fuchsia-400/5",
    text: "text-fuchsia-50",
    icon: DatabaseZap,
  },
  external: {
    border: "border-white/20",
    bg: "from-white/10 to-white/5",
    text: "text-white",
    icon: FileCode2,
  },
} as const;

function GraphNodeCard({
  node,
  selected,
}: {
  node: ArchitectureGraphNode;
  selected: boolean;
}) {
  const style = kindStyles[node.kind];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "min-w-[220px] rounded-xl border bg-gradient-to-br p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all",
        style.border,
        style.bg,
        selected ? "ring-2 ring-lime-300/50" : "ring-1 ring-white/8",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">
            {node.kind}
          </div>
          <div className={cn("mt-1 text-sm font-semibold", style.text)}>
            {node.label}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-2 text-white/75">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/62">
        {node.description || node.details}
      </p>
    </div>
  );
}

export function ArchitectureGraph({
  graph,
  onOpenRepoPath,
  compact = false,
  className,
}: ArchitectureGraphProps) {
  const graphIdentity = useMemo(
    () =>
      [
        graph.title,
        graph.defaultSelectedNodeId ?? "",
        graph.nodes.map((node) => node.id).join("|"),
        graph.edges.map((edge) => edge.id).join("|"),
      ].join("::"),
    [graph.defaultSelectedNodeId, graph.edges, graph.nodes, graph.title],
  );

  const defaultSelectedNodeId = graph.defaultSelectedNodeId ?? graph.nodes[0]?.id;
  const [selectedNodeId, setSelectedNodeId] = useState(defaultSelectedNodeId);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setSelectedNodeId((current) =>
      current === defaultSelectedNodeId ? current : defaultSelectedNodeId,
    );
  }, [defaultSelectedNodeId, graphIdentity]);

  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0],
    [graph.nodes, selectedNodeId],
  );

  const nodes: Node[] = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        position: node.position,
        data: {
          label: (
            <GraphNodeCard node={node} selected={node.id === selectedNode?.id} />
          ),
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: "transparent",
          border: "none",
          padding: 0,
          width: 250,
        },
      })),
    [graph.nodes, selectedNode?.id],
  );

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        ...edge,
        animated: edge.source === selectedNode?.id || edge.target === selectedNode?.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#ccff00" },
        labelStyle: { fill: "#cbd5c0", fontSize: 11 },
        labelBgStyle: { fill: "rgba(0,0,0,0.65)" },
        style: {
          stroke:
            edge.source === selectedNode?.id || edge.target === selectedNode?.id
              ? "#ccff00"
              : "rgba(255,255,255,0.24)",
          strokeWidth:
            edge.source === selectedNode?.id || edge.target === selectedNode?.id
              ? 2
              : 1.2,
        },
      })),
    [graph.edges, selectedNode?.id],
  );

  return (
    <div
      className={cn(
        "grid gap-4",
        compact ? "xl:grid-cols-[minmax(0,1.1fr)_280px]" : "xl:grid-cols-[minmax(0,1.3fr)_320px]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-white/92">{graph.title}</h3>
            <p className="mt-1 text-sm text-white/48">{graph.summary}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] text-lime-200/80">
              interactive graph
            </span>
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              title="Open full screen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Expand</span>
            </button>
          </div>
        </div>

        <div className={cn("relative flex-1", compact ? "min-h-[300px]" : "min-h-[380px]")}>
          <ReactFlow
            key={graphIdentity}
            edges={edges}
            fitView
            nodes={nodes}
            nodesDraggable={false}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            panOnDrag
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.08)" gap={24} />
            <Controls
              className="!border-white/10 !bg-black/70 !text-white"
              position="bottom-right"
              showInteractive={false}
              showFitView={false}
            />
          </ReactFlow>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-white/40">
              Node inspector
            </div>
            <h4 className="mt-3 text-xl font-semibold text-white/92">
              {selectedNode?.label ?? "No node selected"}
            </h4>
          </div>
          {selectedNode ? (
            <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] text-lime-100 mt-1 shrink-0">
              {selectedNode.kind}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-base leading-7 text-white/68">
          {selectedNode?.details ??
            "Click a node to open the detailed explanation and source evidence."}
        </p>

        {selectedNode?.relatedNodeIds.length ? (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">
              Related nodes
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedNode.relatedNodeIds.map((relatedNodeId) => {
                const relatedNode = graph.nodes.find((node) => node.id === relatedNodeId);

                if (!relatedNode) {
                  return null;
                }

                return (
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/78 transition hover:border-lime-300/35 hover:bg-lime-300/10 hover:text-lime-50"
                    key={relatedNode.id}
                    onClick={() => setSelectedNodeId(relatedNode.id)}
                    type="button"
                  >
                    {relatedNode.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">
            Evidence
          </div>
          <div className="mt-4 space-y-4">
            {selectedNode?.evidence.length ? (
              selectedNode.evidence.map((item, index) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] p-5"
                  key={`${item.path}-${index}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm font-medium text-lime-100/88">
                      {item.path}
                    </div>
                    {onOpenRepoPath ? (
                      <button
                        className="shrink-0 text-xs text-white/55 transition hover:text-white"
                        onClick={() => onOpenRepoPath(item.path)}
                        type="button"
                      >
                        Open file
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">{item.reason}</p>
                  {item.excerpt ? (
                    <div className="mt-3 rounded-xl border border-white/6 bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
                      {item.excerpt}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-5 py-6 text-base text-white/48">
                This node did not come with excerptable evidence, but it still participates in the graph relationships.
              </div>
            )}
          </div>
        </div>

        {selectedNode?.recommendedPaths.length ? (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">
              Open next
            </div>
            <div className="mt-4 space-y-3">
              {selectedNode.recommendedPaths.map((path) => (
                <button
                  className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-base text-white/74 transition hover:border-lime-300/30 hover:bg-lime-300/8 hover:text-white"
                  key={path}
                  onClick={() => onOpenRepoPath?.(path)}
                  type="button"
                >
                  <span className="truncate">{path}</span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/38" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={graph.title}
        className="w-[95vw] h-[95vh] max-w-none !bg-[#0A0A0A]"
      >
        <div className="flex h-full flex-col lg:flex-row gap-6 p-2 min-h-0">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
            <ReactFlow
              key={`expanded-${graphIdentity}`}
              edges={edges}
              fitView
              nodes={nodes}
              nodesDraggable={false}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              panOnDrag
              proOptions={{ hideAttribution: true }}
            >
              <Background color="rgba(255,255,255,0.08)" gap={24} />
              <Controls
                className="!border-white/10 !bg-black/70 !text-white"
                position="bottom-right"
                showInteractive={false}
              />
            </ReactFlow>
          </div>
          <div className="w-full lg:w-[400px] shrink-0 overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6 pr-2">
            <div className="pr-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-white/40">
                    Node inspector
                  </div>
                  <h4 className="mt-3 text-xl font-semibold text-white/92">
                    {selectedNode?.label ?? "No node selected"}
                  </h4>
                </div>
                {selectedNode ? (
                  <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] text-lime-100 mt-1 shrink-0">
                    {selectedNode.kind}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-base leading-7 text-white/68">
                {selectedNode?.details ??
                  "Click a node to open the detailed explanation and source evidence."}
              </p>

              {selectedNode?.evidence.length ? (
                <div className="mt-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">
                    Evidence
                  </div>
                  <div className="mt-4 space-y-4">
                    {selectedNode.evidence.map((item, index) => (
                      <div
                        className="rounded-xl border border-white/8 bg-[#0A0A0A] p-5"
                        key={`${item.path}-${index}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-medium text-lime-100/88">
                            {item.path}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/72">{item.reason}</p>
                        {item.excerpt ? (
                          <div className="mt-3 rounded-xl border border-white/6 bg-white/[0.03] p-4 text-sm leading-6 text-white/55">
                            {item.excerpt}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
