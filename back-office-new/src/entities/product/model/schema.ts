import { z } from 'zod';

// Support for multilingual JSON fields as defined in shared/BE
// Using z.custom as an escape hatch for Zod v4 compatibility in this environment
const multilingualSchema = z.custom<Record<string, string>>(
    (val) => typeof val === 'object' && val !== null && Object.keys(val).length > 0,
    { message: 'At least one language version is required' }
);

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
});

export type CreateProductDTO = z.infer<typeof productSchema>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
