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

export type SourceQaTextItemSnapshot = {
  id: "source";
  label: string;
  content: string;
  contentTruncated: boolean;
};

export type SourceQaTextSnapshot = {
  kind: "text" | "file";
  label: string;
  sourceUrl?: string;
  item: SourceQaTextItemSnapshot;
};

export type SourceQaPdfSectionSnapshot = {
  id: string;
  heading: string;
  summary: string;
  excerpt: string;
  pageStart: number;
  pageEnd: number;
};

export type SourceQaPdfSnapshot = {
  kind: "pdf";
  label: string;
  fileName: string;
  pageCount: number;
  parseStatus: "ready" | "unsupported";
  fullText: string;
  fullTextTruncated: boolean;
  sections: SourceQaPdfSectionSnapshot[];
};

export type SourceQaRepoTabSnapshot = {
  id: string;
  path: string;
  title: string;
  kind: RepoFileKind;
  manifestType?: RepoManifestType;
  fetched: boolean;
  includedInOverview: boolean;
  content?: string;
  contentTruncated: boolean;
};

export type SourceQaRepoSnapshot = {
  kind: "repo";
  label: string;
  repo: RepoMetadata;
  overviewFiles: string[];
  selectedTabId: string;
  totalMatchedFiles: number;
  truncated: boolean;
  tabs: SourceQaRepoTabSnapshot[];
};

export type SourceQaSnapshot =
  | SourceQaTextSnapshot
  | SourceQaPdfSnapshot
  | SourceQaRepoSnapshot;

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

export type SourceFlowNodeKind =
  | "root"
  | "section"
  | "insight"
  | "decision"
  | "action";

export type SourceFlowReferenceKind = "repo-path" | "pdf-section" | "source";

export type SourceFlowReference = {
  kind: SourceFlowReferenceKind;
  label: string;
  detail: string;
};

export type SourceFlowNode = {
  id: string;
  label: string;
  kind: SourceFlowNodeKind;
  summary: string;
  details: string;
  references: SourceFlowReference[];
  relatedNodeIds: string[];
  column: number;
  position: {
    x: number;
    y: number;
  };
};

export type SourceFlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type SourceFlowOutput = {
  title: string;
  summary: string;
  defaultSelectedNodeId?: string;
  nodes: SourceFlowNode[];
  edges: SourceFlowEdge[];
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

export type MvpSiteHero = {
  eyebrow: string;
  headline: string;
  subheadline: string;
};

export type MvpSiteStat = {
  label: string;
  value: string;
  detail: string;
};

export type MvpSiteFeatureCard = {
  title: string;
  description: string;
  bullets: string[];
};

export type MvpSiteWorkflowStep = {
  title: string;
  description: string;
};

export type MvpSiteHighlight = {
  eyebrow: string;
  title: string;
  summary: string;
};

export type MvpSiteProofItem = {
  label: string;
  value: string;
  detail: string;
};

export type MvpSiteCta = {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export type MvpSiteSpec = {
  hero: MvpSiteHero;
  stats: MvpSiteStat[];
  featureCards: MvpSiteFeatureCard[];
  workflow: {
    title: string;
    steps: MvpSiteWorkflowStep[];
  };
  contentHighlights: {
    title: string;
    items: MvpSiteHighlight[];
  };
  sourceProof: {
    title: string;
    items: MvpSiteProofItem[];
  };
  cta: MvpSiteCta;
};

export type MvpSiteArtifact = {
  id: string;
  sourceKind: SourceKind;
  sourceLabel: string;
  appTitle: string;
  summary: string;
  sourceBrief: string;
  customizationHistory: string[];
  siteSpec: MvpSiteSpec;
  code: string;
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

export type SourceFlowState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
      flow?: SourceFlowOutput;
    }
  | {
      status: "ready";
      flow: SourceFlowOutput;
    }
  | {
      status: "error";
      error: string;
      flow?: SourceFlowOutput;
    };
