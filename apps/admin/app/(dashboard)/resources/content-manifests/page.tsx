"use client";

import { ResourcePage } from "@/components/resource/resource-page";
import { contentManifestResource } from "@/resources/content-manifests";

export default function ContentManifestsPage() {
  return <ResourcePage resource={contentManifestResource} />;
}
