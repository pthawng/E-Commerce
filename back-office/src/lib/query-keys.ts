/**
 * Query Keys Factory
 * Centralized query keys để dễ quản lý và invalidate
 */

/**
 * Base query keys
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.products.details(), 'slug', slug] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.categories.details(), 'slug', slug] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    byCode: (code: string) => [...queryKeys.orders.details(), 'code', code] as const,
  },

  // Discounts
  discounts: {
    all: ['discounts'] as const,
    lists: () => [...queryKeys.discounts.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.discounts.lists(), filters] as const,
    details: () => [...queryKeys.discounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.discounts.details(), id] as const,
    byCode: (code: string) => [...queryKeys.discounts.details(), 'code', code] as const,
  },
} as const;

