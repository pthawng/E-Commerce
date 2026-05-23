import api from "@/shared/api/apiInstance";

type LocalizedText = Record<string, string>;

export interface VariantItem {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  weightGram?: number;
  variantTitle: LocalizedText | null;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  attributes?: Array<{
    attributeValueId: string;
    attributeValue: {
      id: string;
      value: LocalizedText;
      metaValue?: string;
      attribute: {
        id: string;
        code: string;
        name: LocalizedText;
      };
    };
  }>;
}

export interface CreateVariantPayload {
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  weightGram?: number;
  variantTitle?: LocalizedText;
  isDefault?: boolean;
  isActive?: boolean;
  position?: number;
  attributeValueIds?: string[];
  mediaIndexes?: number[];
}

export interface UpdateVariantPayload {
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  weightGram?: number;
  variantTitle?: LocalizedText;
  isDefault?: boolean;
  isActive?: boolean;
  position?: number;
}

export const variantApi = {
  getByProduct: (productId: string) =>
    api
      .get<VariantItem[]>(`/products/${productId}/variants`)
      .then((res) => res.data),

  getOne: (productId: string, variantId: string) =>
    api
      .get<VariantItem>(`/products/${productId}/variants/${variantId}`)
      .then((res) => res.data),

  create: (productId: string, data: CreateVariantPayload) =>
    api
      .post<VariantItem>(`/products/${productId}/variants`, data)
      .then((res) => res.data),

  update: (productId: string, variantId: string, data: UpdateVariantPayload) =>
    api
      .patch<VariantItem>(`/products/${productId}/variants/${variantId}`, data)
      .then((res) => res.data),

  delete: (productId: string, variantId: string) =>
    api
      .delete(`/products/${productId}/variants/${variantId}`)
      .then((res) => res.data),
};
