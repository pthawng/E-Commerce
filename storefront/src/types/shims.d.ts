declare module 'dompurify' {
    const sanitize: (html: string, options?: unknown) => string;
    export default { sanitize };
}

declare module 'axios-retry' {
    import { AxiosInstance, AxiosStatic } from 'axios';
    export interface IAxiosRetryConfig {
        retries?: number;
        retryCondition?: (error: unknown) => boolean;
        retryDelay?: (retryCount: number, error: unknown) => number;
        onRetry?: (retryCount: number, error: unknown, requestConfig: unknown) => void;
    }
    const axiosRetry: (axios: AxiosInstance | AxiosStatic, config?: IAxiosRetryConfig) => void;
    export const exponentialDelay: (retryCount: number, error?: unknown) => number;
    export const isNetworkOrIdempotentRequestError: (error: unknown) => boolean;
    export default axiosRetry;
}

declare module 'react-helmet-async' {
    import * as React from 'react';
    export class Helmet extends React.Component<Record<string, unknown>, Record<string, unknown>> { }
    export class HelmetProvider extends React.Component<Record<string, unknown>, Record<string, unknown>> { }
}

declare module 'vite-plugin-pwa' {
    export function VitePWA(options?: unknown): unknown;
}
