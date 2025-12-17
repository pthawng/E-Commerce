import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiPatch, apiPost } from '@/services/apiClient';
import { queryKeys } from '@/lib/query-keys';
import type { Attribute, AttributeValue } from './queries';

const ATTR_BASE = '/api/attributes';

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Attribute>) => {
      const res = await apiPost<Attribute>(ATTR_BASE, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attributes.list() });
    },
  });
}

export function useUpdateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Attribute> }) => {
      const res = await apiPatch<Attribute>(`${ATTR_BASE}/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.attributes.list() });
      qc.invalidateQueries({ queryKey: queryKeys.attributes.detail(id) });
    },
  });
}

export function useDeleteAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete(`${ATTR_BASE}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attributes.list() });
    },
  });
}

export function useCreateAttributeValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      attributeId,
      data,
    }: {
      attributeId: string;
      data: Partial<AttributeValue>;
    }) => {
      const res = await apiPost<AttributeValue>(`${ATTR_BASE}/${attributeId}/values`, data);
      return res.data;
    },
    onSuccess: (_data, { attributeId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.attributes.list() });
      qc.invalidateQueries({ queryKey: queryKeys.attributes.detail(attributeId) });
    },
  });
}

export function useUpdateAttributeValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      attributeId,
      valueId,
      data,
    }: {
      attributeId: string;
      valueId: string;
      data: Partial<AttributeValue>;
    }) => {
      const res = await apiPatch<AttributeValue>(
        `${ATTR_BASE}/${attributeId}/values/${valueId}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_data, { attributeId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.attributes.list() });
      qc.invalidateQueries({ queryKey: queryKeys.attributes.detail(attributeId) });
    },
  });
}

export function useDeleteAttributeValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attributeId, valueId }: { attributeId: string; valueId: string }) => {
      const res = await apiDelete(`${ATTR_BASE}/${attributeId}/values/${valueId}`);
      return res.data;
    },
    onSuccess: (_data, { attributeId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.attributes.list() });
      qc.invalidateQueries({ queryKey: queryKeys.attributes.detail(attributeId) });
    },
  });
}


