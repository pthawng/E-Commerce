import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../services/ProfileService';
import { UpdateProfileInput, ChangePasswordInput } from '../types';
import { toast } from 'sonner';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => ProfileService.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => ProfileService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      toast.success('Profile updated successfully');
    },
    onError: (error: unknown) => {
      const errObj = error as { message?: string };
      toast.error(errObj.message || 'Failed to update profile');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) => ProfileService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: unknown) => {
      const errObj = error as { message?: string };
      toast.error(errObj.message || 'Failed to change password');
    },
  });
};
