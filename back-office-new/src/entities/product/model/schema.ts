import { z } from 'zod';

// Support for strict multilingual JSON fields (vi/en)
const multilingualSchema = z.object({
    vi: z.string().min(1, 'Tiếng Việt là bắt buộc'),
    en: z.string().min(1, 'English is required'),
});

export const productVariantSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    price: z.number().min(0, 'Price must be positive'),
    compareAtPrice: z.number().optional(),
    costPrice: z.number().optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    isActive: z.boolean().default(true),
    position: z.number().int().default(0),
});

export const productSchema = z.object({
    name: multilingualSchema,
    description: multilingualSchema.optional(),
    slug: z.string().min(1, 'Slug is required'),
    categoryId: z.string().optional(),
    isActive: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    hasVariants: z.boolean().default(false),
    variants: z.array(productVariantSchema).optional(),
    media: z.array(z.object({
        url: z.string().url(),
        isThumbnail: z.boolean().default(false),
        order: z.number().default(0),
    })).optional(),
});

export type CreateProductDTO = z.infer<typeof productSchema>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
