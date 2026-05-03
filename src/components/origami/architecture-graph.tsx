"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileCode2,
  Network,
  PanelsTopLeft,
  ServerCog,
  DatabaseZap,
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
  const [selectedNodeId, setSelectedNodeId] = useState(
    graph.defaultSelectedNodeId ?? graph.nodes[0]?.id,
  );

  useEffect(() => {
    setSelectedNodeId(graph.defaultSelectedNodeId ?? graph.nodes[0]?.id);
  }, [graph]);

  const selectedNode =
    graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0];

  const nodes: Node[] = graph.nodes.map((node) => ({
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
  }));

  const edges: Edge[] = graph.edges.map((edge) => ({
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
        edge.source === selectedNode?.id || edge.target === selectedNode?.id ? 2 : 1.2,
    },
  }));

  return (
    <div
      className={cn(
        "grid gap-4",
        compact ? "xl:grid-cols-[minmax(0,1.1fr)_280px]" : "xl:grid-cols-[minmax(0,1.3fr)_320px]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-white/92">{graph.title}</h3>
            <p className="mt-1 text-xs text-white/48">{graph.summary}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-lime-200/80">
            interactive graph
          </div>
        </div>

        <div className={cn("relative", compact ? "h-[300px]" : "h-[380px]")}>
          <ReactFlow
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
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Node inspector
            </div>
            <h4 className="mt-2 text-lg font-semibold text-white/92">
              {selectedNode?.label ?? "No node selected"}
            </h4>
          </div>
          {selectedNode ? (
            <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-lime-100">
              {selectedNode.kind}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-6 text-white/68">
          {selectedNode?.details ??
            "Click a node to open the detailed explanation and source evidence."}
        </p>

        {selectedNode?.relatedNodeIds.length ? (
          <div className="mt-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
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
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/78 transition hover:border-lime-300/35 hover:bg-lime-300/10 hover:text-lime-50"
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

        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
            Evidence
          </div>
          <div className="mt-3 space-y-3">
            {selectedNode?.evidence.length ? (
              selectedNode.evidence.map((item, index) => (
                <div
                  className="rounded-xl border border-white/8 bg-[#0A0A0A] p-3"
                  key={`${item.path}-${index}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-xs font-medium text-lime-100/88">
                      {item.path}
                    </div>
                    {onOpenRepoPath ? (
                      <button
                        className="shrink-0 text-[11px] text-white/55 transition hover:text-white"
                        onClick={() => onOpenRepoPath(item.path)}
                        type="button"
                      >
                        Open file
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.reason}</p>
                  {item.excerpt ? (
                    <div className="mt-2 rounded-xl border border-white/6 bg-white/[0.03] p-3 text-xs leading-5 text-white/55">
                      {item.excerpt}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-4 py-5 text-sm text-white/48">
                This node did not come with excerptable evidence, but it still participates in the graph relationships.
              </div>
            )}
          </div>
        </div>

        {selectedNode?.recommendedPaths.length ? (
          <div className="mt-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Open next
            </div>
            <div className="mt-3 space-y-2">
              {selectedNode.recommendedPaths.map((path) => (
                <button
                  className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-sm text-white/74 transition hover:border-lime-300/30 hover:bg-lime-300/8 hover:text-white"
                  key={path}
                  onClick={() => onOpenRepoPath?.(path)}
                  type="button"
                >
                  <span className="truncate">{path}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/38" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
