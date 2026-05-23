import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../../features/auth/model/authStore";

let cachedCsrfToken: string | null = null;
const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const safeMethods = ["get", "head", "options"];
    if (!safeMethods.includes(config.method?.toLowerCase() || "")) {
      const csrfToken = cachedCsrfToken || getCookie("csrfToken");
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }

    config.headers["X-Client-Timestamp"] = Date.now().toString();
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const csrfToken = response.headers["x-csrf-token"];
    if (csrfToken) {
      cachedCsrfToken = csrfToken;
    }

    if (
      response.data &&
      response.data.success &&
      response.data.data !== undefined
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const { user, refreshToken, setAuth, clearAuth } = useAuthStore.getState();

    const isAuthRequest =
      originalRequest.url?.includes("auth/login") ||
      originalRequest.url?.includes("auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const payload = response.data?.data;
        const { user: refreshedUser, tokens } = payload || {};

        if (!tokens || !tokens.accessToken) {
          throw new Error("Incomplete token pair received from vault");
        }

        setAuth(refreshedUser || user, tokens.accessToken, tokens.refreshToken);
        processQueue(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);

        const refreshAxiosError = axios.isAxiosError(refreshError)
          ? refreshError
          : null;
        const errorPayload = refreshAxiosError?.response?.data as
          | { message?: string }
          | undefined;
        const errorMsg = errorPayload?.message || "";

        clearAuth();
        if (
          errorMsg.includes("COMPROMISE") ||
          errorMsg.includes("PANIC") ||
          refreshAxiosError?.response?.status === 403
        ) {
          window.location.href = "/login?reason=security_compromise";
        } else {
          window.location.href = "/login?reason=session_expired";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      const errorData = error.response.data as { code?: string };

      if (errorData.code === "REQUIRED_STEP_UP") {
        return Promise.reject({ ...error, isStepUp: true });
      }

      if (errorData.code === "GLOBAL_PANIC_REUSE_DETECTED") {
        clearAuth();
        window.location.href = "/login?reason=security_lockout";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
