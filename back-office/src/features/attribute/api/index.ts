import axiosClient from '@/shared/api/axiosClient';
import type { ApiResponse } from '@ecommerce/shared';
import type {
    Attribute, AttributeValue,
    CreateAttributeDTO, UpdateAttributeDTO,
    CreateAttributeValueDTO, UpdateAttributeValueDTO,
} from '../types';

function unwrap<T>(envelope: unknown): T {
    return (envelope as ApiResponse<T>).data as T;
}

export const attributeApi = {
    /** GET /attributes → Attribute[] (includes values) */
    getAll: async (): Promise<Attribute[]> => {
        const env = await axiosClient.get('/attributes');
        return unwrap<Attribute[]>(env);
    },

    /** GET /attributes/:id */
    getOne: async (id: string): Promise<Attribute> => {
        const env = await axiosClient.get(`/attributes/${id}`);
        return unwrap<Attribute>(env);
    },

    /** POST /attributes */
    create: async (data: CreateAttributeDTO): Promise<Attribute> => {
        const env = await axiosClient.post('/attributes', data);
        return unwrap<Attribute>(env);
    },

    /** PATCH /attributes/:id */
    update: async ({ id, data }: { id: string; data: UpdateAttributeDTO }): Promise<Attribute> => {
        const env = await axiosClient.patch(`/attributes/${id}`, data);
        return unwrap<Attribute>(env);
    },

    /** DELETE /attributes/:id */
    remove: async (id: string): Promise<void> => {
        await axiosClient.delete(`/attributes/${id}`);
    },

    // ── Values ───────────────────────────────────────────────────────────────

    /** POST /attributes/:attributeId/values */
    createValue: async ({ attributeId, data }: { attributeId: string; data: CreateAttributeValueDTO }): Promise<AttributeValue> => {
        const env = await axiosClient.post(`/attributes/${attributeId}/values`, data);
        return unwrap<AttributeValue>(env);
    },

    /** PATCH /attributes/:attributeId/values/:valueId */
    updateValue: async ({ attributeId, valueId, data }: { attributeId: string; valueId: string; data: UpdateAttributeValueDTO }): Promise<AttributeValue> => {
        const env = await axiosClient.patch(`/attributes/${attributeId}/values/${valueId}`, data);
        return unwrap<AttributeValue>(env);
    },

    /** DELETE /attributes/:attributeId/values/:valueId */
    removeValue: async ({ attributeId, valueId }: { attributeId: string; valueId: string }): Promise<void> => {
        await axiosClient.delete(`/attributes/${attributeId}/values/${valueId}`);
    },
};
