"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRightCircle,
  FileText,
  GitBranch,
  Lightbulb,
  Loader2,
  Network,
  RefreshCw,
  Route,
  Maximize,
  Minimize,
} from "lucide-react";
import ReactFlow, {
  Background,
  Handle,
  MarkerType,
  Position,
  SelectionMode,
  useEdgesState,
  useNodesState,
  type Edge,
  type NodeChange,
  type Node,
  type NodeProps,
} from "reactflow";

import type {
  SourceFlowNode,
  SourceFlowOutput,
  SourceFlowState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type SourceFlowMapProps = {
  contextKey: string | null;
  renderKey: number;
  state: SourceFlowState;
  onRefresh: () => void;
};

type SourceFlowCardNodeData = {
  node: SourceFlowNode;
};

const kindStyles = {
  root: {
    border: "border-lime-300/40",
    bg: "from-lime-300/20 to-lime-400/5",
    text: "text-lime-50",
    icon: Route,
  },
  section: {
    border: "border-cyan-300/35",
    bg: "from-cyan-300/18 to-cyan-400/5",
    text: "text-cyan-50",
    icon: FileText,
  },
  insight: {
    border: "border-amber-300/35",
    bg: "from-amber-300/18 to-amber-400/5",
    text: "text-amber-50",
    icon: Lightbulb,
  },
  decision: {
    border: "border-fuchsia-300/35",
    bg: "from-fuchsia-300/18 to-fuchsia-400/5",
    text: "text-fuchsia-50",
    icon: GitBranch,
  },
  action: {
    border: "border-white/20",
    bg: "from-white/10 to-white/5",
    text: "text-white",
    icon: ArrowRightCircle,
  },
} as const;

function FlowNodeCard({
  data,
  selected,
}: NodeProps<SourceFlowCardNodeData>) {
  const style = kindStyles[data.node.kind];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "min-w-[240px] cursor-grab rounded-2xl border bg-gradient-to-br p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-sm transition-all active:cursor-grabbing",
        style.border,
        style.bg,
        selected ? "ring-2 ring-lime-300/55" : "ring-1 ring-white/8",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/42">
            {data.node.kind}
          </div>
          <div className={cn("mt-1 text-sm font-semibold", style.text)}>
            {data.node.label}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-2 text-white/72">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/66">{data.node.summary}</p>
      <Handle
        id={TARGET_HANDLE_ID}
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border !border-white/15 !bg-[#0A0A0A] !opacity-0"
        isConnectable={false}
      />
      <Handle
        id={SOURCE_HANDLE_ID}
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border !border-white/15 !bg-[#0A0A0A] !opacity-0"
        isConnectable={false}
      />
    </div>
  );
}

const nodeTypes = {
  sourceFlowCard: FlowNodeCard,
};

const SOURCE_HANDLE_ID = "out";
const TARGET_HANDLE_ID = "in";

function getFlowFromState(state: SourceFlowState) {
  if (state.status === "ready") {
    return state.flow;
  }

  if (state.status === "loading" || state.status === "error") {
    return state.flow;
  }

  return undefined;
}

function createFlowNodes(flow: SourceFlowOutput): Node<SourceFlowCardNodeData>[] {
  return flow.nodes.map((node) => ({
    id: node.id,
    type: "sourceFlowCard",
    position: node.position,
    data: { node },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
    selectable: true,
    style: {
      background: "transparent",
      border: "none",
      width: 270,
      padding: 0,
    },
  }));
}

function createFlowEdges(flow: SourceFlowOutput): Edge[] {
  return flow.edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    sourceHandle: SOURCE_HANDLE_ID,
    targetHandle: TARGET_HANDLE_ID,
    animated: false,
    label: undefined,
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.36)" },
    pathOptions: {
      offset: 28,
      borderRadius: 18,
    },
    style: {
      stroke: "rgba(255,255,255,0.16)",
      strokeWidth: 1.2,
    },
  }));
}

