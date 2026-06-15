import { defineResource } from "@/lib/resource";

export const contentManifestResource = defineResource({
  name: "ContentManifest",
  slug: "content-manifests",
  endpoint: "/api/content_manifests",
  icon: "Database",
  label: { singular: "ContentManifest", plural: "ContentManifests" },
  table: {
    columns: [
    { key: "id", label: "ID", sortable: true, width: "80px" },
    { key: "version", label: "Version", sortable: true },
    { key: "notes", label: "Notes", searchable: true },
    { key: "bundle_url", label: "Bundle U R L", sortable: true, searchable: true },
    { key: "published", label: "Published", format: "boolean" },
    { key: "created_at", label: "Created", sortable: true, format: "relative" },
    ],
    filters: [
    { key: "published", label: "Published", type: "boolean" },
    ],
    defaultSort: { key: "created_at", direction: "desc" },
    searchable: true,
    pageSize: 20,
  },
  form: {
    fields: [
    { key: "version", label: "Version", type: "number" },
    { key: "notes", label: "Notes", type: "textarea" },
    { key: "bundle_url", label: "Bundle U R L", type: "text", required: true },
    { key: "published", label: "Published", type: "toggle" },
    ],
  },
  dashboard: {
    widgets: [
      {
        type: "stat",
        label: "Total ContentManifests",
        endpoint: "/api/content_manifests",
        icon: "Database",
        color: "accent",
      },
    ],
  },
});
