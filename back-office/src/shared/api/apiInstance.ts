import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../../features/auth/model/authStore";

let cachedCsrfToken: string | null = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to extract cookie by name (Fallback if same-origin)
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

// -----------------------------------------------------------------------------
// REQUEST INTERCEPTOR: Principal Injection & Security Handshake
// -----------------------------------------------------------------------------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Double-Submit Cookie Pattern (CSRF Protection)
    // Inject x-csrf-token for mutating methods
    const safeMethods = ["get", "head", "options"];
    if (!safeMethods.includes(config.method?.toLowerCase() || "")) {
      const csrfToken = cachedCsrfToken || getCookie("csrfToken");
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }

    // Security Telemetry Headers
    config.headers["X-Client-Timestamp"] = Date.now().toString();

    // 🔍 Debug Trace
    console.log(
      `🚀 [API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );

    return config;
  },
  (error) => {
    console.error("❌ [API Request Error]", error);
    return Promise.reject(error);
  },
);

// -----------------------------------------------------------------------------
// RESPONSE INTERCEPTOR: Risk Response & Atomic Rotation
// -----------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    // 🛡️ CSRF Token Capture (Principal Grade)
    const csrfToken = response.headers["x-csrf-token"];
    if (csrfToken) {
      cachedCsrfToken = csrfToken;
    }

    // Automatically unwrap the standard ApiResponse envelope
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

    // 1. ATOMIC ROTATION HANDLING (401)
    const isAuthRequest =
      originalRequest.url?.includes("auth/login") ||
      originalRequest.url?.includes("auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {
            refreshToken,
          },
        );

        // Standard API Response envelope has 'data' field containing { user, tokens }
        const payload = response.data?.data;
        const { user: refreshedUser, tokens } = payload || {};

        if (!tokens || !tokens.accessToken) {
          throw new Error("Incomplete token pair received from vault");
        }

        setAuth(refreshedUser || user, tokens.accessToken, tokens.refreshToken);

        processQueue(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        console.log(
          "✅ [Auth Rotation] Silent refresh successful. Session extended.",
        );
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error(
          "❌ [Auth Rotation] Critical failure during token rotation:",
          refreshError,
        );
        processQueue(refreshError, null);

        // If refresh fails, it might be a TOKEN_REPLAY or EXPIRED
        const errorMsg = refreshError.response?.data?.message || "";
        if (
          errorMsg.includes("COMPROMISE") ||
          errorMsg.includes("PANIC") ||
          refreshError.response?.status === 403
        ) {
          console.warn(
            "🚨 [Security Audit] Possible compromise detected. Revoking local identity.",
          );
          clearAuth();
          window.location.href = "/login?reason=security_compromise";
        } else {
          clearAuth();
          window.location.href = "/login?reason=session_expired";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. CRITICAL ACTION PROTECTION (403 + STEP_UP)
    if (error.response?.status === 403) {
      const errorData = error.response.data as any;

      if (errorData.code === "REQUIRED_STEP_UP") {
        // This will be caught by the UI to show the StepUpAuthModal
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
