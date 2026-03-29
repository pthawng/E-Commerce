import { apiGet, apiPatch, apiPost } from '@/services/apiClient';
import { UserProfile, UpdateProfileInput, ChangePasswordInput } from '../types';
import { API_ENDPOINTS } from '@shared';

export class ProfileService {
  static async getProfile() {
    return apiGet<UserProfile>(API_ENDPOINTS.AUTH.ME);
  }

  static async updateProfile(data: UpdateProfileInput) {
    return apiPatch<UserProfile>(API_ENDPOINTS.AUTH.ME, data);
  }

  static async changePassword(data: ChangePasswordInput) {
    // Backend AuthController has @Post('change-password')
    return apiPost<void>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }
}

