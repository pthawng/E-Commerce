import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';

@Injectable()
export class ResilientHttpClient {
  private readonly logger = new Logger(ResilientHttpClient.name);
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 10000, // 10s default timeout (Principal-grade safety)
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: (retryCount) => {
        this.logger.warn(`Retry attempt ${retryCount}...`);
        return exponentialDelay(retryCount);
      },
      retryCondition: (error) => {
        // Retry on network errors or 5xx
        return isNetworkOrIdempotentRequestError(error) || (error.response?.status ?? 0) >= 500;
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.error(
          `Retrying request to ${requestConfig.url} due to error: ${error.message} (Attempt ${retryCount})`,
        );
      },
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}
