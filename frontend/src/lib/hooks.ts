import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";

export interface Paginated<T> {
  count: number;
  results: T[];
}

export function useList<T>(resource: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [resource, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<T>>(`/${resource}/`, { params });
      return data;
    },
  });
}

export function useDetail<T>(resource: string, id: string | undefined) {
  return useQuery({
    queryKey: [resource, "detail", id],
    enabled: !!id,
    queryFn: async () => (await api.get<T>(`/${resource}/${id}/`)).data,
  });
}

export function useCreate<T>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<T>) =>
      (await api.post<T>(`/${resource}/`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useUpdate<T>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<T> & { id: string }) =>
      (await api.patch<T>(`/${resource}/${id}/`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}

export function useDelete(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/${resource}/${id}/`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}

/** POST to a custom viewset action, e.g. leads/{id}/convert/. */
export function useAction<R = unknown>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; action: string; body?: unknown }) =>
      (await api.post<R>(`/${resource}/${args.id}/${args.action}/`, args.body ?? {}))
        .data,
    onSuccess: () => qc.invalidateQueries({ queryKey: [resource] }),
  });
}
