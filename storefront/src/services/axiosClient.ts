import axios from 'axios';
import axiosRetry, { isNetworkOrIdempotentRequestError, exponentialDelay } from 'axios-retry';
import type { AxiosInstance, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '@shared';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';


type FailedRequest = {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const axiosInstance: AxiosInstance = axios.create({
  withCredentials: true,
  timeout: 15000, // 15s absolute timeout for Luxury perception
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure Axios Retry (Exponential Backoff)
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx idempotent requests
    return isNetworkOrIdempotentRequestError(error) || error.response?.status === 503;
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.warn(`[AxiosRetry] Retry attempt #${retryCount} for ${requestConfig.url}`);
  }
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // CSRF Protection: Inject x-csrf-token header for mutations
    const csrfToken = getCookie('csrfToken');
    if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
      (config.headers as Record<string, unknown>)['x-csrf-token'] = csrfToken;
    }

    // Order Access Token: For guest success pages
    const orderAccessToken = sessionStorage.getItem('orderAccessToken');
    if (orderAccessToken && config.url?.includes('/api/') && (config.url?.includes('/orders/') || config.url?.includes('/payment/'))) {
      (config.headers as Record<string, unknown>)['x-order-access-token'] = orderAccessToken;
    }

    // Full-Stack Observability: Inject Correlation ID & W3C Trace Context
    const correlationId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
    (config.headers as Record<string, unknown>)['x-correlation-id'] = correlationId;
    
    // Minimal W3C traceparent mock (00-traceId-spanId-01) for APM correlation
    const traceId = correlationId.replace(/-/g, '').padEnd(32, '0');
    const spanId = Math.random().toString(16).substring(2, 18).padEnd(16, '0');
    (config.headers as Record<string, unknown>)['traceparent'] = `00-${traceId}-${spanId}-01`;

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Handle 401 Unauthorized - trigger session refresh
    if (status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error); // Don't retry the refresh itself
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // In session-based auth, we just call the refresh endpoint. 
        // Cookies are sent/received automatically via withCredentials.
        await axiosInstance.post(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH));

        processQueue(null);

        // Refresh done. Retry the original request.
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Clear local auth state on total session failure
        useAuthStore.getState().clearAuth();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Surface business error codes for UI mapping
    if (error.response?.data?.code) {
      error.code = error.response.data.code;
    }

    return Promise.reject(error);
  },
);


export default axiosInstance;


