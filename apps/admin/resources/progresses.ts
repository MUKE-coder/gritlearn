import { defineResource } from "@/lib/resource";

export const progressResource = defineResource({
  name: "Progress",
  slug: "progresses",
  endpoint: "/api/progresses",
  icon: "Database",
  label: { singular: "Progress", plural: "Progresses" },
  table: {
    columns: [
    { key: "id", label: "ID", sortable: true, width: "80px" },
    { key: "user.name", label: "User" },
    { key: "concept_slug", label: "Concept Slug", sortable: true, searchable: true },
    { key: "status", label: "Status", sortable: true, searchable: true },
    { key: "completed_at", label: "Completed At", sortable: true, format: "relative" },
    { key: "synced_at", label: "Synced At", sortable: true, format: "relative" },
    { key: "created_at", label: "Created", sortable: true, format: "relative" },
    ],
    filters: [
    ],
    defaultSort: { key: "created_at", direction: "desc" },
    searchable: true,
    pageSize: 20,
  },
  form: {
    fields: [
    { key: "user_id", label: "User", type: "relationship-select", required: true, relatedEndpoint: "/api/users", displayField: "name" },
    { key: "concept_slug", label: "Concept Slug", type: "text", required: true },
    { key: "status", label: "Status", type: "text", required: true },
    { key: "completed_at", label: "Completed At", type: "datetime" },
    { key: "synced_at", label: "Synced At", type: "datetime" },
    ],
  },
  dashboard: {
    widgets: [
      {
        type: "stat",
        label: "Total Progresses",
        endpoint: "/api/progresses",
        icon: "Database",
        color: "accent",
      },
    ],
  },
});
