// ─── Attribute + Value Types ──────────────────────────────────────────────────

export type AttributeInputType = 'TEXT' | 'SELECT' | 'COLOR' | 'BOOLEAN';

export interface AttributeValue {
    id: string;
    attributeId: string;
    value: Record<string, string>;
    metaValue: string | null;
    order: number;
}

export interface Attribute {
    id: string;
    code: string;
    name: Record<string, string>;
    filterType: AttributeInputType | null;
    values: AttributeValue[];
    createdAt: string;
}

export interface CreateAttributeDTO {
    code: string;
    name: Record<string, string>;
    filterType?: AttributeInputType;
    values?: CreateAttributeValueDTO[];
}

export type UpdateAttributeDTO = Partial<Omit<CreateAttributeDTO, 'values'>>;

export interface CreateAttributeValueDTO {
    value: Record<string, string>;
    metaValue?: string;
    order?: number;
}

export type UpdateAttributeValueDTO = Partial<CreateAttributeValueDTO>;
