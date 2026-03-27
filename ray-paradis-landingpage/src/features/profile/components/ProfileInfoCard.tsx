import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Check, X } from 'lucide-react';
import { updateProfileSchema, UpdateProfileInput, UserProfile } from '../types';
import { useUpdateProfile } from '../hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileInfoCardProps {
  user: UserProfile;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(data, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <section className="bg-surface-container-lowest p-10 shadow-luxury overflow-hidden">
      <div className="flex justify-between items-start mb-12">
        <h2 className="text-3xl font-display italic text-primary leading-none">
          Personal Information
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary/60 hover:text-primary transition-colors p-2"
            aria-label="Edit Profile"
          >
            <Edit3 className="w-5 h-5 stroke-[1.2]" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <div className="grid grid-cols-1 gap-10">
          {/* Full Name */}
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">Full Name</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  {...register('fullName')}
                  className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-500 font-body text-lg"
                />
                {errors.fullName && <p className="text-[10px] text-destructive uppercase tracking-widest">{errors.fullName.message}</p>}
              </div>
            ) : (
              <p className="text-xl font-body text-primary/90">{user.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">Email Address</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  {...register('email')}
                  className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-500 font-body text-lg"
                />
                {errors.email && <p className="text-[10px] text-destructive uppercase tracking-widest">{errors.email.message}</p>}
              </div>
            ) : (
              <p className="text-xl font-body text-primary/90">{user.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-4">
            <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">Phone Number</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  {...register('phone')}
                  className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-500 font-body text-lg"
                  placeholder="+33 1 23 45 67 89"
                />
                {errors.phone && <p className="text-[10px] text-destructive uppercase tracking-widest">{errors.phone.message}</p>}
              </div>
            ) : (
              <p className="text-xl font-body text-primary/90">{user.phone || 'Not provided'}</p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-4 pt-6"
            >
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-on-primary hover:bg-primary/90 rounded-none h-12 px-8 tracking-widest uppercase text-xs"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="rounded-none h-12 px-8 tracking-widest uppercase text-xs hover:bg-primary/5"
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </section>
  );
};
