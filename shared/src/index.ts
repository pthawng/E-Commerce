/**
 * Shared Package Entry Point
 * Exports all modules to be shared between backend and frontend
 */

export * from './enums';
export * from './types';
export * from './utils';
export * from './constants';
export * from './contracts';
export * from './validation';

// Explicitly export configuration utilities
export {
    API_ENDPOINTS,
    API_BASE_URL,
    buildApiUrl,
    getApiBaseUrl,
    configureApiBaseUrl,
    resolveAppConfig
} from './config';
