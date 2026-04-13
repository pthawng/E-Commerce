import { SeedScript } from './utils/history';
import { v1_rbac } from './versions/v1_rbac';
import { v2_logistics } from './versions/v2_logistics';
import { v3_catalog_foundation } from './versions/v3_catalog_foundation';
import { v4_initial_admin } from './versions/v4_initial_admin';

/**
 * SYSTEM_REGISTRY
 * Add your versioned seeds here in order.
 */
export const SYSTEM_REGISTRY: SeedScript[] = [
  v1_rbac,
  v2_logistics,
  v3_catalog_foundation,
  v4_initial_admin,
];
