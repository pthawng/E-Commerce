import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { handleApiError, showErrorOnce } from '@/shared/api/responseHandler';

// Interface for Queue Items
interface FailedRequest {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}

// State for Refresh Token Mechanism
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

// Create generic axios instance
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// console.log('Axios BaseURL:', baseURL);

const axiosClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request Interceptor
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle Global Errors
        handleApiError(error);

        // Skip 401 interception for Login endpoint
        if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/admin/auth/login')) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized (Token Expiry) & Refresh Token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // ... (existing queue logic)
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // ... (existing refresh attempt)
                throw new Error("Refresh token implementation pending backend");
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Logout user on refresh failure
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                showErrorOnce('Session expired. Please login again.');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
