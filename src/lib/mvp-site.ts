import type { MvpSiteArtifact, MvpSiteSpec } from "@/lib/types";

export const MVP_ARTIFACT_STORAGE_PREFIX = "origami-mvp-artifact:";

export function buildMvpArtifactHref(artifactId: string) {
  return `/workspace/mvp/${encodeURIComponent(artifactId)}`;
}

export function getMvpArtifactStorageKey(artifactId: string) {
  return `${MVP_ARTIFACT_STORAGE_PREFIX}${artifactId}`;
}

export function persistMvpArtifact(artifact: MvpSiteArtifact) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getMvpArtifactStorageKey(artifact.id),
    JSON.stringify(normalizeMvpArtifact(artifact)),
  );
}

export function normalizeMvpArtifact(
  artifact: Omit<MvpSiteArtifact, "sourceBrief" | "customizationHistory"> &
    Partial<Pick<MvpSiteArtifact, "sourceBrief" | "customizationHistory">>,
): MvpSiteArtifact {
  return {
    ...artifact,
    sourceBrief:
      artifact.sourceBrief?.trim() ||
      [`Source kind: ${artifact.sourceKind}`, `Source label: ${artifact.sourceLabel}`, "", artifact.summary]
        .filter(Boolean)
        .join("\n"),
    customizationHistory: artifact.customizationHistory ?? [],
  };
}

export function readMvpArtifact(artifactId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const payload = window.localStorage.getItem(getMvpArtifactStorageKey(artifactId));
  if (!payload) {
    return null;
  }

  try {
    return normalizeMvpArtifact(JSON.parse(payload) as MvpSiteArtifact);
  } catch {
    return null;
  }
}

function serialize(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function synthesizeMvpSiteCode(input: {
  appTitle: string;
  summary: string;
  siteSpec: MvpSiteSpec;
}) {
  return `const appTitle = ${serialize(input.appTitle)};
const summary = ${serialize(input.summary)};
const site = ${serialize(input.siteSpec)} as const;

export default function GeneratedMvpPage() {
  return (
    <main className="min-h-screen bg-[#f6efe4] text-[#1f2933]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(215,117,61,0.20),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(20,52,43,0.16),_transparent_38%),linear-gradient(180deg,_#fff8ef_0%,_#f6efe4_58%,_#efe4d0_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[#1f2933]/10" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 py-10 lg:px-10 lg:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[#1f2933]/66">
            <div className="rounded-full border border-[#1f2933]/12 bg-white/70 px-4 py-2">
              {appTitle}
            </div>
            <div className="max-w-xl text-right leading-6">{summary}</div>
          </div>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d7753d]">
                {site.hero.eyebrow}
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-[#10242c] md:text-7xl">
                {site.hero.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#1f2933]/72">
                {site.hero.subheadline}
              </p>
            </div>

            <div className="rounded-[28px] border border-[#1f2933]/10 bg-white/72 p-6 shadow-[0_30px_80px_rgba(31,41,51,0.08)] backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1f2933]/42">
                Stat rail
              </div>
              <div className="mt-5 space-y-4">
                {site.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[#1f2933]/8 bg-[#fffaf2] px-4 py-4"
                  >
                    <div className="text-xs uppercase tracking-[0.22em] text-[#1f2933]/42">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#10242c]">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#1f2933]/64">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {site.featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] border border-[#1f2933]/8 bg-[#10242c] p-6 text-[#f5f1e8] shadow-[0_24px_60px_rgba(16,36,44,0.16)]"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f5f1e8]/44">
                  Feature
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#f5f1e8]/72">{card.description}</p>
                <div className="mt-6 space-y-3">
                  {card.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-[#f5f1e8]/84"
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-[32px] border border-[#1f2933]/8 bg-[#fffaf2] p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d7753d]">
                  Workflow
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#10242c]">
                  {site.workflow.title}
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {site.workflow.steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[24px] border border-[#1f2933]/8 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(31,41,51,0.06)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d7753d] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#10242c]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#1f2933]/68">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[32px] border border-[#1f2933]/8 bg-white p-6 md:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d7753d]">
                Highlights
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#10242c]">
                {site.contentHighlights.title}
              </h2>
              <div className="mt-8 grid gap-4">
                {site.contentHighlights.items.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[24px] border border-[#1f2933]/8 bg-[#f7f1e8] px-5 py-5"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#1f2933]/42">
                      {item.eyebrow}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#10242c]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#1f2933]/70">{item.summary}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[32px] border border-[#1f2933]/8 bg-[#14342b] p-6 text-[#f4efe4] shadow-[0_24px_70px_rgba(20,52,43,0.18)]">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#f4efe4]/48">
                Source proof
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {site.sourceProof.title}
              </h2>
              <div className="mt-6 space-y-4">
                {site.sourceProof.items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-5"
                  >
                    <div className="text-xs uppercase tracking-[0.22em] text-[#f4efe4]/46">
                      {item.label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                      {item.value}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#f4efe4]/74">{item.detail}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="rounded-[36px] border border-[#1f2933]/8 bg-[#10242c] px-6 py-8 text-[#f7f1e8] md:px-10 md:py-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#f7f1e8]/48">
                  Launch
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {site.cta.title}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#f7f1e8]/74">
                  {site.cta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[#d7753d] px-5 py-3 text-sm font-semibold text-white"
                  type="button"
                >
                  {site.cta.primaryLabel}
                </button>
                <button
                  className="rounded-full border border-white/14 bg-white/6 px-5 py-3 text-sm font-semibold text-[#f7f1e8]"
                  type="button"
                >
                  {site.cta.secondaryLabel}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
`;
}
