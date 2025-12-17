import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/services/apiClient';
import { queryKeys } from '@/lib/query-keys';

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: Record<string, string>;
  metaValue?: string | null;
  order?: number | null;
}

export interface Attribute {
  id: string;
  code: string;
  name: Record<string, string>;
  filterType?: string | null;
  values?: AttributeValue[];
}

const ATTR_BASE = '/api/attributes';

export function useAttributes() {
  return useQuery({
    queryKey: queryKeys.attributes.list(),
    queryFn: async () => {
      const res = await apiGet<Attribute[]>(ATTR_BASE);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useAttribute(id?: string) {
  return useQuery({
    queryKey: queryKeys.attributes.detail(id || ''),
    queryFn: async () => {
      const res = await apiGet<Attribute>(`${ATTR_BASE}/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export interface AttributeValueWithAttribute extends AttributeValue {
  attribute: {
    id: string;
    code: string;
    name: Record<string, string>;
  };
}

export function useAllAttributeValues(search?: string) {
  return useQuery({
    queryKey: queryKeys.attributes.allValues(search),
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiGet<AttributeValueWithAttribute[]>(`${ATTR_BASE}/values/all${params}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}


