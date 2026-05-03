import type {
  RepoFileDescriptor,
  RepoManifestType,
  RepoSourceDocument,
} from "@/lib/types";

const MAX_REPO_TABS = 24;
const MAX_OVERVIEW_DOCS = 5;
const MAX_OVERVIEW_MANIFESTS = 3;

const NOISY_SEGMENTS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".changeset",
  "vendor",
  "out",
]);

type GitHubTreeEntry = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

type GitHubRepoMetadata = {
  default_branch: string;
  private: boolean;
  full_name: string;
};

type RepoCandidate = Omit<RepoFileDescriptor, "fetched" | "rawUrl" | "includedInOverview">;

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Origami-Hackathon",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export function parseGitHubRepositoryUrl(url: string) {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  if (parsed.hostname !== "github.com") {
    throw new Error("Only github.com repository URLs are supported in this MVP.");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error("The GitHub URL should look like https://github.com/owner/repo.");
  }

  return {
    owner: segments[0],
    repo: segments[1].replace(/\.git$/, ""),
  };
}

function isMarkdownPath(path: string) {
  return /\.(md|mdx)$/i.test(path);
}

function getManifestType(path: string): RepoManifestType | null {
  if (path === "package.json" || /^apps\/[^/]+\/package\.json$/i.test(path) || /^packages\/[^/]+\/package\.json$/i.test(path)) {
    return "package-json";
  }

  if (path === "pnpm-workspace.yaml") {
    return "pnpm-workspace";
  }

  if (path === "turbo.json") {
    return "turbo-json";
  }

  if (path === "tsconfig.json") {
    return "tsconfig-json";
  }

  return null;
}

function shouldExcludePath(path: string) {
  return path.split("/").some((segment) => NOISY_SEGMENTS.has(segment));
}

function prettifyTitle(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTabTitle(path: string, manifestType: RepoManifestType | null) {
  if (manifestType === "package-json") {
    if (path === "package.json") {
      return "Root package.json";
    }

    const [scope, name] = path.split("/");
    return `${prettifyTitle(name)} ${scope === "apps" ? "app" : "package"}`;
  }

  if (manifestType === "pnpm-workspace") {
    return "pnpm workspace";
  }

  if (manifestType === "turbo-json") {
    return "Turbo config";
  }

  if (manifestType === "tsconfig-json") {
    return "TypeScript config";
  }

  const segments = path.split("/");
  const baseName = segments[segments.length - 1];

  if (/^readme\.(md|mdx)$/i.test(baseName) && segments.length === 1) {
    return "README";
  }

  return prettifyTitle(baseName);
}

function getPathPriority(path: string, manifestType: RepoManifestType | null) {
  const normalized = path.toLowerCase();
  const depth = path.split("/").length;

  if (normalized === "readme.md" || normalized === "readme.mdx") {
    return 100;
  }

  if (normalized === "contributing.md" || normalized === "contributing.mdx") {
    return 97;
  }

  if (normalized === "security.md" || normalized === "security.mdx") {
    return 95;
  }

  if (normalized === "changelog.md" || normalized === "changelog.mdx") {
    return 94;
  }

  if (normalized.startsWith("docs/")) {
    return 88 - depth;
  }

  if (manifestType === "package-json" && path === "package.json") {
    return 86;
  }

  if (manifestType === "pnpm-workspace" || manifestType === "turbo-json" || manifestType === "tsconfig-json") {
    return 84;
  }

  if (manifestType === "package-json") {
    return 80 - depth;
  }

  if (depth === 1 && isMarkdownPath(path)) {
    return 82;
  }

  if (isMarkdownPath(path)) {
    return 72 - depth;
  }

  return 40;
}

function buildRawGitHubUrl(owner: string, repo: string, branch: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`;
}

function chooseOverviewPaths(candidates: RepoCandidate[]) {
  const docs = candidates.filter((candidate) => candidate.kind === "markdown");
  const manifests = candidates.filter((candidate) => candidate.kind === "manifest");

  const paths = [
    ...docs.slice(0, MAX_OVERVIEW_DOCS).map((candidate) => candidate.path),
    ...manifests.slice(0, MAX_OVERVIEW_MANIFESTS).map((candidate) => candidate.path),
  ];

  return Array.from(new Set(paths));
}

async function fetchRepoMetadata(owner: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: getGitHubHeaders(),
    next: {
      revalidate: 1800,
    },
  });

  if (!response.ok) {
    throw new Error(`Could not load repository metadata for ${owner}/${repo}.`);
  }

  const payload = (await response.json()) as GitHubRepoMetadata;

  if (payload.private) {
    throw new Error("Only public repositories are supported in this MVP.");
  }

  return payload;
}

async function fetchRecursiveTree(owner: string, repo: string, branch: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    {
      headers: getGitHubHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Could not enumerate repository files for ${owner}/${repo}.`);
  }

  const payload = (await response.json()) as {
    tree?: GitHubTreeEntry[];
  };

  return payload.tree ?? [];
}

