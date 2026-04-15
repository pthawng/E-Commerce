import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/hooks/useTranslation';
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
  const { t } = useTranslation();
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
    <section className="bg-surface-container-lowest p-8 sm:p-12 shadow-luxury overflow-hidden border border-primary/5">
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-display italic text-primary leading-tight">
            {t('account.sections.personalInfo')}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t('account.labels.manageCredentials')}</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-2 text-primary/40 hover:text-primary transition-all duration-500 py-2 px-4 border border-transparent hover:border-primary/10"
            aria-label={t('actions.edit')}
          >
            <span className="text-[9px] uppercase tracking-ultra opacity-0 group-hover:opacity-100 transition-opacity duration-500">{t('account.actions.edit')}</span>
            <Edit3 className="w-4 h-4 stroke-[1.2]" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Full Name */}
          <div className="space-y-4">
            <Label className="text-[9px] uppercase tracking-ultra text-muted-foreground/60">{t('account.labels.fullName')}</Label>
            <div className="min-h-[40px] flex items-center">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Input
                    {...register('fullName')}
                    className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-700 font-body text-lg h-10"
                    autoFocus
                  />
                  <AnimatePresence>
                    {errors.fullName && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[9px] text-destructive uppercase tracking-widest"
                      >
                        {errors.fullName.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-lg font-body text-primary/90 animate-in fade-in duration-700">{user.fullName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-4">
            <Label className="text-[9px] uppercase tracking-ultra text-muted-foreground/60">{t('account.labels.email')}</Label>
            <div className="min-h-[40px] flex items-center">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Input
                    {...register('email')}
                    className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-700 font-body text-lg h-10"
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[9px] text-destructive uppercase tracking-widest"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-lg font-body text-primary/90 animate-in fade-in duration-700">{user.email}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-4">
            <Label className="text-[9px] uppercase tracking-ultra text-muted-foreground/60">{t('account.labels.phone')}</Label>
            <div className="min-h-[40px] flex items-center">
              {isEditing ? (
                <div className="w-full space-y-2">
                  <Input
                    {...register('phone')}
                    className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-700 font-body text-lg h-10"
                    placeholder="+1 234 567 890"
                  />
                  <AnimatePresence>
                    {errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[9px] text-destructive uppercase tracking-widest"
                      >
                        {errors.phone.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-lg font-body text-primary/90 animate-in fade-in duration-700">{user.phone || '—'}</p>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-8 pt-6 border-t border-primary/5"
            >
              <button
                type="submit"
                disabled={isPending}
                className="relative group px-10 py-3 bg-primary text-primary-foreground overflow-hidden transition-all duration-500"
              >

                <span className="relative z-10 text-[10px] tracking-ultra uppercase">
                  {isPending ? t('account.messages.processing') : t('account.actions.commit')}
                </span>
                <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="text-[10px] tracking-ultra uppercase text-primary/40 hover:text-primary transition-colors duration-500 border-b border-transparent hover:border-primary/20 pb-1"
              >
                {t('account.actions.discard')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </section>
  );
};

