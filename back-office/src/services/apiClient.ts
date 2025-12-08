/**
 * API Client
 * Base API client với authentication và error handling
 */
import type { ApiResponse, ApiError } from '@shared';
import { buildApiUrl } from '@shared';
import { useAuthStore } from '@/store/auth.store';

/**
 * Custom error class cho API errors
 */
export class ApiClientError extends Error {
  public statusCode: number;
  public errors?: unknown;

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';

    this.statusCode = statusCode;
    this.errors = errors;
  }
}


/**
 * Get auth headers
 */
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json().catch(() => ({}));

  // Handle 401 - Unauthorized (auto logout)
  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    // Redirect to login page if needed
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiClientError(401, 'Unauthorized - Please login again');
  }

  // Handle other errors
  if (!response.ok) {
    const error: ApiError = data as ApiError;
    throw new ApiClientError(
      response.status,
      error.message || 'An error occurred',
      error.errors,
    );
  }

  return data as ApiResponse<T>;
}

/**
 * API GET request
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * API POST request
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * API PUT request
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * API PATCH request
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * API DELETE request
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    ...options,
  });

  return handleResponse<T>(response);
}