async function fetchSelectedFileContents(
  owner: string,
  repo: string,
  branch: string,
  candidates: RepoCandidate[],
) {
  const entries = await Promise.all(
    candidates.map(async (candidate) => {
      const rawUrl = buildRawGitHubUrl(owner, repo, branch, candidate.path);

      try {
        const response = await fetch(rawUrl, {
          headers: getGitHubHeaders(),
          next: {
            revalidate: 1800,
          },
        });

        if (!response.ok) {
          return {
            descriptor: {
              ...candidate,
              fetched: false,
              rawUrl,
              includedInOverview: false,
            },
            content: null,
          };
        }

        const content = await response.text();

        return {
          descriptor: {
            ...candidate,
            fetched: Boolean(content.trim()),
            rawUrl,
            includedInOverview: false,
          },
          content,
        };
      } catch {
        return {
          descriptor: {
            ...candidate,
            fetched: false,
            rawUrl,
            includedInOverview: false,
          },
          content: null,
        };
      }
    }),
  );

  return entries;
}

function collectRepoCandidates(tree: GitHubTreeEntry[]) {
  const candidates: RepoCandidate[] = [];

  for (const entry of tree) {
    if (entry.type !== "blob" || shouldExcludePath(entry.path)) {
      continue;
    }

    const manifestType = getManifestType(entry.path);

    if (!isMarkdownPath(entry.path) && !manifestType) {
      continue;
    }

    candidates.push({
      id: entry.path,
      path: entry.path,
      kind: manifestType ? "manifest" : "markdown",
      manifestType: manifestType ?? undefined,
      title: buildTabTitle(entry.path, manifestType),
      priority: getPathPriority(entry.path, manifestType),
      size: entry.size ?? 0,
    });
  }

  return candidates.sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    return left.path.localeCompare(right.path);
  });
}

export async function fetchGitHubRepoSource(url: string): Promise<RepoSourceDocument> {
  const { owner, repo } = parseGitHubRepositoryUrl(url);
  const repoMetadata = await fetchRepoMetadata(owner, repo);
  const tree = await fetchRecursiveTree(owner, repo, repoMetadata.default_branch);
  const candidates = collectRepoCandidates(tree);

  if (candidates.length === 0) {
    throw new Error(`Could not find markdown docs or key manifests in ${owner}/${repo}.`);
  }

  const selectedCandidates = candidates.slice(0, MAX_REPO_TABS);
  const overviewFiles = chooseOverviewPaths(selectedCandidates);
  const fetchedEntries = await fetchSelectedFileContents(
    owner,
    repo,
    repoMetadata.default_branch,
    selectedCandidates,
  );

  const tabs = fetchedEntries.map(({ descriptor }) => ({
    ...descriptor,
    includedInOverview: overviewFiles.includes(descriptor.path),
  }));

  const contentCache = Object.fromEntries(
    fetchedEntries
      .filter((entry) => entry.content != null)
      .map((entry) => [entry.descriptor.path, entry.content as string]),
  );

  return {
    kind: "repo",
    label: repoMetadata.full_name,
    sourceUrl: url,
    fetchedAt: new Date().toISOString(),
    repo: {
      owner,
      repo,
      branch: repoMetadata.default_branch,
      sourceUrl: url,
    },
    overviewFiles,
    tabs,
    selectedTabId: "overview",
    contentCache,
    totalMatchedFiles: candidates.length,
    truncated: candidates.length > selectedCandidates.length,
  };
}
