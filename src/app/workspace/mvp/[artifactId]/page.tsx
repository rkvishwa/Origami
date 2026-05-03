import { MvpSiteArtifactPage } from "@/components/origami/mvp-site-artifact-page";

export default function WorkspaceMvpPage({
  params,
}: {
  params: { artifactId: string };
}) {
  return <MvpSiteArtifactPage artifactId={params.artifactId} />;
}
