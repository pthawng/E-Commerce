/**
 * Back Office Config
 * Re-export và extend từ shared config
 */
import { API_BASE_URL, buildApiUrl, API_ENDPOINTS } from '@shared/config';

// Alias for convenience
export const API_URL = API_BASE_URL;

// Helper to build full API URLs
export { buildApiUrl };

