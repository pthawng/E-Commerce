import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type { ApiResponse, ApiError } from '@ecommerce/shared';

// --- Constants & Types ---
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface FailedRequest {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}

// --- Auth State Management ---
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

/**
 * Centralized Axios Instance
 */
export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

/**
 * Request Interceptor: Attach JWT
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Unwrapping & Error Handling
 */
api.interceptors.response.use(
    (response) => {
        const result = response.data;
        
        // Handle pagination: If backend returns meta alongside data, 
        // we wrap it for PaginatedResponse compatibility.
        if (result?.meta && Array.isArray(result.data)) {
            return {
                items: result.data,
                meta: result.meta
            };
        }

        // Standard unwrapping for non-paginated or nested paginated responses
        const unwrapped = result?.data;
        return unwrapped === null ? undefined : unwrapped;
    },
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 1. Handle Network Errors & 500s
        if (!error.response) {
            void message.error('Network error. Please check your connection.');
            return Promise.reject(error);
        }

        if (error.response.status >= 500) {
            void message.error('Server error. Please try again later.');
            return Promise.reject(error);
        }

        // 2. Handle 401 Unauthorized (Token Expiry)
        if (error.response.status === 401 && !originalRequest._retry) {
            // Skip refresh for auth endpoints to avoid loops
            if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token available');

                // Internal axios call to avoid interceptors for refresh
                const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
                    `${BASE_URL}/auth/refresh`,
                    { refreshToken }
                );

                const newToken = data.data?.accessToken;
                if (!newToken) throw new Error('Invalid refresh response');

                localStorage.setItem('access_token', newToken);
                processQueue(null, newToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Clear auth and redirect
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                void message.warning('Session expired. Please login again.');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // 3. Handle Other Errors (403, 400, etc.)
        const backendMessage = error.response.data?.message;
        const finalMessage = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
        
        if (error.response.status !== 401) {
            void message.error(finalMessage || 'Something went wrong');
        }

        return Promise.reject(error);
    }
);
