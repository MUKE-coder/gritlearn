"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ResourceDefinition } from "@/lib/resource";
import { useResource, useDeleteResource, useBulkDeleteResource } from "@/hooks/use-resource";
import { PageHeader, type StatCard } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { TablePagination } from "@/components/tables/table-pagination";
import { TableFilters } from "@/components/tables/table-filters";

// Lazy-load modal/form components — they are only shown conditionally and
// would otherwise inflate the initial page bundle for every admin resource.
const FormModal = dynamic(() =>
  import("@/components/forms/form-modal").then((m) => m.FormModal)
);
const FormPage = dynamic(() =>
  import("@/components/forms/form-page").then((m) => m.FormPage)
);
const FormModalSteps = dynamic(() =>
  import("@/components/forms/form-modal-steps").then((m) => m.FormModalSteps)
);
const FormPageSteps = dynamic(() =>
  import("@/components/forms/form-page-steps").then((m) => m.FormPageSteps)
);
const ViewModal = dynamic(() =>
  import("@/components/resource/view-modal").then((m) => m.ViewModal)
);
const ConfirmModal = dynamic(() =>
  import("@/components/ui/confirm-modal").then((m) => m.ConfirmModal)
);

interface ResourcePageProps {
  resource: ResourceDefinition;
}

