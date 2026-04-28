import api from '@/shared/api/apiInstance';

// ============================================
// ATTRIBUTE TYPES
// ============================================

export type AttributeFilterType = 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'swatch_color' | 'swatch_image';

export interface AttributeItem {
    id: string;
    code: string;
    name: Record<string, string>;
    filterType: AttributeFilterType;
    values: AttributeValueItem[];
}

export interface AttributeValueItem {
    id: string;
    attributeId: string;
    value: Record<string, string>;
    metaValue?: string | null;
    order: number;
}

export interface CreateAttributePayload {
    code: string;
    name: Record<string, string>;
    filterType?: AttributeFilterType;
    values?: Array<{
        value: Record<string, string>;
        metaValue?: string;
        order?: number;
    }>;
}

export interface UpdateAttributePayload {
    code?: string;
    name?: Record<string, string>;
    filterType?: AttributeFilterType;
    values?: Array<{
        id?: string;
        value?: Record<string, string>;
        metaValue?: string;
        order?: number;
    }>;
}

export interface CreateAttributeValuePayload {
    value: Record<string, string>;
    metaValue?: string;
    order?: number;
}

export interface UpdateAttributeValuePayload {
    value?: Record<string, string>;
    metaValue?: string;
    order?: number;
}

// ============================================
// DOMAIN SEED — Jewelry-specific attributes
// ============================================

export const JEWELRY_ATTRIBUTE_SEED: CreateAttributePayload[] = [
    {
        code: 'material_type',
        name: { vi: 'Chất liệu', en: 'Material Type' },
        filterType: 'select',
        values: [
            { value: { vi: 'Vàng 18K', en: 'Gold 18K' }, metaValue: '18K' },
            { value: { vi: 'Vàng 24K', en: 'Gold 24K' }, metaValue: '24K' },
            { value: { vi: 'Bạch Kim', en: 'Platinum' }, metaValue: 'PT950' },
            { value: { vi: 'Bạc 925', en: 'Silver 925' }, metaValue: 'AG925' },
            { value: { vi: 'Vàng hồng 18K', en: 'Rose Gold 18K' }, metaValue: 'RG18K' },
        ],
    },
    {
        code: 'stone_type',
        name: { vi: 'Loại đá', en: 'Stone Type' },
        filterType: 'select',
        values: [
            { value: { vi: 'Kim cương', en: 'Diamond' }, metaValue: 'DIAMOND' },
            { value: { vi: 'Ruby', en: 'Ruby' }, metaValue: 'RUBY' },
            { value: { vi: 'Sapphire', en: 'Sapphire' }, metaValue: 'SAPPHIRE' },
            { value: { vi: 'Emerald', en: 'Emerald' }, metaValue: 'EMERALD' },
            { value: { vi: 'Không có', en: 'None' }, metaValue: 'NONE' },
        ],
    },
    {
        code: 'stone_clarity',
        name: { vi: 'Độ trong suốt', en: 'Clarity Grade' },
        filterType: 'select',
        values: [
            { value: { vi: 'IF (Flawless)', en: 'IF (Flawless)' }, metaValue: 'IF' },
            { value: { vi: 'VVS1', en: 'VVS1' }, metaValue: 'VVS1' },
            { value: { vi: 'VVS2', en: 'VVS2' }, metaValue: 'VVS2' },
            { value: { vi: 'VS1', en: 'VS1' }, metaValue: 'VS1' },
            { value: { vi: 'VS2', en: 'VS2' }, metaValue: 'VS2' },
            { value: { vi: 'SI1', en: 'SI1' }, metaValue: 'SI1' },
        ],
    },
    {
        code: 'stone_cut',
        name: { vi: 'Chế tác đá', en: 'Cut Grade' },
        filterType: 'select',
        values: [
            { value: { vi: 'Xuất sắc', en: 'Excellent' }, metaValue: 'EXCELLENT' },
            { value: { vi: 'Rất tốt', en: 'Very Good' }, metaValue: 'VERY_GOOD' },
            { value: { vi: 'Tốt', en: 'Good' }, metaValue: 'GOOD' },
            { value: { vi: 'Khá', en: 'Fair' }, metaValue: 'FAIR' },
        ],
    },
    {
        code: 'certification',
        name: { vi: 'Chứng nhận', en: 'Certification' },
        filterType: 'select',
        values: [
            { value: { vi: 'GIA', en: 'GIA' }, metaValue: 'GIA' },
            { value: { vi: 'IGI', en: 'IGI' }, metaValue: 'IGI' },
            { value: { vi: 'AGS', en: 'AGS' }, metaValue: 'AGS' },
            { value: { vi: 'Không có', en: 'None' }, metaValue: 'NONE' },
        ],
    },
    {
        code: 'ring_size',
        name: { vi: 'Size nhẫn', en: 'Ring Size' },
        filterType: 'select',
        values: Array.from({ length: 13 }, (_, i) => ({
            value: { vi: `Size ${i + 5}`, en: `Size ${i + 5}` },
            metaValue: String(i + 5),
            order: i,
        })),
    },
];

// ============================================
// API METHODS
// ============================================

export const attributeApi = {
    getAll: () => api.get<AttributeItem[]>('/admin/attributes').then(res => res.data),

    getById: (id: string) => api.get<AttributeItem>(`/admin/attributes/${id}`).then(res => res.data),

    create: (data: CreateAttributePayload) => api.post<AttributeItem>('/admin/attributes', data).then(res => res.data),

    update: (id: string, data: UpdateAttributePayload) =>
        api.patch<AttributeItem>(`/admin/attributes/${id}`, data).then(res => res.data),

    delete: (id: string) => api.delete(`/admin/attributes/${id}`).then(res => res.data),

    // Value CRUD
    getValues: (attributeId: string) =>
        api.get<AttributeValueItem[]>(`/admin/attributes/${attributeId}/values`).then(res => res.data),

    createValue: (attributeId: string, data: CreateAttributeValuePayload) =>
        api.post<AttributeValueItem>(`/admin/attributes/${attributeId}/values`, data).then(res => res.data),

    updateValue: (attributeId: string, valueId: string, data: UpdateAttributeValuePayload) =>
        api.patch<AttributeValueItem>(`/admin/attributes/${attributeId}/values/${valueId}`, data).then(res => res.data),

    deleteValue: (attributeId: string, valueId: string) =>
        api.delete(`/admin/attributes/${attributeId}/values/${valueId}`).then(res => res.data),

    // Domain seed utility
    seedJewelryAttributes: async () => {
        const existing = await attributeApi.getAll();
        const existingCodes = new Set(existing.map(a => a.code));
        const results: AttributeItem[] = [];

        for (const seed of JEWELRY_ATTRIBUTE_SEED) {
            if (!existingCodes.has(seed.code)) {
                const created = await attributeApi.create(seed);
                results.push(created);
            }
        }
        return results;
    },
};
