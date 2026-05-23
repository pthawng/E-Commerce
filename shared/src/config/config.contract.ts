/**
 * App Configuration Contract
 * Ensures configuration alignment between backend and frontend
 */

export interface AppConfig {
  /**
   * Current environment (development, production, test)
   */
  nodeEnv: 'development' | 'production' | 'test';

  /**
   * URL of the backend API
   */
  apiBaseUrl: string;

  /**
   * Client/Frontend specific configurations
   */
  client: {
    url: string;
  };

  /**
   * Other configuration constants
   */
  features?: {
    enableRegistration: boolean;
    enableSocialLogin: boolean;
  };
}

/**
 * Helper to validate configuration (Optional)
 */
export function validateAppConfig(config: AppConfig): boolean {
  return !!config.apiBaseUrl && !!config.client.url;
}
