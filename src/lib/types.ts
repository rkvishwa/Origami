export type SourceKind = "text" | "file" | "repo" | "pdf";

export type BaseTextSourceDocument = {
  kind: "text" | "file";
  label: string;
  text: string;
  sourceUrl?: string;
  fetchedAt?: string;
};

export type PdfSection = {
  id: string;
  heading: string;
  summary: string;
  pageStart: number;
  pageEnd: number;
  excerpt: string;
};

export type PdfSourceDocument = {
  kind: "pdf";
  label: string;
  fileName: string;
  text: string;
  fetchedAt: string;
  uploadedAt: string;
  pageCount: number;
  sections: PdfSection[];
  parseStatus: "ready" | "unsupported";
};

export type RepoMetadata = {
  owner: string;
  repo: string;
  branch: string;
  sourceUrl: string;
};

export type RepoFileKind = "markdown" | "manifest";

export type RepoManifestType =
  | "package-json"
  | "pnpm-workspace"
  | "turbo-json"
  | "tsconfig-json"
  | "other-manifest";

export type RepoFileDescriptor = {
  id: string;
  path: string;
  kind: RepoFileKind;
  manifestType?: RepoManifestType;
  title: string;
  priority: number;
  fetched: boolean;
  rawUrl: string;
  size: number;
  includedInOverview: boolean;
};

export type RepoSourceDocument = {
  kind: "repo";
  label: string;
  sourceUrl: string;
  fetchedAt: string;
  repo: RepoMetadata;
  overviewFiles: string[];
  tabs: RepoFileDescriptor[];
  selectedTabId: string;
  contentCache: Record<string, string>;
  totalMatchedFiles: number;
  truncated: boolean;
};

export type SourceDocument =
  | BaseTextSourceDocument
  | RepoSourceDocument
  | PdfSourceDocument;

export type SourceStats = {
  lines: number;
  words: number;
  characters: number;
};

export type ArchitectureNodeKind =
  | "entry"
  | "ui"
  | "service"
  | "data"
  | "external";

export type GraphNodeEvidence = {
  path: string;
  excerpt?: string;
  reason: string;
};

export type ArchitectureGraphNode = {
  id: string;
  label: string;
  kind: ArchitectureNodeKind;
  description?: string;
  details: string;
  layer: number;
  position: {
    x: number;
    y: number;
  };
  evidence: GraphNodeEvidence[];
  relatedNodeIds: string[];
  recommendedPaths: string[];
};

export type ArchitectureGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type ArchitectureGraphOutput = {
  title: string;
  summary: string;
  highlights: string[];
  defaultSelectedNodeId?: string;
  nodes: ArchitectureGraphNode[];
  edges: ArchitectureGraphEdge[];
};

export type RelatedFileInsight = {
  path: string;
  reason: string;
};

export type DocumentInsightSourceType =
  | "guide"
  | "setup"
  | "architecture"
  | "policy"
  | "reference";

export type DocumentInsightOutput = {
  title: string;
  summary: string;
  sourceType: DocumentInsightSourceType;
  takeawayBullets: string[];
  recommendedActions: string[];
  relatedFiles: RelatedFileInsight[];
  focusGraph?: ArchitectureGraphOutput;
};

export type PdfInsightMetric = {
  label: string;
  value: string;
  context: string;
};

export type PdfInsightSection = {
  heading: string;
  summary: string;
  pageRange: string;
};

export type PdfInsightOutput = {
  title: string;
  summary: string;
  documentType: string;
  keyTakeaways: string[];
  notableMetrics: PdfInsightMetric[];
  sectionBreakdown: PdfInsightSection[];
  recommendedActions: string[];
};

export type MiniAppPreviewScreen = {
  name: string;
  purpose: string;
  keyElements: string[];
};

export type MiniAppPreviewEntity = {
  name: string;
  role: string;
};

export type MiniAppPreview = {
  appTitle: string;
  pitch: string;
  targetUser: string;
  appType: string;
  designDirection: string;
  screenCards: MiniAppPreviewScreen[];
  primaryUserFlow: string[];
  componentPalette: string[];
  keyEntities: MiniAppPreviewEntity[];
  launchChecklist: string[];
  constraints: string[];
};

export type V0McpSession = {
  chatId: string;
  chatUrl: string;
  toolName: string;
  followUpSent: boolean;
};

export type CalculatorParameter = {
  id: string;
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  multiplier: number;
};

export type CalculatorSeriesPoint = {
  label: string;
  value: number;
  [key: string]: number | string;
};

export type CalculatorOutput = {
  title: string;
  summary: string;
  baseValue: number;
  outputLabel: string;
  outputUnit?: string;
  decimals: number;
  formulaLabel: string;
  defaultOutput: number;
  highlights: string[];
  parameters: CalculatorParameter[];
  series: CalculatorSeriesPoint[];
  primaryParameterId: string;
};

export type ScenarioOption = {
  id: string;
  label: string;
  impact: string;
  scoreDelta: number;
  tone: "positive" | "neutral" | "warning";
};

export type ScenarioStep = {
  id: string;
  title: string;
  question: string;
  guidance?: string;
  options: ScenarioOption[];
};

export type ScenarioEnding = {
  label: string;
  minScore: number;
  description: string;
};

export type ScenarioSimulatorOutput = {
  title: string;
  summary: string;
  takeawayBullets: string[];
  steps: ScenarioStep[];
  endings: ScenarioEnding[];
  maxScore: number;
};

export type PackageManifestInsight = {
  title: string;
  path: string;
  packageName?: string;
  version?: string;
  private: boolean;
  packageManager?: string;
  scriptCount: number;
  dependencyCount: number;
  devDependencyCount: number;
  workspaceCount: number;
  scripts: Array<{
    name: string;
    command: string;
  }>;
  keyDependencies: Array<{
    name: string;
    version: string;
  }>;
  detectedFrameworks: string[];
  runtimeSignals: string[];
};

export type RepoTabAnalysisState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | {
      status: "ready";
      insight: DocumentInsightOutput;
    }
  | {
      status: "error";
      error: string;
    };
