/**
 * App Configuration Contract
 * Đảm bảo sự đồng nhất cấu hình giữa Backend và Frontend
 */

export interface AppConfig {
  /**
   * Môi trường hiện tại (development, production, test)
   */
  nodeEnv: 'development' | 'production' | 'test';

  /**
   * URL của Backend API
   */
  apiBaseUrl: string;

  /**
   * Cấu hình liên quan đến Client/Frontend
   */
  client: {
    url: string;
  };

  /**
   * Các hằng số cấu hình khác
   */
  features?: {
    enableRegistration: boolean;
    enableSocialLogin: boolean;
  };
}

/**
 * Helper để kiểm tra tính hợp lệ của config (Optional)
 */
export function validateAppConfig(config: AppConfig): boolean {
  return !!config.apiBaseUrl && !!config.client.url;
}