export function SourceFlowMap({
  contextKey,
  renderKey,
  state,
  onRefresh,
}: SourceFlowMapProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const flow = getFlowFromState(state);
  const lastContextKeyRef = useRef<string | null>(null);
  const previousNodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(
    flow?.defaultSelectedNodeId ?? flow?.nodes[0]?.id,
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<SourceFlowCardNodeData>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const flowIdentity = useMemo(
    () =>
      [
        renderKey,
        flow?.title ?? "",
        flow?.defaultSelectedNodeId ?? "",
        flow?.nodes.map((node) => node.id).join("|") ?? "",
        flow?.edges.map((edge) => edge.id).join("|") ?? "",
      ].join("::"),
    [flow, renderKey],
  );

  const interactiveEdges = useMemo(() => {
    if (!selectedNodeId) {
      return edges;
    }

    return edges.map((edge) => {
      const isSelectedEdge =
        edge.source === selectedNodeId || edge.target === selectedNodeId;

      return {
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSelectedEdge ? "#ccff00" : "rgba(255,255,255,0.36)",
        },
        style: {
          stroke: isSelectedEdge ? "#ccff00" : "rgba(255,255,255,0.16)",
          strokeWidth: isSelectedEdge ? 2.2 : 1.2,
        },
      };
    });
  }, [edges, selectedNodeId]);

  useEffect(() => {
    if (contextKey !== lastContextKeyRef.current) {
      previousNodePositionsRef.current = {};
      lastContextKeyRef.current = contextKey;
    }
  }, [contextKey]);

  useEffect(() => {
    if (!flow) {
      setSelectedNodeId(undefined);
      setNodes([]);
      setEdges([]);
      previousNodePositionsRef.current = {};
      return;
    }

    const previousPositions = previousNodePositionsRef.current;
    const canReusePositions =
      Object.keys(previousPositions).length > 0 &&
      flow.nodes.every((node) => previousPositions[node.id]);
    const nextFlow = canReusePositions
      ? {
          ...flow,
          nodes: flow.nodes.map((node) => ({
            ...node,
            position: previousPositions[node.id] ?? node.position,
          })),
        }
      : flow;

    setSelectedNodeId(nextFlow.defaultSelectedNodeId ?? nextFlow.nodes[0]?.id);
    setNodes(createFlowNodes(nextFlow));
    setEdges(createFlowEdges(nextFlow));
    previousNodePositionsRef.current = Object.fromEntries(
      nextFlow.nodes.map((node) => [node.id, node.position]),
    );
  }, [flow, flowIdentity, setEdges, setNodes]);



  const selectedNode = useMemo(
    () => flow?.nodes.find((node) => node.id === selectedNodeId) ?? flow?.nodes[0],
    [flow, selectedNodeId],
  );

  const isLoading = state.status === "loading";
  const error = state.status === "error" ? state.error : null;

  const content = (
    <section className={cn(
      "border border-white/8 bg-white/[0.03] transition-all",
      isFullScreen ? "fixed inset-0 z-[100] flex flex-col rounded-none bg-[#000]" : "rounded-2xl"
    )}>
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
              Flow map
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white/92">
              {flow?.title ?? "Connected source cards"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/56">
              {flow?.summary ??
                "Origami will map the active source into connected cards with summaries and grounded references."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em]",
                isLoading
                  ? "border-lime-300/25 bg-lime-300/10 text-lime-100"
                  : error
                    ? "border-red-400/20 bg-red-500/10 text-red-50"
                    : "border-white/10 bg-white/5 text-white/62",
              )}
            >
              {isLoading ? "Loading" : error ? "Needs retry" : flow ? "Ready" : "Waiting"}
            </span>
            {flow && !error && !isLoading ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0A0A] px-4 py-2 text-xs font-medium text-white/72 transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-50"
                onClick={() => setIsFullScreen(!isFullScreen)}
                type="button"
              >
                {isFullScreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                {isFullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0A0A] px-4 py-2 text-xs font-medium text-white/72 transition hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={onRefresh}
              type="button"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh map
            </button>
          </div>
        </div>
      </div>

      <div className={cn("p-4", isFullScreen ? "flex-1 min-h-0 flex flex-col" : "")}>
        {!flow ? (
          <div
            className={cn(
              "flex min-h-[240px] items-center justify-center rounded-2xl border bg-[#0A0A0A] px-6 text-center",
              error ? "border-red-400/20" : "border-dashed border-white/10",
            )}
          >
            <div className="max-w-md">
              {isLoading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-lime-300" />
              ) : (
                <Network className="mx-auto h-6 w-6 text-white/38" />
              )}
              <p className="mt-4 text-sm leading-6 text-white/56">
                {error
                  ? error
                  : isLoading
                    ? "Building connected cards for the active source…"
                    : "Refresh the map to generate connected cards for this source."}
              </p>
            </div>
          </div>
        ) : (
          <div className={cn("grid gap-4", isFullScreen ? "xl:grid-cols-[minmax(0,1.2fr)_400px] flex-1 h-full min-h-0" : "xl:grid-cols-[minmax(0,1.2fr)_300px]")}>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]">
              <div className="border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.22em] text-white/40">
                Drag cards with left click. Use wheel or trackpad to pan.
              </div>
              <div className={cn("relative w-full panel-grid flex-1", isFullScreen ? "h-full min-h-[500px]" : "h-[380px] md:h-[420px]")}>
                <ReactFlow
                  key={flowIdentity}
                  edges={interactiveEdges}
                  fitView
                  nodes={nodes}
                  nodesDraggable
                  nodesConnectable={false}
                  nodeTypes={nodeTypes}
                  onNodeDragStop={(_, node) => {
                    previousNodePositionsRef.current = {
                      ...previousNodePositionsRef.current,
                      [node.id]: node.position,
                    };
                  }}
                  onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  onNodesChange={onNodesChange}
                  panOnDrag={false}
                  panOnScroll
                  selectionMode={SelectionMode.Partial}
                  selectionOnDrag={false}
                  zoomOnScroll={false}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="rgba(255,255,255,0.06)" gap={24} />
                </ReactFlow>
              </div>
            </div>

            <div className={cn("rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 overflow-y-auto", isFullScreen ? "h-full" : "")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">
                    Card inspector
                  </div>
                  <h4 className="mt-3 text-xl font-semibold text-white/92">
                    {selectedNode?.label ?? "No card selected"}
                  </h4>
                </div>
                {selectedNode ? (
                  <span className="rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] text-lime-100">
                    {selectedNode.kind}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-white/58">
                {selectedNode?.summary ??
                  "Select a card to inspect the longer explanation and grounded references."}
              </p>

              <p className="mt-4 text-base leading-7 text-white/70">
                {selectedNode?.details}
              </p>

              {selectedNode?.relatedNodeIds.length ? (
                <div className="mt-8">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">
                    Related cards
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedNode.relatedNodeIds.map((relatedNodeId) => {
                      const relatedNode = flow.nodes.find((node) => node.id === relatedNodeId);

                      if (!relatedNode) {
                        return null;
                      }

                      return (
                        <button
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/78 transition hover:border-lime-300/35 hover:bg-lime-300/10 hover:text-lime-50"
                          key={relatedNode.id}
                          onClick={() => {
                            setSelectedNodeId(relatedNode.id);
                            setNodes((nds) =>
                              nds.map((n) => ({ ...n, selected: n.id === relatedNode.id }))
                            );
                          }}
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
                  Grounding
                </div>
                <div className="mt-4 space-y-3">
                  {selectedNode?.references.length ? (
                    selectedNode.references.map((reference) => (
                      <div
                        className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
                        key={`${reference.kind}-${reference.label}-${reference.detail}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-[#050505] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
                            {reference.kind}
                          </span>
                          <span className="text-sm font-medium text-white/86">
                            {reference.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/56">
                          {reference.detail}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/48">
                      This card does not have extra grounded references beyond the current source brief.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {flow && error ? (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );

  if (isFullScreen && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
