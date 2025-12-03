/**
 * API Client for Back Office
 * Sử dụng shared config
 */
import type { ApiResponse, ApiError } from '@shared/types';
import { buildApiUrl } from '@shared/config';

/**
 * API GET
 */
export async function apiGet<T = any>(path: string): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  const res = await fetch(url);
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.message || 'API error');
  }
  return res.json();
}

/**
 * API POST
 */
export async function apiPost<T = any>(
  path: string,
  body?: any,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.message || 'API error');
  }
  return res.json();
}

/**
 * API PUT
 */
export async function apiPut<T = any>(
  path: string,
  body?: any,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.message || 'API error');
  }
  return res.json();
}

/**
 * API DELETE
 */
export async function apiDelete<T = any>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    method: 'DELETE',
    ...options,
  });
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.message || 'API error');
  }
  return res.json();
}

