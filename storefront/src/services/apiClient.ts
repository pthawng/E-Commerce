/**
 * API Client (axios)
 * Centralized axios instance with automatic refresh-token handling.
 */
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '@shared';
import { buildApiUrl } from '@shared';
import axiosInstance from './axiosClient';

export class ApiClientError extends Error {
  public statusCode: number;
  public errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function handleAxiosResponse<T>(promise: Promise<{ data: unknown }>): Promise<ApiResponse<T>> {
  try {
    const res = await promise;
    // Improved null checks for response and data
    if (!res || res.data === undefined || res.data === null) {
        throw new ApiClientError(500, 'Invalid response structure from server: data is missing or null');
    }
    return res.data as ApiResponse<T>;
  } catch (err) {
    // Silent handling for cancelled requests (Elite UX)
    if (axios.isCancel(err)) {
        // Return a promise that never resolves/rejects to stop the chain
        return new Promise(() => {});
    }

    if (err instanceof ApiClientError) throw err;
    
    const axiosError = err as { response?: { status: number; data?: unknown } };
    const status = axiosError.response?.status || 500;
    const data = axiosError.response?.data;
    if (status === 401) {
      throw new ApiClientError(401, 'Unauthorized - Please login again');
    }
    const apiError = (data || {}) as ApiError;
    throw new ApiClientError(status, apiError.message || 'An error occurred', apiError.errors);
  }
}

export async function apiGet<T = unknown>(endpoint: string, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  return handleAxiosResponse<T>(axiosInstance.get(url, options));
}

export async function apiPost<T = unknown>(endpoint: string, body?: unknown, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  return handleAxiosResponse<T>(axiosInstance.post(url, body, options));
}

export async function apiPut<T = unknown>(endpoint: string, body?: unknown, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  return handleAxiosResponse<T>(axiosInstance.put(url, body, options));
}

export async function apiPatch<T = unknown>(endpoint: string, body?: unknown, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  return handleAxiosResponse<T>(axiosInstance.patch(url, body, options));
}

export async function apiDelete<T = unknown>(endpoint: string, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  return handleAxiosResponse<T>(axiosInstance.delete(url, options));
}

export async function apiPostFormData<T = unknown>(endpoint: string, formData: FormData, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  const cfg = { headers: { 'Content-Type': 'multipart/form-data' }, ...options };
  return handleAxiosResponse<T>(axiosInstance.post(url, formData, cfg));
}

export async function apiPatchFormData<T = unknown>(endpoint: string, formData: FormData, options?: AxiosRequestConfig) {
  const url = buildApiUrl(endpoint);
  const cfg = { headers: { 'Content-Type': 'multipart/form-data' }, ...options };
  return handleAxiosResponse<T>(axiosInstance.patch(url, formData, cfg));
}