export function ResourcePage({ resource }: ResourcePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFormPage = resource.formView === "page" || resource.formView === "page-steps";
  const isSteps = resource.formView === "modal-steps" || resource.formView === "page-steps";
  const formAction = searchParams.get("action");

  // If formView is "page" or "page-steps" and we have an action param, show the form page
  if (isFormPage && (formAction === "create" || formAction === "edit")) {
    return isSteps ? <FormPageSteps resource={resource} /> : <FormPage resource={resource} />;
  }

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(resource.table.pageSize ?? 20);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(resource.table.defaultSort?.key ?? "");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    resource.table.defaultSort?.direction ?? "desc"
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

  // View modal state
  const [viewingItem, setViewingItem] = useState<Record<string, unknown> | null>(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  // Data fetching
  const { data, isLoading } = useResource(resource.endpoint, {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    filters,
  });

  const { mutate: deleteItem, isPending: isDeleting } = useDeleteResource(resource.endpoint);
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeleteResource(resource.endpoint);

  // Visible columns
  const visibleColumns = useMemo(
    () => resource.table.columns.filter((col) => !col.hidden && !hiddenColumns.includes(col.key)),
    [resource.table.columns, hiddenColumns]
  );

  // Handlers
  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(key);
        setSortOrder("asc");
      }
      setPage(1);
    },
    [sortBy]
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setPage(1);
  }, []);

  const handleView = useCallback((item: Record<string, unknown>) => {
    setViewingItem(item);
  }, []);

  const handleEdit = useCallback((item: Record<string, unknown>) => {
    if (isFormPage) {
      router.push(`/resources/${resource.slug}?action=edit&edit=${item.id}`);
    } else {
      setEditingItem(item);
      setFormOpen(true);
    }
  }, [isFormPage, router, resource.slug]);

  const handleCreate = useCallback(() => {
    if (isFormPage) {
      router.push(`/resources/${resource.slug}?action=create`);
    } else {
      setEditingItem(null);
      setFormOpen(true);
    }
  }, [isFormPage, router, resource.slug]);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deletingId !== null) {
      deleteItem(deletingId, {
        onSuccess: () => {
          setConfirmOpen(false);
          setDeletingId(null);
        },
      });
    }
  }, [deleteItem, deletingId]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.length > 0) {
      setBulkConfirmOpen(true);
    }
  }, [selectedRows]);

  const confirmBulkDelete = useCallback(() => {
    bulkDelete(selectedRows, {
      onSuccess: () => {
        setBulkConfirmOpen(false);
        setSelectedRows([]);
      },
    });
  }, [bulkDelete, selectedRows]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingItem(null);
  }, []);

  const actions = resource.table.actions ?? ["create", "view", "edit", "delete"];
  const singularName = resource.label?.singular ?? resource.name;
  const pluralName = resource.label?.plural ?? resource.slug;

  // Build stats cards: either from resource.stats.cards config, or auto-defaults.
  // Set resource.stats = false (or { enabled: false }) to disable stats on this page.
  const statsConfig = resource.stats;
  const statsEnabled =
    statsConfig === undefined ||
    statsConfig === true ||
    (typeof statsConfig === "object" && statsConfig !== null && statsConfig.enabled !== false);

  const statsCards: StatCard[] | undefined = useMemo(() => {
    if (!statsEnabled) return undefined;
    // Explicit cards override auto-defaults
    if (
      typeof statsConfig === "object" &&
      statsConfig !== null &&
      Array.isArray(statsConfig.cards) &&
      statsConfig.cards.length > 0
    ) {
      return statsConfig.cards;
    }
    // Auto-defaults: 4 cards based on the resource endpoint
    const ep = resource.endpoint;
    return [
      { label: "Total", endpoint: `${ep}?page_size=1`, field: "meta.total", icon: resource.icon || "Package" },
      { label: "This Week", endpoint: `${ep}?page_size=1&created_since=7d`, field: "meta.total", icon: "TrendingUp", color: "success" },
      { label: "This Month", endpoint: `${ep}?page_size=1&created_since=30d`, field: "meta.total", icon: "Calendar", color: "info" },
      { label: "Updated Recently", endpoint: `${ep}?page_size=1&updated_since=7d`, field: "meta.total", icon: "RefreshCw" },
    ];
  }, [statsEnabled, statsConfig, resource.endpoint, resource.icon]);

  const headerActions = actions.includes("create") ? (
    <button
      onClick={handleCreate}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 h-9 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
    >
      <span className="text-base leading-none">+</span>
      New {singularName}
    </button>
  ) : undefined;

  return (
    <div>
      <PageHeader
        title={pluralName}
        description={`Manage ${pluralName.toLowerCase()}`}
        actions={headerActions}
        stats={statsCards}
      />

      <div className="rounded-xl border border-border bg-bg-secondary">
        <TableToolbar
          resource={resource}
          search={search}
          onSearch={handleSearch}
          selectedCount={selectedRows.length}
          onBulkDelete={handleBulkDelete}
          onCreate={actions.includes("create") ? handleCreate : undefined}
          allColumns={resource.table.columns}
          hiddenColumns={hiddenColumns}
          onToggleColumn={(key) =>
            setHiddenColumns((prev) =>
              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
            )
          }
          data={data?.data}
        />

        {resource.table.filters && resource.table.filters.length > 0 && (
          <TableFilters
            filters={resource.table.filters}
            values={filters}
            onChange={handleFilter}
          />
        )}

        <DataTable
          columns={visibleColumns}
          data={data?.data ?? []}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectedRows={selectedRows}
          onSelectRows={setSelectedRows}
          onView={actions.includes("view") ? handleView : undefined}
          onEdit={actions.includes("edit") ? handleEdit : undefined}
          onDelete={actions.includes("delete") ? handleDelete : undefined}
        />

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={data?.meta?.total ?? 0}
          totalPages={data?.meta?.pages ?? 1}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      {!isFormPage && formOpen && (
        isSteps ? (
          <FormModalSteps
            resource={resource}
            item={editingItem}
            onClose={handleFormClose}
          />
        ) : (
          <FormModal
            resource={resource}
            item={editingItem}
            onClose={handleFormClose}
          />
        )
      )}

      {viewingItem && (
        <ViewModal
          resource={resource}
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={actions.includes("edit") ? handleEdit : undefined}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null); }}
        title={`Delete ${singularName}`}
        description={`Are you sure you want to delete this ${singularName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />

      <ConfirmModal
        open={bulkConfirmOpen}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
        title={`Delete ${selectedRows.length} ${pluralName.toLowerCase()}`}
        description={`Are you sure you want to delete ${selectedRows.length} ${pluralName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete All"
        variant="danger"
        loading={isBulkDeleting}
      />
    </div>
  );
}
