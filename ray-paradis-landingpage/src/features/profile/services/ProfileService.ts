import { apiGet, apiPatch } from '@/services/apiClient';
import { UserProfile, UpdateProfileInput, ChangePasswordInput } from '../types';

export class ProfileService {
  static async getProfile() {
    return apiGet<UserProfile>('me');
  }

  static async updateProfile(data: UpdateProfileInput) {
    return apiPatch<UserProfile>('me', data);
  }

  static async changePassword(data: ChangePasswordInput) {
    return apiPatch<void>('me/password', data);
  }
}
