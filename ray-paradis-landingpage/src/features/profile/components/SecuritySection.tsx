import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck } from 'lucide-react';
import { changePasswordSchema, ChangePasswordInput } from '../types';
import { useChangePassword } from '../hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export const SecuritySection: React.FC = () => {
  const [isChanging, setIsChanging] = useState(false);
  const { mutate: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword(data, {
      onSuccess: () => {
        setIsChanging(false);
        reset();
      },
    });
  };

  return (
    <section className="bg-surface-container-lowest p-10 shadow-luxury mt-8">
      <div className="flex items-center gap-4 mb-10">
        <h2 className="text-3xl font-display italic text-primary leading-none">
          Security
        </h2>
        <ShieldCheck className="w-5 h-5 text-primary/40 stroke-[1.2]" />
      </div>

      <div className="space-y-8">
        {!isChanging ? (
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">Password</Label>
              <p className="text-xl font-body text-primary/90 tracking-[0.3em]">••••••••</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsChanging(true)}
              className="rounded-none border-primary/20 hover:bg-primary/5 tracking-widest uppercase text-[10px] h-10 px-6"
            >
              Change Password
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">Current Password</Label>
                <Input
                  type="password"
                  {...register('currentPassword')}
                  className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-500 font-body"
                />
                {errors.currentPassword && <p className="text-[10px] text-destructive uppercase tracking-widest">{errors.currentPassword.message}</p>}
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">New Password</Label>
                <Input
                  type="password"
                  {...register('newPassword')}
                  className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-500 font-body"
                />
                {errors.newPassword && <p className="text-[10px] text-destructive uppercase tracking-widest">{errors.newPassword.message}</p>}
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground">Confirm New Password</Label>
                <Input
                  type="password"
                  {...register('confirmPassword')}
                  className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-500 font-body"
                />
                {errors.confirmPassword && <p className="text-[10px] text-destructive uppercase tracking-widest">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-on-primary hover:bg-primary/90 rounded-none h-12 px-8 tracking-widest uppercase text-xs"
              >
                {isPending ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsChanging(false);
                  reset();
                }}
                className="rounded-none h-12 px-8 tracking-widest uppercase text-xs hover:bg-primary/5"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
