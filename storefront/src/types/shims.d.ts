declare module 'dompurify' {
    const sanitize: (html: string, options?: any) => string;
    export default { sanitize };
}

declare module 'axios-retry' {
    import { AxiosInstance, AxiosStatic } from 'axios';
    export interface IAxiosRetryConfig {
        retries?: number;
        retryCondition?: (error: any) => boolean;
        retryDelay?: (retryCount: number, error: any) => number;
        onRetry?: (retryCount: number, error: any, requestConfig: any) => void;
    }
    const axiosRetry: (axios: AxiosInstance | AxiosStatic, config?: IAxiosRetryConfig) => void;
    export const exponentialDelay: (retryCount: number, error?: any) => number;
    export const isNetworkOrIdempotentRequestError: (error: any) => boolean;
    export default axiosRetry;
}

declare module 'react-helmet-async' {
    import * as React from 'react';
    export class Helmet extends React.Component<any, any> { }
    export class HelmetProvider extends React.Component<any, any> { }
}

declare module 'vite-plugin-pwa' {
    export function VitePWA(options?: any): any;
}
