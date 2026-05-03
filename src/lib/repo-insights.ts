import type {
  PackageManifestInsight,
  RepoSourceDocument,
} from "@/lib/types";

const KEY_DEPENDENCY_PRIORITY = [
  "next",
  "react",
  "typescript",
  "ai",
  "@ai-sdk/openai",
  "tailwindcss",
  "turbo",
  "pnpm",
  "vite",
  "astro",
  "express",
  "hono",
  "fastify",
  "@nestjs/core",
];

const FRAMEWORK_LABELS: Record<string, string> = {
  next: "Next.js",
  react: "React",
  typescript: "TypeScript",
  ai: "AI SDK",
  "@ai-sdk/openai": "OpenAI provider",
  tailwindcss: "Tailwind CSS",
  turbo: "Turborepo",
  vite: "Vite",
  astro: "Astro",
  express: "Express",
  hono: "Hono",
  fastify: "Fastify",
  "@nestjs/core": "NestJS",
  svelte: "Svelte",
  vue: "Vue",
};

type PackageJsonShape = {
  name?: string;
  version?: string;
  private?: boolean;
  packageManager?: string;
  workspaces?: string[] | { packages?: string[] };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function safeParseJson(text: string) {
  try {
    return JSON.parse(text) as PackageJsonShape;
  } catch {
    return null;
  }
}

function detectFrameworks(dependencies: string[]) {
  return Array.from(
    new Set(
      dependencies
        .map((dependency) => FRAMEWORK_LABELS[dependency])
        .filter(Boolean),
    ),
  );
}

export function summarizePackageManifest(
  path: string,
  text: string,
): PackageManifestInsight | null {
  const manifest = safeParseJson(text);

  if (!manifest) {
    return null;
  }

  const scripts = Object.entries(manifest.scripts ?? {}).map(([name, command]) => ({
    name,
    command,
  }));
  const dependencies = manifest.dependencies ?? {};
  const devDependencies = manifest.devDependencies ?? {};
  const peerDependencies = manifest.peerDependencies ?? {};
  const allDependencyNames = [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
    ...Object.keys(peerDependencies),
  ];
  const keyDependencies = KEY_DEPENDENCY_PRIORITY
    .filter((name) => allDependencyNames.includes(name))
    .map((name) => ({
      name,
      version:
        dependencies[name] ??
        devDependencies[name] ??
        peerDependencies[name] ??
        "detected",
    }))
    .slice(0, 6);
  const workspaceCount = Array.isArray(manifest.workspaces)
    ? manifest.workspaces.length
    : manifest.workspaces?.packages?.length ?? 0;
  const runtimeSignals = Array.from(
    new Set(
      [
        manifest.private ? "private package" : "public package",
        manifest.packageManager ? `package manager: ${manifest.packageManager}` : null,
        workspaceCount > 0 ? `workspace roots: ${workspaceCount}` : null,
        scripts.find((script) => script.name === "dev") ? "local dev command" : null,
        scripts.find((script) => script.name === "build") ? "build pipeline" : null,
      ].filter(Boolean) as string[],
    ),
  );

  return {
    title: manifest.name ?? (path === "package.json" ? "Root package.json" : path),
    path,
    packageName: manifest.name,
    version: manifest.version,
    private: Boolean(manifest.private),
    packageManager: manifest.packageManager,
    scriptCount: scripts.length,
    dependencyCount: Object.keys(dependencies).length,
    devDependencyCount: Object.keys(devDependencies).length,
    workspaceCount,
    scripts: scripts.slice(0, 8),
    keyDependencies,
    detectedFrameworks: detectFrameworks(allDependencyNames),
    runtimeSignals,
  };
}

export function getRepoManifestInsights(source: RepoSourceDocument) {
  return source.tabs
    .filter((tab) => tab.kind === "manifest" && tab.manifestType === "package-json")
    .map((tab) => {
      const text = source.contentCache[tab.path];
      return text ? summarizePackageManifest(tab.path, text) : null;
    })
    .filter((insight): insight is PackageManifestInsight => Boolean(insight));
}

export function getRepoSignalBadges(source: RepoSourceDocument) {
  const insights = getRepoManifestInsights(source);
  const frameworks = Array.from(
    new Set(insights.flatMap((insight) => insight.detectedFrameworks)),
  );
  const runtimeSignals = Array.from(
    new Set(insights.flatMap((insight) => insight.runtimeSignals)),
  );

  return [...frameworks, ...runtimeSignals].slice(0, 8);
}
