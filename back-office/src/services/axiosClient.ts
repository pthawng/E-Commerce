import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { buildApiUrl } from '@shared';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

type FailedRequest = {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
};

const axiosInstance: AxiosInstance = axios.create({
  // Do not set baseURL here so we can use buildApiUrl per-request
  withCredentials: true, // send cookies (refresh token cookie if used)
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getAccessToken();
    config.headers = config.headers || {};
    if (token) {
      (config.headers as Record<string, unknown>)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Only handle 401 for authenticated requests (not refresh endpoint itself)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().tokens?.refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const resp = await axios.post(buildApiUrl('/auth/refresh'), { refreshToken });
        const newTokens = resp.data.tokens;
        // Update store
        useAuthStore.getState().setTokens(newTokens);
        processQueue(null, newTokens.accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;


