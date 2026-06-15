import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ContentManifest {
  id: string;
  version: number;
  notes: string;
  bundle_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentManifestsResponse {
  data: ContentManifest[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

interface UseContentManifestsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useContentManifests({ page = 1, pageSize = 20, search = "", sortBy = "created_at", sortOrder = "desc" }: UseContentManifestsParams = {}) {
  return useQuery<ContentManifestsResponse>({
    queryKey: ["content_manifests", { page, pageSize, search, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (search) {
        params.set("search", search);
      }
      const { data } = await apiClient.get(`/api/content_manifests?${params}`);
      return data;
    },
  });
}

export function useGetContentManifest(id: string) {
  return useQuery<ContentManifest>({
    queryKey: ["content_manifests", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/content_manifests/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateContentManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await apiClient.post("/api/content_manifests", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_manifests"] });
    },
  });
}

export function useUpdateContentManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await apiClient.put(`/api/content_manifests/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_manifests"] });
    },
  });
}

export function useDeleteContentManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/content_manifests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_manifests"] });
    },
  });
}
