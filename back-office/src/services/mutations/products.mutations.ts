/**
 * Products Mutations
 * TanStack Query mutation hooks cho product management
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiPost, apiPatch, apiDelete, apiPostFormData, apiPatchFormData } from '../apiClient';
import type { Product } from '@shared';
import { API_ENDPOINTS } from '@shared';

/**
 * Type cho create/update product với categoryIds
 */
type ProductCreateUpdateData = Partial<Product> & {
  categoryIds?: string[];
};

/**
 * Create product mutation (với upload ảnh)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      images,
    }: {
      data: ProductCreateUpdateData;
      images?: File[];
    }) => {
      // Nếu có ảnh, dùng FormData
      if (images && images.length > 0) {
        const formData = new FormData();

        // Thêm các field text
        if (data.name) formData.append('name', JSON.stringify(data.name));
        if (data.description) formData.append('description', JSON.stringify(data.description));
        if (data.slug) formData.append('slug', data.slug);
        if (data.categoryIds && Array.isArray(data.categoryIds)) {
          data.categoryIds.forEach((id: string) => {
            formData.append('categoryIds', id);
          });
        }
        if (data.hasVariants !== undefined) {
          formData.append('hasVariants', String(data.hasVariants));
        }
        if (data.isActive !== undefined) {
          formData.append('isActive', String(data.isActive));
        }
        if (data.isFeatured !== undefined) {
          formData.append('isFeatured', String(data.isFeatured));
        }

        // Thêm ảnh
        images.forEach((image) => {
          formData.append('images', image);
        });

        const response = await apiPostFormData<Product>(API_ENDPOINTS.PRODUCTS.BASE, formData);
        return response.data;
      } else {
        // Không có ảnh, dùng JSON bình thường
        const { categoryIds, ...restData } = data;
        const jsonData: Record<string, unknown> = { ...restData };
        if (categoryIds) {
          jsonData.categoryIds = categoryIds;
        }
        const response = await apiPost<Product>(API_ENDPOINTS.PRODUCTS.BASE, jsonData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Update product mutation (với upload thêm ảnh)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      images,
    }: {
      id: string;
      data: ProductCreateUpdateData;
      images?: File[];
    }) => {
      // Nếu có ảnh mới, dùng FormData
      if (images && images.length > 0) {
        const formData = new FormData();

        // Thêm các field text
        if (data.name) formData.append('name', JSON.stringify(data.name));
        if (data.description) formData.append('description', JSON.stringify(data.description));
        if (data.slug) formData.append('slug', data.slug);
        if (data.categoryIds && Array.isArray(data.categoryIds)) {
          data.categoryIds.forEach((id: string) => {
            formData.append('categoryIds', id);
          });
        }
        if (data.hasVariants !== undefined) {
          formData.append('hasVariants', String(data.hasVariants));
        }
        if (data.isActive !== undefined) {
          formData.append('isActive', String(data.isActive));
        }
        if (data.isFeatured !== undefined) {
          formData.append('isFeatured', String(data.isFeatured));
        }

        // Thêm ảnh mới
        images.forEach((image) => {
          formData.append('images', image);
        });

        const response = await apiPatchFormData<Product>(
          API_ENDPOINTS.PRODUCTS.BY_ID(id),
          formData,
        );
        return response.data;
      } else {
        // Không có ảnh mới, dùng JSON bình thường
        const { categoryIds, ...restData } = data;
        const jsonData: Record<string, unknown> = { ...restData };
        if (categoryIds) {
          jsonData.categoryIds = categoryIds;
        }
        const response = await apiPatch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), jsonData);
        return response.data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Delete product mutation
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete<void>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Upload media cho product
 */
export function useUploadProductMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      file,
      altText,
      isThumbnail,
      order,
    }: {
      productId: string;
      file: File;
      altText?: Record<string, string>;
      isThumbnail?: boolean;
      order?: number;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (altText) formData.append('altText', JSON.stringify(altText));
      if (isThumbnail !== undefined) formData.append('isThumbnail', String(isThumbnail));
      if (order !== undefined) formData.append('order', String(order));

      const response = await apiPostFormData(
        `/products/${productId}/media`,
        formData,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Delete media của product
 */
export function useDeleteProductMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, mediaId }: { productId: string; mediaId: string }) => {
      const response = await apiDelete(`/products/${productId}/media/${mediaId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Set thumbnail cho product
 */
export function useSetProductThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, mediaId }: { productId: string; mediaId: string }) => {
      const response = await apiPatch(`/products/${productId}/media/${mediaId}/thumbnail`, {});
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

