import { z } from "zod";

// Định nghĩa chung cho Đa ngôn ngữ (I18n Field)
export const I18nStringSchema = z.object({
  vi: z.string().trim().min(1, { message: "Tiếng Việt là bắt buộc" }),
  en: z.string().trim().min(1, { message: "Tiếng Anh là bắt buộc" }),
});

export const I18nStringOptionalSchema = z.object({
  vi: z.string().trim().optional(),
  en: z.string().trim().optional(),
});

// Variant Validation Schema
export const ProductVariantSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .max(100, { message: "SKU không được vượt quá 100 ký tự" })
      .optional(),
    price: z.number().min(1, { message: "Giá bán phải lớn hơn 0" }),
    compareAtPrice: z.number().min(0).optional(),
    costPrice: z
      .number()
      .min(0, { message: "Giá vốn không được âm" })
      .optional(),
    weightGram: z
      .number()
      .min(0, { message: "Khối lượng không được âm" })
      .optional(),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    attributeValueIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Giá bán không được nhỏ hơn giá vốn
    if (data.costPrice !== undefined && data.price < data.costPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Giá bán không được nhỏ hơn giá vốn",
        path: ["price"],
      });
    }
    // Giá gốc (Compare At) nên lớn hơn hoặc bằng giá bán
    if (
      data.compareAtPrice !== undefined &&
      data.compareAtPrice > 0 &&
      data.compareAtPrice < data.price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Giá gốc không nên nhỏ hơn giá bán",
        path: ["compareAtPrice"],
      });
    }
  });

// Schema tổng cho việc tạo Sản phẩm (FAANG L8 Standard)
export const CreateProductSchema = z
  .object({
    name: I18nStringSchema,
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "Slug chỉ chứa chữ thường, số và gạch ngang",
      })
      .optional()
      .or(z.literal("")), // Cho phép rỗng
    description: I18nStringOptionalSchema.optional(),
    categoryIds: z.array(z.string()).optional(),
    hasVariants: z.boolean().default(true),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),

    // Các field dùng khi KHÔNG CÓ Variants
    basePrice: z
      .number()
      .min(1, { message: "Giá bán phải lớn hơn 0" })
      .optional(),
    baseCompareAtPrice: z.number().min(0).optional(),
    baseCostPrice: z
      .number()
      .min(0, { message: "Giá vốn không được âm" })
      .optional(),
    baseWeightGram: z
      .number()
      .min(0, { message: "Khối lượng không được âm" })
      .optional(),
    baseAttributeValueIds: z.array(z.string()).optional(),

    // Các field dùng khi CÓ Variants
    variants: z.array(ProductVariantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Ràng buộc logic FAANG L8:
    // 1. Nếu hasVariants = true, BẮT BUỘC phải có ít nhất 1 variant.
    if (data.hasVariants) {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Cần ít nhất 1 biến thể (Variant) khi bật chế độ có biến thể",
          path: ["variants", "root"],
        });
      }
    }
    // 2. Nếu hasVariants = false, BẮT BUỘC phải nhập Base Price
    else {
      if (!data.basePrice || data.basePrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giá cơ bản là bắt buộc đối với sản phẩm đơn giản",
          path: ["basePrice"],
        });
      }
      if (
        data.baseCostPrice &&
        data.basePrice &&
        data.basePrice < data.baseCostPrice
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giá bán không được nhỏ hơn giá vốn",
          path: ["basePrice"],
        });
      }
      if (
        data.baseCompareAtPrice &&
        data.basePrice &&
        data.baseCompareAtPrice > 0 &&
        data.baseCompareAtPrice < data.basePrice
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giá gốc không nên nhỏ hơn giá bán",
          path: ["baseCompareAtPrice"],
        });
      }
    }
  });

// Infer Type từ Zod Schema để dùng cho TypeScript
export type CreateProductFormValues = z.infer<typeof CreateProductSchema>;
