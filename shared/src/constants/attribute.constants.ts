/**
 * Attribute Constants
 * Enum-like values for AttributeInputType dùng chung BE/FE.
 *
 * NOTE:
 * - Phải luôn đồng bộ với enum AttributeInputType trong Prisma schema.
 * - Khi thay đổi enum ở Prisma, cập nhật lại list này rồi build lại shared.
 */
export const ATTRIBUTE_INPUT_TYPES = [
  'text',
  'textarea',
  'select',
  'multiselect',
  'boolean',
  'swatch_color',
  'swatch_image',
] as const;

export type AttributeInputType = (typeof ATTRIBUTE_INPUT_TYPES)[number];


