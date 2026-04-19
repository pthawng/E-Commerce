/**
 * Shared Package Entry Point
 * Export tất cả để dùng chung giữa BE và FE
 */

export * from './enums';
export * from './types';
export * from './utils';
export * from './constants';
export * from './validation';

// Explicitly export config utilities for L8 Build Reliability
export {
    API_ENDPOINTS,
    API_BASE_URL,
    buildApiUrl,
    getApiBaseUrl,
    configureApiBaseUrl,
    resolveAppConfig
} from './config';
