import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Progress {
  id: string;
  user_id: string;
  user?: any;
  concept_slug: string;
  status: string;
  completed_at: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProgressesResponse {
  data: Progress[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
}

interface UseProgressesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useProgresses({ page = 1, pageSize = 20, search = "", sortBy = "created_at", sortOrder = "desc" }: UseProgressesParams = {}) {
  return useQuery<ProgressesResponse>({
    queryKey: ["progresses", { page, pageSize, search, sortBy, sortOrder }],
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
      const { data } = await api.get(`/api/progresses?${params}`);
      return data;
    },
  });
}

export function useGetProgress(id: string) {
  return useQuery<Progress>({
    queryKey: ["progresses", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/progresses/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post("/api/progresses", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresses"] });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/api/progresses/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresses"] });
    },
  });
}

export function useDeleteProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/progresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresses"] });
    },
  });
}
